# Agent 04: Test Executor

## Purpose
Execute generated test cases (both automated and manual), collect results, and identify failures.

## Consolidated Functionality
- **Manual Test Execution** (from original agent 07)
- **Smoke Test Execution** (from original agent 05)
- **Regression Test Execution** (from original agent 06)
- **Environment Provisioning**
- **Log & Screenshot Collection**

## Inputs
- Test case definitions (from Test Case Generator)
- Application URL and authentication credentials
- Target environment (dev, staging, prod)

## Process

### 1. Environment Setup
- Verify target URL is accessible
- Validate authentication credentials
- Check environment readiness (no ongoing deployments)

### 2. Smoke Test Execution
- Run smoke tests first (10-15 cases)
- Fail fast if smoke tests don't pass
- Generate initial pass/fail report

### 3. Regression Suite Execution (if smoke passes)
- Parallelize test runs across 4 workers minimum
- Collect console logs, network HAR files, screenshots
- Retry failed tests once to detect flakiness

### 4. Result Collection
- Log pass/fail/skipped counts
- Capture screenshots on failure
- Record execution time per case
- Preserve video recordings of failures

## Output Format
```json
{
  "executionId": "EXEC-20260611-001",
  "startTime": "2026-06-11T10:30:00Z",
  "endTime": "2026-06-11T11:08:00Z",
  "environment": "staging",
  "summary": {
    "total": 73,
    "passed": 70,
    "failed": 3,
    "skipped": 0,
    "passRate": "95.9%"
  },
  "failures": [
    {
      "testCaseId": "TC-045",
      "testName": "Payment processing timeout",
      "error": "TimeoutError: element not found",
      "screenshot": "artifacts/TC-045-failure.png",
      "logs": "artifacts/TC-045-logs.txt",
      "retried": true,
      "flakyIndicator": "FLAKY (first run failed, second run passed)"
    }
  ],
  "artifacts": {
    "htmlReport": "artifacts/execution-report.html",
    "videoFile": "artifacts/execution-video.webm",
    "logsDir": "artifacts/logs/",
    "screenshotsDir": "artifacts/screenshots/"
  }
}
```

## Vercel Integration
- Runs as scheduled serverless function
- Webhook triggers on deployment to staging/prod
- Stores artifacts in cloud storage (S3/GCS)
- Posts results to Slack/Teams via webhook

## Environment Variables
```
TEST_URL=https://app.staging.example.com
TEST_TIMEOUT=30000
WORKERS=4
RETRY_FAILED=true
CAPTURE_VIDEO=true
SEND_WEBHOOK=true
WEBHOOK_URL=https://alerts.example.com/test-results
```

## Notes
- Use headless Chrome by default for CI/CD
- Capture network traffic for performance analysis
- Tag flaky tests for investigation
- Don't fail CI/CD on flaky tests; report separately
