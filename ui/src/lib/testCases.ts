/**
 * Structured test-case dataset for the Test Case Generator (agent 04).
 *
 * The agent's summary output is "78 test cases (45 positive, 21 negative,
 * 12 edge), 100% AC coverage". This module materialises that summary into
 * concrete rows so the user can download a real test-case document.
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

/** Feature areas the cases are distributed across. */
const FEATURES = [
  'Authentication',
  'Shopping Cart',
  'Checkout',
  'Payment',
  'Order Management',
] as const;

type Feature = (typeof FEATURES)[number];

/** Per-feature copy used to make each generated row read realistically. */
const FEATURE_COPY: Record<
  Feature,
  { action: string; data: string; expect: string }
> = {
  Authentication: {
    action: 'navigate to the login page and submit credentials',
    data: 'username=qa_user, password=Valid@123',
    expect: 'the user is authenticated and redirected to the dashboard',
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
};

const TYPE_TEMPLATES: Record<
  CaseType,
  (f: Feature, copy: (typeof FEATURE_COPY)[Feature]) => Pick<
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
    testData: c.data.replace(/Valid@123|4111 1111 1111 1111|PRD-1001/, 'INVALID'),
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

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function priorityFor(feature: Feature, type: CaseType): Priority {
  if (type === 'Positive' && (feature === 'Payment' || feature === 'Authentication'))
    return 'P0 - Critical';
  if (type === 'Positive') return 'P1 - High';
  if (type === 'Negative') return 'P2 - Medium';
  return 'P3 - Low';
}

/**
 * Generate the full, deterministic test-case set: 45 positive, 21 negative,
 * 12 edge = 78 cases, round-robin across the five feature areas.
 */
export function generateTestCases(): TestCase[] {
  const distribution: Array<[CaseType, number]> = [
    ['Positive', 45],
    ['Negative', 21],
    ['Edge', 12],
  ];

  const cases: TestCase[] = [];
  let n = 0;

  for (const [type, count] of distribution) {
    for (let i = 0; i < count; i++) {
      const feature = FEATURES[n % FEATURES.length];
      const copy = FEATURE_COPY[feature];
      const t = TYPE_TEMPLATES[type](feature, copy);
      n += 1;
      cases.push({
        id: `TC-${String(n).padStart(3, '0')}`,
        feature,
        type,
        priority: priorityFor(feature, type),
        acRef: `AC-${String(((n - 1) % 34) + 1).padStart(2, '0')}`,
        ...t,
      });
    }
  }

  return cases;
}

/**
 * The smoke suite: 9 critical-path tests covering login, checkout, and
 * payment happy paths — matching the Smoke Identifier's output. Selected
 * from the positive P0/P1 cases of the critical features.
 */
export function generateSmokeCases(): TestCase[] {
  const all = generateTestCases();
  const critical = ['Authentication', 'Checkout', 'Payment'];
  const smoke = all.filter(
    (c) =>
      c.type === 'Positive' &&
      critical.includes(c.feature) &&
      (c.priority === 'P0 - Critical' || c.priority === 'P1 - High')
  );
  // Cap at 9 and renumber as SMK-xxx for the smoke document.
  return smoke.slice(0, 9).map((c, i) => ({
    ...c,
    id: `SMK-${String(i + 1).padStart(3, '0')}`,
    title: c.title.replace('valid flow succeeds', 'critical-path smoke check'),
  }));
}

/**
 * The regression suite: 64 cases across the 5 areas, excluding low-value
 * edge duplicates — matching the Regression Builder's output. Renumbered
 * as REG-xxx for the regression document.
 */
export function generateRegressionCases(): TestCase[] {
  const all = generateTestCases();
  // Keep positives + negatives (the stable regression core), drop edge cases,
  // then take 64 to match the published suite size.
  const core = all.filter((c) => c.type !== 'Edge').slice(0, 64);
  return core.map((c, i) => ({
    ...c,
    id: `REG-${String(i + 1).padStart(3, '0')}`,
  }));
}
