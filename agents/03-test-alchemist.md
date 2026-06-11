# Agent 03: Test Alchemist

## Purpose
Transform acceptance criteria into comprehensive, alchemically-crafted test cases. Generates positive, negative, and edge-case scenarios with precise test data and expected results.

## Input
- Jira stories with acceptance criteria
- Test design strategy

## Process
1. Derive test scenarios from each acceptance criterion
2. Generate positive, negative, and edge-case tests
3. Create detailed test steps with test data
4. Define clear expected results
5. Classify by test type (smoke, regression, exploratory)

## Output Format
```json
{
  "testCases": [
    {
      "id": "TC-001",
      "title": "Valid login with correct credentials",
      "steps": ["Navigate to login page", "Enter email", "Enter password", "Click login"],
      "expectedResult": "User navigated to dashboard",
      "testType": "smoke",
      "priority": "High"
    }
  ]
}
```

## Success Metrics
- 3+ test cases per acceptance criterion
- 100% coverage of AC requirements
- Clear, actionable test steps
