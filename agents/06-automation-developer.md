# Agent 06: Automation Developer

## Purpose
Generate production-ready Playwright TypeScript automation tests from test case definitions.

## Confirmation Gate ⚠️
BEFORE generating code, show:
- Number of test files to be created
- Test file names (e.g., `tests/auth.spec.ts`, `tests/payments.spec.ts`)
- Estimated coverage percentage
- Estimated lines of code

Then ask: **"Confirm automation code generation for X test cases? (yes/no)"**

Only proceed on explicit **"yes"** response.

## Inputs
- Test case definitions (from Test Case Generator)
- Application URL
- Authentication credentials
- Page element selectors/locators

## Framework Architecture

### Directory Structure
```
src/
├── tests/
│   ├── auth.spec.ts
│   ├── payments.spec.ts
│   ├── cart.spec.ts
│   └── ...
├── pages/
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── PaymentPage.ts
│   └── ...
├── fixtures/
│   ├── testData.ts
│   ├── auth.fixture.ts
│   └── ...
├── utils/
│   ├── logger.ts
│   ├── helpers.ts
│   └── ...
├── playwright.config.ts
└── README.md
```

## Coding Standards

### Page Object Model (POM)
```typescript
export class LoginPage {
  constructor(private page: Page) {}
  
  async navigateTo() {
    await this.page.goto('/login');
  }
  
  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email"]', email);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.click('[data-testid="submit-btn"]');
    await this.page.waitForNavigation();
  }
  
  async getErrorMessage(): Promise<string> {
    return this.page.textContent('[data-testid="error-message"]') ?? '';
  }
}
```

### Test Structure
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { testData } from '../fixtures/testData';

test.describe('Authentication', () => {
  let loginPage: LoginPage;
  
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigateTo();
  });
  
  test('TC-001: Valid credentials login', async () => {
    await loginPage.login(testData.validEmail, testData.validPassword);
    // assertions...
  });
  
  test('TC-002: Invalid password rejection', async () => {
    await loginPage.login(testData.validEmail, 'wrongPassword');
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Invalid credentials');
  });
});
```

### Best Practices
- ✓ Use `[data-testid]` locators (stable, maintainable)
- ✓ Use `[aria-label]` or role-based selectors as fallback
- ✓ Avoid XPath and fragile CSS selectors
- ✓ Explicit waits with `waitForElement()` or `expect().toBeVisible()`
- ✓ No hardcoded `sleep()` — use waitFor instead
- ✓ Independent tests — no shared state between test cases
- ✓ Data-driven tests using fixtures
- ✓ Parameterized test data (never hardcoded in specs)
- ✓ Clear, descriptive assertion messages
- ✓ Proper error logging for troubleshooting

## Output Format

### File List (Example)
```
1. src/pages/BasePage.ts (86 lines)
2. src/pages/LoginPage.ts (124 lines)
3. src/pages/PaymentPage.ts (156 lines)
4. src/tests/auth.spec.ts (234 lines)
5. src/tests/payments.spec.ts (267 lines)
6. src/fixtures/testData.ts (89 lines)
7. src/utils/logger.ts (45 lines)
8. src/playwright.config.ts (78 lines)
```

### Generated Code
- Complete file content for each file (no placeholders)
- All imports and dependencies resolved
- Ready to run: `npm install && npm run test`

## Outputs
- Complete Playwright test suite (TypeScript)
- Page Object Model classes
- Test fixtures and test data
- README with setup and execution instructions
- .zip archive with all files (optional)

## Playwright Configuration
```typescript
export default defineConfig({
  testDir: './src/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
});
```

## Environment Variables
```
TEST_URL=https://app.staging.example.com
HEADLESS=true
BROWSER=chromium
WORKERS=4
RETRIES=1
SCREENSHOT=on-failure
VIDEO=retain-on-failure
```

## Vercel Integration
- Runs as CI/CD step via GitHub Actions
- Generates HTML report in `playwright-report/`
- Uploads report as artifact
- Fails build if critical tests fail

## Notes
- Every test case produces at least one spec
- BVA test cases generate parameterized tests
- Security test cases properly handle special characters
- Error message tests verify exact expected text
- Generated code is lint-clean and ready to merge
