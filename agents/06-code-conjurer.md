# Agent 06: Code Conjurer

## Purpose
Conjure elegant, maintainable automation code from test cases. Generates Playwright tests using Page Object Model pattern with robust selectors and best practices.

## Input
- Test cases and execution failures
- Test framework configuration (Playwright)
- Code quality standards

## Process
1. Create Page Object Model for each page
2. Map test steps to Playwright actions
3. Select optimal CSS/XPath selectors
4. Add wait strategies and error handling
5. Generate test specs following best practices
6. Create fixture data and test data generators

## Output Format
```
tests/
  pages/
    LoginPage.ts
    DashboardPage.ts
  specs/
    auth.spec.ts
    payment.spec.ts
  fixtures/
    testData.ts
```

## Success Metrics
- 100% of critical tests automated
- Page Object Model implemented
- Zero hard-coded waits
- Flakiness < 1%
