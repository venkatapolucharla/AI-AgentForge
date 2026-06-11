# Agent 05: Defect Analyser

## Purpose
Analyze test execution failures, classify root causes, and prepare defect reports.

## Consolidated Functionality
- **Failure Analysis** (from original agent 08)
- **Defect Creation** (from original agent 09)
- **Root Cause Classification**
- **Severity Assessment**
- **JIRA Defect Drafting**

## Inputs
- Test execution results (from Test Executor)
- Failed test cases with logs/screenshots
- Related test cases and stories

## Process

### 1. Failure Log Analysis
- Parse test execution logs
- Extract error messages and stack traces
- Identify common patterns across failures

### 2. Root Cause Classification
Classify each failure as:
- **Product Defect** — Issue in application code
- **Test Defect** — Issue in test case or automation
- **Environment Issue** — Infrastructure/configuration issue
- **Flaky Test** — Intermittent, not consistent

### 3. Severity & Priority Assessment
- **High**: Critical path broken, user impact, data loss
- **Medium**: Feature partially broken, workaround exists
- **Low**: UI cosmetic, documentation, edge case

### 4. Defect Report Drafting
- Generate JIRA issue JSON ready for creation
- Include:
  - Descriptive title
  - Detailed reproduction steps
  - Actual vs. expected results
  - Screenshots and logs
  - Links to failing test cases
  - Links to parent stories/epics

### 5. Flakiness Detection
- Mark tests that passed on retry
- Report flakiness separately (don't create defects)
- Flag for investigation in next sprint

## Output Format
```json
{
  "analysisId": "DEF-ANALYSIS-20260611-001",
  "timestamp": "2026-06-11T11:15:00Z",
  "analysisCount": 3,
  "defects": [
    {
      "defectId": "TEMP-001",
      "title": "[Payment] Transaction timeout on submit",
      "type": "Product Defect",
      "severity": "High",
      "priority": "P0",
      "rootCause": "Backend API timeout (30s)",
      "component": "Payment Processing",
      "description": "When submitting payment with balance > $10,000, backend takes >30s and times out.",
      "stepsToReproduce": [
        "1. Log in as admin",
        "2. Navigate to Payment page",
        "3. Enter amount: $15,000",
        "4. Click Submit",
        "5. Wait 35 seconds"
      ],
      "expectedResult": "Payment processed and confirmation shown",
      "actualResult": "Timeout error shown, payment not processed",
      "screenshots": ["artifacts/defect-001-screen1.png"],
      "logs": ["artifacts/defect-001-logs.txt"],
      "linkedTestCases": ["TC-045"],
      "linkedStories": ["QA-105"],
      "jiraIssue": {
        "project": "QA",
        "issueType": "Bug",
        "summary": "[Payment] Transaction timeout on submit",
        "description": "When submitting payment with balance > $10,000...",
        "priority": "High",
        "labels": ["payment", "timeout", "regression"],
        "components": ["Payment Processing"],
        "customFields": {
          "Environment": "staging",
          "BrowsersAffected": ["Chrome", "Firefox"],
          "Reproducibility": "Always"
        }
      }
    },
    {
      "defectId": "TEMP-002",
      "title": "[UI] Cart total calculation incorrect",
      "type": "Product Defect",
      "severity": "Medium",
      "priority": "P1",
      "rootCause": "Decimal rounding error in cart calculation",
      "component": "Shopping Cart",
      "description": "Cart subtotal shows incorrect amount for certain decimal prices",
      "stepsToReproduce": [
        "1. Add item priced at $19.99",
        "2. Add item priced at $14.99",
        "3. Check cart subtotal"
      ],
      "expectedResult": "Subtotal: $34.98",
      "actualResult": "Subtotal: $34.97",
      "screenshots": ["artifacts/defect-002-screen1.png"],
      "logs": "N/A",
      "linkedTestCases": ["TC-032"],
      "linkedStories": ["QA-108"],
      "jiraIssue": { }
    }
  ],
  "flakyTests": [
    {
      "testCaseId": "TC-067",
      "testName": "Email delivery verification",
      "failureRate": "20% (1 of 5 runs)",
      "note": "Intermittent SMTP connection timeout. Recommend retry strategy.",
      "recommendedAction": "Increase SMTP timeout to 15s"
    }
  ],
  "testDefects": [
    {
      "testCaseId": "TC-061",
      "testName": "Admin permission boundary",
      "issue": "Hard-coded wait of 3s instead of waitForElement()",
      "recommendation": "Update test to use explicit wait"
    }
  ]
}
```

## JIRA Integration
- Reads defect template from config/jira.config.js
- Prepares issue payload for JIRA Story Creator or direct API call
- Links defects to parent stories automatically

## Outputs
- Defect analysis report (JSON)
- JIRA issue payloads (ready to create)
- Flakiness report (for sprint retrospective)
- Root cause summary (for dev team)

## Notes
- High severity defects require immediate attention
- Flaky tests should be investigated before marking as blocker
- Always provide screenshots/logs with defect reports
- Link defects to root feature story for traceability
