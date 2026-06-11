# Agent 07: Code Reviewer

## Purpose
Review generated Playwright automation code for quality, maintainability, and best practices.

## Inputs
- Generated Playwright test files (from Automation Developer)
- Coding standards and best practices checklist
- Application domain knowledge

## Review Checklist

### 1. Selector Quality
- ✓ Uses `[data-testid]` locators (primary)
- ✓ Falls back to `[aria-label]` or role-based selectors
- ✗ Avoids XPath and fragile CSS selectors
- ✗ No hardcoded element indexes (`:nth-child(3)`)
- ✓ Locators remain stable across UI changes

### 2. Explicit Waits
- ✗ No hardcoded `sleep()` or `waitForTimeout()`
- ✓ Uses `page.waitForSelector()` or `expect().toBeVisible()`
- ✓ Appropriate timeout values (default 30s)
- ✓ Waits for element to be in correct state before interaction

### 3. Test Independence
- ✓ Each test is fully independent
- ✗ No shared state between tests
- ✓ `beforeEach()` sets up clean state
- ✓ `afterEach()` cleans up (logout, reset data)
- ✓ No test ordering dependencies

### 4. Assertions & Error Messages
- ✓ Clear, descriptive assertion messages
- ✓ Uses `expect()` with soft assertions where appropriate
- ✓ Verifies exact error text from requirements
- ✓ Assertion messages helpful for debugging

### 5. Data Management
- ✓ All test data in fixtures (not hardcoded in specs)
- ✓ Parameterized tests for BVA cases
- ✓ Test data realistic and representative
- ✗ No credentials hardcoded in source
- ✓ Sensitive data from environment variables

### 6. TypeScript Best Practices
- ✓ Strict TypeScript mode enabled
- ✓ All functions have proper type annotations
- ✓ Interfaces defined for page objects and data
- ✓ No use of `any` type
- ✓ Proper return types on all methods

### 7. Page Object Model (POM)
- ✓ Clear separation of concerns (pages/ vs tests/)
- ✓ Page class constructor takes `page` parameter
- ✓ Methods abstract UI interactions
- ✓ No assertions in page object methods
- ✓ Reusable across multiple tests

### 8. Performance
- ✓ Parallel test execution enabled
- ✓ Minimal test data setup (avoid unnecessary DB calls)
- ✓ Efficient selectors (avoid complex CSS)
- ✓ Appropriate use of `goto()` vs page reuse
- ✓ Network request mocking where appropriate

### 9. Reliability (Anti-Flakiness)
- ✗ No race conditions (always wait for element)
- ✓ Handles dynamic content properly
- ✓ Handles network delays gracefully
- ✓ No random waits or time-dependent logic
- ✓ Proper retry strategy for flaky operations

### 10. Maintainability
- ✓ Code is DRY (Don't Repeat Yourself)
- ✓ Utility functions for common operations
- ✓ Clear comments explaining complex logic
- ✓ Consistent naming conventions
- ✓ File organization logical and discoverable

## Output Format

```json
{
  "reviewId": "CR-20260611-001",
  "timestamp": "2026-06-11T12:00:00Z",
  "filesReviewed": 12,
  "totalLines": 2847,
  "summary": {
    "overallGrade": "PASS with 4 suggestions",
    "blocker": 0,
    "major": 0,
    "minor": 4,
    "suggestions": 0
  },
  "findings": [
    {
      "severity": "MINOR",
      "file": "src/tests/payments.spec.ts",
      "line": 45,
      "issue": "Hard-coded wait(3000) instead of explicit waitFor",
      "code": "await page.waitForTimeout(3000);",
      "recommendation": "Use: await page.waitForSelector('[data-testid=\"confirmation\"]', { timeout: 30000 });",
      "howToFix": "Replace hardcoded wait with element-based wait"
    },
    {
      "severity": "SUGGESTION",
      "file": "src/pages/CartPage.ts",
      "line": 78,
      "issue": "Repeated selector string across methods",
      "code": "[data-testid=\"remove-btn\"]",
      "recommendation": "Define as class constant: REMOVE_BUTTON = '[data-testid=\"remove-btn\"]'",
      "howToFix": "Extract repeated selectors to class constants"
    },
    {
      "severity": "MINOR",
      "file": "src/tests/auth.spec.ts",
      "line": 22,
      "issue": "No description message in assertion",
      "code": "expect(error).toBe('Invalid credentials');",
      "recommendation": "expect(error).toBe('Invalid credentials', 'Should show error for invalid password');",
      "howToFix": "Add message parameter to expect()"
    },
    {
      "severity": "SUGGESTION",
      "file": "src/utils/helpers.ts",
      "line": 10,
      "issue": "Function lacks JSDoc comment",
      "code": "export async function fillForm(page, data) {",
      "recommendation": "Add JSDoc: /**\n * Fills form fields with provided test data\n * @param page - Playwright Page object\n * @param data - Form field values\n */",
      "howToFix": "Add JSDoc documentation"
    }
  ],
  "codeQualityMetrics": {
    "selectorQuality": "95%",
    "testIndependence": "100%",
    "typeScriptStrictness": "100%",
    "waitHandling": "92%",
    "assertionClarity": "88%",
    "pomAdherence": "98%",
    "overallScore": "95%"
  },
  "recommendations": [
    "Consider adding visual regression testing (Percy or similar)",
    "Implement API mocking for performance testing scenarios",
    "Add cross-browser testing (Firefox, WebKit) to CI/CD",
    "Document custom helpers in CONTRIBUTING.md"
  ],
  "nextSteps": [
    "Address 4 minor issues (estimated 30 min)",
    "Run full test suite locally for final validation",
    "Merge to qa/automation branch",
    "Trigger integration test run in CI/CD"
  ],
  "approvalStatus": "APPROVED with minor fixes requested"
}
```

## Review Workflow
1. **Automated Analysis** — Parse files, check structure, detect anti-patterns
2. **Manual Review** — Verify business logic and test completeness
3. **Feedback** — Provide actionable suggestions with examples
4. **Re-review** — Confirm fixes before approval
5. **Merge Gate** — Can merge only after code review approval

## Common Issues & Fixes

| Issue | Severity | Fix |
|-------|----------|-----|
| Hard-coded waits | Minor | Use waitForElement() |
| Fragile selectors | Major | Add data-testid to app |
| Test state sharing | Blocker | Add beforeEach cleanup |
| Hardcoded credentials | Blocker | Use fixtures/env vars |
| Missing assertions | Minor | Add expect() statements |
| No error messages | Suggestion | Add message param |

## Outputs
- Code review report (JSON)
- Summary of findings (human-readable)
- Approval status (APPROVED / APPROVED_WITH_FIXES / REJECTED)
- Action items for developer

## Notes
- Focus on maintainability and reliability
- Flakiness is the #1 killer of automation projects
- Clear code > clever code
- Test code should be as production-quality as app code
