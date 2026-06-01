/**
 * Test-case generation engine.
 *
 * Cases are derived from a PRD's feature list, so different PRDs produce
 * different suites. Given N features, each feature yields 9 positive,
 * 4 negative, and 2 edge cases (15/feature), keeping totals deterministic
 * and traceable to the source document.
 */

export type CaseType = 'Positive' | 'Negative' | 'Edge';
export type Priority = 'P0 - Critical' | 'P1 - High' | 'P2 - Medium' | 'P3 - Low';

export interface TestCase {
  id: string;
  title: string;
  feature: string;
  type: CaseType;
  priority: Priority;
  preconditions: string;
  steps: string;
  testData: string;
  expectedResult: string;
  acRef: string;
}

/** Rich, human-sounding copy for well-known feature names. */
const KNOWN_COPY: Record<string, { action: string; data: string; expect: string }> = {
  Authentication: {
    action: 'navigate to the login page and submit credentials',
    data: 'username=qa_user, password=Valid@123',
    expect: 'the user is authenticated and redirected to the dashboard',
  },
  Login: {
    action: 'submit valid login credentials',
    data: 'username=qa_user, password=Valid@123',
    expect: 'the user is signed in successfully',
  },
  'Shopping Cart': {
    action: 'add an in-stock product to the cart and view the cart',
    data: 'SKU=PRD-1001, qty=2',
    expect: 'the item appears in the cart with the correct quantity and subtotal',
  },
  Checkout: {
    action: 'proceed through the checkout flow with a valid address',
    data: 'address=221B Baker St, shipping=Standard',
    expect: 'the order summary shows the correct totals and shipping option',
  },
  Payment: {
    action: 'submit payment using a valid card',
    data: 'card=4111 1111 1111 1111, exp=12/29, cvv=123',
    expect: 'the payment is authorised and a confirmation number is returned',
  },
  'Order Management': {
    action: 'open the order history and view an order',
    data: 'orderId=ORD-50012',
    expect: 'the order details and status are displayed accurately',
  },
  Search: {
    action: 'enter a query and run a search',
    data: 'query="wireless headphones"',
    expect: 'relevant results are returned and ranked correctly',
  },
  Notifications: {
    action: 'trigger an event that should notify the user',
    data: 'channel=email, event=order_shipped',
    expect: 'the notification is delivered through the chosen channel',
  },
};

function copyFor(feature: string): { action: string; data: string; expect: string } {
  return (
    KNOWN_COPY[feature] ?? {
      action: `exercise the ${feature} functionality with valid input`,
      data: `valid ${feature.toLowerCase()} input`,
      expect: `${feature} behaves exactly as specified in the requirements`,
    }
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function priorityFor(feature: string, type: CaseType, criticalFeatures: string[]): Priority {
  if (type === 'Positive' && criticalFeatures.includes(feature)) return 'P0 - Critical';
  if (type === 'Positive') return 'P1 - High';
  if (type === 'Negative') return 'P2 - Medium';
  return 'P3 - Low';
}

const TYPE_BUILDERS: Record<
  CaseType,
  (f: string, c: { action: string; data: string; expect: string }) => Pick<
    TestCase,
    'title' | 'preconditions' | 'steps' | 'testData' | 'expectedResult'
  >
> = {
  Positive: (f, c) => ({
    title: `${f}: valid flow succeeds`,
    preconditions: 'User has a valid account; system is in a known good state.',
    steps: `1. Open the ${f} module.\n2. ${cap(c.action)}.\n3. Confirm the result.`,
    testData: c.data,
    expectedResult: `Successfully completes — ${c.expect}.`,
  }),
  Negative: (f, c) => ({
    title: `${f}: invalid input is rejected`,
    preconditions: 'User is on the relevant screen with invalid/incomplete data.',
    steps: `1. Open the ${f} module.\n2. Attempt to ${c.action} with invalid data.\n3. Observe the error handling.`,
    testData: `${c.data} → tampered to INVALID`,
    expectedResult:
      'A clear validation error is shown; the action is blocked and no state changes.',
  }),
  Edge: (f, c) => ({
    title: `${f}: boundary / edge condition handled`,
    preconditions: 'System is at a boundary condition (limits, empty, max values).',
    steps: `1. Open the ${f} module.\n2. ${cap(c.action)} at the boundary limit.\n3. Verify graceful handling.`,
    testData: `${c.data} (boundary value)`,
    expectedResult:
      'The boundary case is handled gracefully without crashes or data corruption.',
  }),
};

/** Cases generated per feature, by type. */
const PER_FEATURE: Array<[CaseType, number]> = [
  ['Positive', 9],
  ['Negative', 4],
  ['Edge', 2],
];

export interface CaseSetOptions {
  /** Features considered business-critical (their positives become P0). */
  criticalFeatures?: string[];
  /** Prefix for case ids, e.g. "TC". */
  idPrefix?: string;
}

/**
 * Generate the full test-case set for a list of features.
 * For 5 features → 45 positive, 20 negative, 10 edge = 75 cases.
 */
export function generateTestCasesForFeatures(
  features: string[],
  opts: CaseSetOptions = {}
): TestCase[] {
  const critical = opts.criticalFeatures ?? features.slice(0, 2);
  const prefix = opts.idPrefix ?? 'TC';
  const cases: TestCase[] = [];
  let n = 0;
  let acCounter = 0;

  for (const [type, count] of PER_FEATURE) {
    for (const feature of features) {
      const copy = copyFor(feature);
      for (let i = 0; i < count; i++) {
        n += 1;
        acCounter += 1;
        const built = TYPE_BUILDERS[type](feature, copy);
        cases.push({
          id: `${prefix}-${String(n).padStart(3, '0')}`,
          feature,
          type,
          priority: priorityFor(feature, type, critical),
          acRef: `AC-${String(((acCounter - 1) % (features.length * 7)) + 1).padStart(2, '0')}`,
          ...built,
        });
      }
    }
  }
  return cases;
}

/** Smoke subset: positive P0/P1 cases of the critical features, capped. */
export function smokeFromCases(cases: TestCase[], cap = 9): TestCase[] {
  const smoke = cases.filter(
    (c) =>
      c.type === 'Positive' &&
      (c.priority === 'P0 - Critical' || c.priority === 'P1 - High')
  );
  return smoke.slice(0, cap).map((c, i) => ({
    ...c,
    id: `SMK-${String(i + 1).padStart(3, '0')}`,
    title: c.title.replace('valid flow succeeds', 'critical-path smoke check'),
  }));
}

/** Regression suite: positives + negatives (stable core), excluding edges. */
export function regressionFromCases(cases: TestCase[]): TestCase[] {
  const core = cases.filter((c) => c.type !== 'Edge');
  return core.map((c, i) => ({
    ...c,
    id: `REG-${String(i + 1).padStart(3, '0')}`,
  }));
}

// ── Backwards-compatible default (e-commerce) helpers ───────────────
const DEFAULT_FEATURES = [
  'Authentication',
  'Shopping Cart',
  'Checkout',
  'Payment',
  'Order Management',
];

export function generateTestCases(): TestCase[] {
  return generateTestCasesForFeatures(DEFAULT_FEATURES, {
    criticalFeatures: ['Authentication', 'Payment'],
  });
}

export function generateSmokeCases(): TestCase[] {
  return smokeFromCases(generateTestCases());
}

export function generateRegressionCases(): TestCase[] {
  return regressionFromCases(generateTestCases());
}
