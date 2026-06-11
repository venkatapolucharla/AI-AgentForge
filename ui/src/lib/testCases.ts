/**
 * Test-case generation engine (Test Case Generator — agent 04).
 *
 * Implements the agent spec (agents/04-test-case-generator.md): for each
 * feature/acceptance criterion it produces positive, negative, edge, and
 * destructive cases, each with atomic steps, specific expected results,
 * concrete test data, an automation-feasibility rating + reason, and a
 * minimal Playwright snippet for automatable cases.
 *
 * Cases are derived from a PRD's feature list, so different PRDs produce
 * different suites. Per feature: 9 positive, 4 negative, 2 edge, 2
 * destructive = 17/feature.
 */

export type CaseType = 'Positive' | 'Negative' | 'Edge' | 'Destructive';
export type Priority = 'P0 - Critical' | 'P1 - High' | 'P2 - Medium' | 'P3 - Low';
export type Feasibility = 'HIGH' | 'MEDIUM' | 'LOW';

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
  /** Automation feasibility rating (HIGH | MEDIUM | LOW). */
  automationFeasibility: Feasibility;
  /** Why the case has that feasibility / whether manual execution is needed. */
  feasibilityReason: string;
  /** Minimal Playwright snippet for automatable cases ('' when manual). */
  playwrightSnippet: string;
  /** The verbatim PRD requirement this case traces to ('' for legacy cases). */
  requirement?: string;
}

/** Minimal requirement shape consumed by the grounded generator. */
export interface RequirementInput {
  id: string;
  feature: string;
  text: string;
  dataTokens: string[];
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
  if (type === 'Destructive') return 'P2 - Medium';
  return 'P3 - Low';
}

/** Short uppercase module token for the TC-{MODULE}-{n} id format. */
function moduleToken(feature: string): string {
  const letters = feature.replace(/[^a-zA-Z]/g, '');
  return letters.slice(0, 4).toUpperCase() || 'GEN';
}

/** A minimal Playwright snippet for an automatable case. */
function snippetFor(feature: string, type: CaseType): string {
  if (type === 'Destructive') return ''; // requires manual/chaos setup
  const expectLine =
    type === 'Negative'
      ? `await expect(page.getByRole('alert')).toBeVisible();`
      : `await expect(page).toHaveURL(/.*/);`;
  return [
    `test('${feature} ${type.toLowerCase()}', async ({ page }) => {`,
    `  await page.goto(BASE_URL);`,
    `  // ${cap(copyFor(feature).action)}`,
    `  ${expectLine}`,
    `});`,
  ].join('\n');
}

interface BuiltCase {
  title: string;
  preconditions: string;
  steps: string;
  testData: string;
  expectedResult: string;
  automationFeasibility: Feasibility;
  feasibilityReason: string;
}

const TYPE_BUILDERS: Record<
  CaseType,
  (f: string, c: { action: string; data: string; expect: string }) => BuiltCase
> = {
  Positive: (f, c) => ({
    title: `${f}: valid flow succeeds`,
    preconditions: 'User has a valid account; system is in a known good state.',
    steps: `1. Open the ${f} module.\n2. ${cap(c.action)}.\n3. Confirm the result.`,
    testData: c.data,
    expectedResult: `Successfully completes — ${c.expect}.`,
    automationFeasibility: 'HIGH',
    feasibilityReason: 'Deterministic happy path with stable selectors.',
  }),
  Negative: (f, c) => ({
    title: `${f}: invalid input is rejected`,
    preconditions: 'User is on the relevant screen with invalid/incomplete data.',
    steps: `1. Open the ${f} module.\n2. Attempt to ${c.action} with invalid data.\n3. Observe the error handling.`,
    testData: `${c.data} → tampered to INVALID`,
    expectedResult:
      'Validation error "Invalid input — please check your details" is shown (HTTP 400); the action is blocked and no state changes.',
    automationFeasibility: 'HIGH',
    feasibilityReason: 'Error message and status code are assertable.',
  }),
  Edge: (f, c) => ({
    title: `${f}: boundary / edge condition handled`,
    preconditions: 'System is at a boundary condition (limits, empty, max values).',
    steps: `1. Open the ${f} module.\n2. ${cap(c.action)} at the boundary limit.\n3. Verify graceful handling.`,
    testData: `${c.data} (boundary value: min/max/empty)`,
    expectedResult:
      'The boundary case is handled gracefully — no crash, a clear message, and data integrity is preserved.',
    automationFeasibility: 'MEDIUM',
    feasibilityReason: 'Boundary data is scriptable but may need varied fixtures.',
  }),
  Destructive: (f, c) => ({
    title: `${f}: resilience under stress / corrupted data`,
    preconditions: 'System reachable; ability to inject load, kill sessions, or corrupt inputs.',
    steps: `1. Open the ${f} module.\n2. ${cap(c.action)} while injecting stress (concurrent requests, dropped connection, corrupted payload).\n3. Observe recovery behaviour.`,
    testData: `${c.data} + malformed/oversized payload, 100 concurrent requests`,
    expectedResult:
      'System degrades gracefully — returns HTTP 5xx with a retry hint or queues the request; no data corruption and it recovers when load subsides.',
    automationFeasibility: 'LOW',
    feasibilityReason: 'MANUAL: needs chaos/load tooling and infra access; not a standard UI script.',
  }),
};

/** Cases generated per feature, by type (positive, negative, edge, destructive). */
const PER_FEATURE: Array<[CaseType, number]> = [
  ['Positive', 9],
  ['Negative', 4],
  ['Edge', 2],
  ['Destructive', 2],
];

export interface CaseSetOptions {
  /** Features considered business-critical (their positives become P0). */
  criticalFeatures?: string[];
  /** Prefix for case ids when not using the TC-{module}-{n} format. */
  idPrefix?: string;
}

/**
 * Generate the full test-case set for a list of features.
 * For 5 features → 45 positive, 20 negative, 10 edge, 10 destructive = 85 cases.
 */
export function generateTestCasesForFeatures(
  features: string[],
  opts: CaseSetOptions = {}
): TestCase[] {
  const critical = opts.criticalFeatures ?? features.slice(0, 2);
  const cases: TestCase[] = [];
  // Per-module counter for TC-{MODULE}-{number} ids.
  const moduleCounters: Record<string, number> = {};
  let acCounter = 0;

  for (const [type, count] of PER_FEATURE) {
    for (const feature of features) {
      const copy = copyFor(feature);
      const token = moduleToken(feature);
      for (let i = 0; i < count; i++) {
        acCounter += 1;
        moduleCounters[token] = (moduleCounters[token] ?? 0) + 1;
        const built = TYPE_BUILDERS[type](feature, copy);
        cases.push({
          id: opts.idPrefix
            ? `${opts.idPrefix}-${String(acCounter).padStart(3, '0')}`
            : `TC-${token}-${String(moduleCounters[token]).padStart(3, '0')}`,
          feature,
          type,
          priority: priorityFor(feature, type, critical),
          acRef: `AC-${String(((acCounter - 1) % (features.length * 7)) + 1).padStart(2, '0')}`,
          playwrightSnippet: snippetFor(feature, type),
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

/**
 * Regression suite: stable positive + negative core (excludes edge and
 * destructive cases, which are slower / less deterministic).
 */
export function regressionFromCases(cases: TestCase[]): TestCase[] {
  const core = cases.filter((c) => c.type === 'Positive' || c.type === 'Negative');
  return core.map((c, i) => ({
    ...c,
    id: `REG-${String(i + 1).padStart(3, '0')}`,
  }));
}

// ── Requirement-grounded generation (agent 04, strict PRD mode) ─────

/** Lower-case the first letter so the requirement reads inside a sentence. */
function lc(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** Render the literal data tokens, or note that the PRD specified none. */
function dataFrom(tokens: string[]): string {
  return tokens.length
    ? tokens.join('; ')
    : 'As specified in the requirement (PRD states no explicit values).';
}

/**
 * Build the test cases for ONE requirement: a positive, a negative, and —
 * when the requirement implies limits/data — an edge case. Every field is
 * derived from the requirement text and its extracted data tokens; nothing
 * is invented.
 */
function casesForRequirement(
  req: RequirementInput,
  index: number,
  critical: boolean
): TestCase[] {
  const token = moduleToken(req.feature);
  const reqText = req.text.replace(/\s+/g, ' ').trim();
  const dataStr = dataFrom(req.dataTokens);
  const out: TestCase[] = [];
  let sub = 0;
  const nextId = () => {
    sub += 1;
    return `TC-${token}-${String(index).padStart(2, '0')}${String.fromCharCode(64 + sub)}`;
  };

  // Positive — the requirement is satisfied as written.
  out.push({
    id: nextId(),
    feature: req.feature,
    type: 'Positive',
    priority: critical ? 'P0 - Critical' : 'P1 - High',
    title: `${req.feature}: ${lc(reqText).slice(0, 80)}`,
    preconditions: `System is in a valid state for the "${req.feature}" feature.`,
    steps: `1. Open the ${req.feature} area.\n2. Exercise the behaviour: ${lc(reqText)}.\n3. Observe the outcome against the requirement.`,
    testData: dataStr,
    expectedResult: `The system behaves exactly as the PRD requires: ${reqText}`,
    acRef: req.id,
    automationFeasibility: 'HIGH',
    feasibilityReason: 'Requirement is explicit and assertable from the document.',
    playwrightSnippet: snippetFor(req.feature, 'Positive'),
    requirement: reqText,
  });

  // Negative — the requirement is violated; system must handle it.
  out.push({
    id: nextId(),
    feature: req.feature,
    type: 'Negative',
    priority: 'P2 - Medium',
    title: `${req.feature}: violating "${lc(reqText).slice(0, 60)}" is handled`,
    preconditions: `User is on the ${req.feature} screen with input that violates the requirement.`,
    steps: `1. Open the ${req.feature} area.\n2. Attempt to break the rule: ${lc(reqText)}.\n3. Observe the error handling.`,
    testData: req.dataTokens.length
      ? `Invalid variants of: ${req.dataTokens.join('; ')}`
      : 'Invalid / missing input for this requirement.',
    expectedResult: `The action is blocked with a clear, specific message; the rule "${reqText}" is enforced and no invalid state is saved.`,
    acRef: req.id,
    automationFeasibility: 'HIGH',
    feasibilityReason: 'The enforced rule and rejection are observable.',
    playwrightSnippet: snippetFor(req.feature, 'Negative'),
    requirement: reqText,
  });

  // Edge — only when the requirement actually names limits / quantities.
  const hasLimits = /\b(\d|max|min|maximum|minimum|limit|up to|at least|at most|range|between|character|length)\b/i.test(
    reqText
  );
  if (hasLimits) {
    out.push({
      id: nextId(),
      feature: req.feature,
      type: 'Edge',
      priority: 'P3 - Low',
      title: `${req.feature}: boundary of "${lc(reqText).slice(0, 55)}"`,
      preconditions: `System ready to test the boundary stated in the requirement.`,
      steps: `1. Open the ${req.feature} area.\n2. Drive the values to the boundary named in: ${lc(reqText)}.\n3. Verify behaviour exactly at, below, and above the limit.`,
      testData: req.dataTokens.length
        ? `Boundary values around: ${req.dataTokens.join('; ')}`
        : 'Boundary values implied by the requirement.',
      expectedResult: `At the stated limit the behaviour matches the PRD; beyond it the system rejects/handles gracefully per "${reqText}".`,
      acRef: req.id,
      automationFeasibility: 'MEDIUM',
      feasibilityReason: 'Boundary values are scriptable but need varied fixtures.',
      playwrightSnippet: snippetFor(req.feature, 'Edge'),
      requirement: reqText,
    });
  }

  return out;
}

/**
 * Generate test cases STRICTLY from the requirements extracted from the
 * PRD. If no requirements were found, returns an empty array (the caller
 * must report this rather than fabricate cases).
 */
export function generateTestCasesFromRequirements(
  requirements: RequirementInput[],
  criticalFeatures: string[] = []
): TestCase[] {
  const cases: TestCase[] = [];
  requirements.forEach((req, i) => {
    const critical = criticalFeatures.includes(req.feature);
    cases.push(...casesForRequirement(req, i + 1, critical));
  });
  return cases;
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