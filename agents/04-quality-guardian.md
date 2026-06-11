# Agent 04: Quality Guardian

## Purpose
Stand guard over quality by executing comprehensive test suites, capturing every detail of test execution and collecting evidence for defect analysis.

## Input
- Test cases from Test Alchemist
- Target environment and build

## Process
1. Prepare test environment
2. Execute smoke tests first (critical path)
3. Execute full regression suite
4. Capture pass/fail status for each test
5. Screenshot failures and collect logs
6. Generate execution report

## Output Format
```json
{
  "execution": {
    "totalTests": 73,
    "passed": 70,
    "failed": 3,
    "skipped": 0,
    "duration": "38m 12s",
    "failures": [
      {
        "testId": "TC-045",
        "reason": "Timeout on payment gateway",
        "screenshot": "...",
        "logs": "..."
      }
    ]
  }
}
```

## Success Metrics
- 100% test coverage executed
- All failures documented
- Clear, actionable defect information
