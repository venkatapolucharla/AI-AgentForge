/**
 * Knowledge base for the QA Chatbot (agent 15).
 *
 * Behaviour is defined by agents/15-qa-chatbot.md. The bot answers ONLY
 * within the 6 platform topics below; anything else gets the exact
 * out-of-scope refusal. Test-case answers are grounded in the same data
 * used for the Excel export.
 */
import type { Agent } from '../types';
import { generateTestCases, type Priority, type TestCase } from './testCases';

export interface KbContext {
  agents: Agent[];
  prdFileName: string | null;
}

// ─────────────────────────────────────────────────────────────────────
// Canned messages (verbatim from the spec)
// ─────────────────────────────────────────────────────────────────────

export const WELCOME_MESSAGE = `👋 Welcome to the QA Orchestration Platform!

I'm your dedicated assistant for everything related to this platform — from PRDs and test plans to test cases and our 15 intelligent agents.

How can I help you today?

You can ask me about:
  📄 PRD & Requirements
  🗂 Test Plan
  ✅ Test Cases
  🤖 15 QA Agents
  ⚙️ Automation Framework
  📊 Reports & Dashboards`;

export const GREETING_MESSAGE = `Hello! 👋 Welcome back to the QA Orchestration Platform.

What would you like to explore today?
  📄 PRD & Requirements
  🗂 Test Plan
  ✅ Test Cases
  🤖 15 QA Agents
  ⚙️ Automation Framework
  📊 Reports & Dashboards

Just type your question or pick a topic!`;

export const OUT_OF_SCOPE_MESSAGE = `Sorry, I can only assist with topics related to the QA Orchestration Platform.

Here's what I can help you with:
  📄 PRD & Requirements
  🗂 Test Plan
  ✅ Test Cases
  🤖 15 QA Agents
  ⚙️ Automation Framework
  📊 Reports & Dashboards

Please select one of these topics or rephrase your question related to the platform.`;

/** Greeting words that should ONLY produce the greeting message. */
const GREETING_WORDS = [
  'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
  'hii', 'howdy', 'sup', 'yo', 'helo', 'hiya', 'heya',
];

export function isGreeting(text: string): boolean {
  const q = text.toLowerCase().trim().replace(/[!.,?]+$/, '');
  return GREETING_WORDS.includes(q);
}

// ─────────────────────────────────────────────────────────────────────
// Grounded content
// ─────────────────────────────────────────────────────────────────────

const PRD_FEATURES = [
  'Authentication — login, logout, session handling, password reset',
  'Shopping Cart — add/remove items, update quantity, view subtotal',
  'Checkout — address entry, shipping selection, order review',
  'Payment — card authorisation, confirmation, failure handling',
  'Order Management — order history, order detail, status tracking',
];

const PRD_ACCEPTANCE = [
  'A valid user can authenticate and reach the dashboard.',
  'Invalid credentials are rejected with a clear error message.',
  'Items added to the cart reflect the correct quantity and subtotal.',
  'Checkout shows accurate totals, taxes, and the chosen shipping option.',
  'A valid card is authorised and returns a confirmation number.',
  'Declined/timed-out payments are handled without losing the cart.',
];

const TEST_PLAN = {
  scope:
    'In scope: Authentication, Shopping Cart, Checkout, Payment, Order Management. Out of scope: admin console and third-party analytics.',
  strategy:
    'Risk-based testing. Priority order: Payment & Authentication (P0) → core commerce flows (P1) → validation/negative paths (P2) → edge/boundary (P3).',
  environments: 'Dev, Staging (primary test target), and a Pre-prod smoke env.',
  entryCriteria: 'Stories accepted, build deployed to Staging, test data seeded.',
  exitCriteria:
    '100% of acceptance criteria covered, 0 open P0/P1 defects, smoke suite green.',
};

/** The 15 QA agents, per the spec. */
const QA_AGENTS: { name: string; role: string }[] = [
  { name: 'Requirement Analyzer Agent', role: 'parses the PRD and extracts features & acceptance criteria' },
  { name: 'Test Planner Agent', role: 'drafts the master test plan, scope, and strategy' },
  { name: 'Test Case Generator Agent', role: 'generates detailed test cases per requirement' },
  { name: 'Test Data Agent', role: 'prepares and manages test data sets' },
  { name: 'API Tester Agent', role: 'validates REST/GraphQL endpoints' },
  { name: 'UI Testing Agent', role: 'runs end-to-end UI checks across browsers' },
  { name: 'Performance Agent', role: 'measures latency, throughput, and load behaviour' },
  { name: 'Security Agent', role: 'checks for vulnerabilities and security gaps' },
  { name: 'Regression Agent', role: 'maintains and runs the regression suite' },
  { name: 'Defect Tracker Agent', role: 'triages failures and files/links defects' },
  { name: 'Report Agent', role: 'compiles and distributes QA reports' },
  { name: 'CI/CD Integration Agent', role: 'triggers pipelines and wires CI/CD' },
  { name: 'Coverage Agent', role: 'tracks requirement and code coverage' },
  { name: 'Accessibility Agent', role: 'verifies WCAG/a11y compliance' },
  { name: 'Orchestrator Agent', role: 'coordinates all agents through the QA lifecycle' },
];

const AUTOMATION_FRAMEWORK = `Automation Framework:
• Tooling — Playwright for UI/E2E and API testing (TypeScript).
• Pattern — Page Object Model with shared fixtures and reusable helpers.
• Structure — specs live in the tests/ directory; page objects, fixtures, and test data are kept separate.
• Execution — runs locally and in CI/CD (the CI/CD Integration Agent triggers the pipeline).
• Reporting — produces an HTML report plus pass/fail artifacts after each run.`;

// ─────────────────────────────────────────────────────────────────────
// Topic routing
// ─────────────────────────────────────────────────────────────────────

export interface Topic {
  id: string;
  label: string;
  keywords: string[];
  answer: (ctx: KbContext, q: string) => string;
}

const FEATURE_NAMES = [
  'Authentication',
  'Shopping Cart',
  'Checkout',
  'Payment',
  'Order Management',
];

function priorityCounts(cases: TestCase[]): Record<Priority, number> {
  return cases.reduce(
    (acc, c) => {
      acc[c.priority] = (acc[c.priority] ?? 0) + 1;
      return acc;
    },
    {} as Record<Priority, number>
  );
}

function listCases(cases: TestCase[], limit = 12): string {
  const shown = cases.slice(0, limit);
  const lines = shown.map((c) => `• ${c.id} — ${c.title} [${c.priority}]`);
  if (cases.length > limit) {
    lines.push(`…and ${cases.length - limit} more (use the Download Excel button for all).`);
  }
  return lines.join('\n');
}

function priorityFromText(q: string): Priority | null {
  if (/\bp0\b|critical/.test(q)) return 'P0 - Critical';
  if (/\bp1\b|high/.test(q)) return 'P1 - High';
  if (/\bp2\b|medium/.test(q)) return 'P2 - Medium';
  if (/\bp3\b|low/.test(q)) return 'P3 - Low';
  return null;
}

/** Build the detailed, possibly-filtered test-case answer. */
function answerTestCases(q: string): string {
  const all = generateTestCases();
  const pr = priorityFromText(q);
  const feature = FEATURE_NAMES.find((f) => q.includes(f.toLowerCase()));
  let filtered = all;
  const labels: string[] = [];

  if (pr) {
    filtered = filtered.filter((c) => c.priority === pr);
    labels.push(pr);
  }
  if (feature) {
    filtered = filtered.filter((c) => c.feature === feature);
    labels.push(feature);
  }
  if (/\bpositive\b/.test(q)) {
    filtered = filtered.filter((c) => c.type === 'Positive');
    labels.push('positive');
  } else if (/\bnegative\b/.test(q)) {
    filtered = filtered.filter((c) => c.type === 'Negative');
    labels.push('negative');
  } else if (/\bedge\b/.test(q)) {
    filtered = filtered.filter((c) => c.type === 'Edge');
    labels.push('edge');
  }

  // No filter → give the breakdown.
  if (labels.length === 0) {
    const counts = priorityCounts(all);
    return `There are ${all.length} test cases (45 positive, 21 negative, 12 edge) covering ${FEATURE_NAMES.join(', ')}.\nBy priority:\n• ${counts['P0 - Critical'] ?? 0} P0 (Critical)\n• ${counts['P1 - High'] ?? 0} P1 (High)\n• ${counts['P2 - Medium'] ?? 0} P2 (Medium)\n• ${counts['P3 - Low'] ?? 0} P3 (Low)\nAsk for a priority (e.g. "P0 test cases") or a feature (e.g. "Payment test cases").`;
  }

  const scope = labels.join(', ') + ' ';
  if (filtered.length === 0) {
    return `No ${scope}test cases matched. Try "P1 test cases" or "Payment test cases".`;
  }
  return `Found ${filtered.length} ${scope}test case(s):\n${listCases(filtered)}`;
}

export const TOPICS: Topic[] = [
  {
    id: 'prd',
    label: '📄 PRD & Requirements',
    keywords: [
      'prd', 'requirement', 'requirements', 'product document', 'product requirements',
      'scope', 'stakeholder', 'functional', 'non-functional', 'feature', 'features',
      'acceptance', 'criteria',
    ],
    answer: (ctx, q) => {
      if (/acceptance|criteria/.test(q)) {
        return `Key acceptance criteria from the PRD:\n${PRD_ACCEPTANCE.map((a, i) => `${i + 1}. ${a}`).join('\n')}`;
      }
      return `From the PRD${ctx.prdFileName ? ` (${ctx.prdFileName})` : ''}, these features & requirements were identified:\n${PRD_FEATURES.map((f) => `• ${f}`).join('\n')}\n\nAsk about "acceptance criteria" to go deeper.`;
    },
  },
  {
    id: 'test-plan',
    label: '🗂 Test Plan',
    keywords: [
      'test plan', 'testing scope', 'strategy', 'entry criteria', 'exit criteria',
      'test environment', 'environment', 'timeline', 'phases', 'objective',
    ],
    answer: () =>
      `Test Plan summary:\n• Scope: ${TEST_PLAN.scope}\n• Strategy: ${TEST_PLAN.strategy}\n• Environments: ${TEST_PLAN.environments}\n• Entry criteria: ${TEST_PLAN.entryCriteria}\n• Exit criteria: ${TEST_PLAN.exitCriteria}`,
  },
  {
    id: 'test-cases',
    label: '✅ Test Cases',
    keywords: [
      'test case', 'testcase', 'test scenario', 'scenario', 'test steps', 'steps',
      'expected result', 'module testing', 'test script', 'cases',
      'p0', 'p1', 'p2', 'p3', 'positive', 'negative', 'edge',
      ...FEATURE_NAMES.map((f) => f.toLowerCase()),
    ],
    answer: (_ctx, q) => answerTestCases(q),
  },
  {
    id: 'agents',
    label: '🤖 15 QA Agents',
    keywords: [
      'agent', 'agents', 'qa agent', 'orchestrator', 'automation agent', 'ai agent',
    ],
    answer: (_ctx, q) => {
      // Specific agent lookup.
      const hit = QA_AGENTS.find((a) =>
        q.includes(a.name.toLowerCase().replace(' agent', '')) ||
        q.includes(a.name.toLowerCase())
      );
      if (hit) return `${hit.name} — ${hit.role}.`;
      return `The platform runs 15 QA agents:\n${QA_AGENTS.map((a, i) => `${i + 1}. ${a.name} — ${a.role}`).join('\n')}\n\nAsk about any agent by name to learn more.`;
    },
  },
  {
    id: 'automation',
    label: '⚙️ Automation Framework',
    keywords: [
      'playwright', 'restassured', 'rest assured', 'selenium', 'framework',
      'folder structure', 'automation setup', 'automation', 'testng', 'ci/cd',
      'cicd', 'pipeline', 'page object', 'pom',
    ],
    answer: () => AUTOMATION_FRAMEWORK,
  },
  {
    id: 'reports',
    label: '📊 Reports & Dashboards',
    keywords: [
      'report', 'reports', 'dashboard', 'metrics', 'coverage', 'pass rate',
      'fail rate', 'pass', 'fail', 'trend', 'analytics', 'execution',
    ],
    answer: (ctx) => {
      const exec = ctx.agents.find((a) => a.slug === 'test-executor');
      const live =
        exec?.status === 'complete' && exec.lastOutput
          ? `\n\nLatest execution: ${exec.lastOutput}`
          : '';
      return `Reports & Dashboards:\n• Execution report — pass/fail/skip counts, duration, and per-suite results.\n• Coverage — 100% of acceptance criteria covered (78 test cases).\n• Defect report — open defects by severity, linked to failing tests.\n• Trend dashboard — pass-rate and defect trends across runs.\nThe live dashboard shows each agent's status and a real-time log stream.${live}`;
    },
  },
];

/** Topic ids offered as option buttons in the out-of-scope fallback. */
export const OPTION_TOPIC_IDS = [
  'prd',
  'test-plan',
  'test-cases',
  'agents',
  'automation',
  'reports',
];

export type AnswerResult =
  | { kind: 'answer'; text: string }
  | { kind: 'out-of-scope' };

/**
 * Route a free-text question to a topic and return a grounded answer, or
 * signal out-of-scope so the caller shows the refusal + options.
 * (Greetings are handled by the caller before this is reached.)
 */
export function answerQuestion(question: string, ctx: KbContext): AnswerResult {
  const q = question.toLowerCase().trim();

  let best: { topic: Topic; score: number } | null = null;
  for (const topic of TOPICS) {
    const score = topic.keywords.reduce(
      (s, kw) => (q.includes(kw) ? s + kw.length : s),
      0
    );
    if (score > 0 && (!best || score > best.score)) best = { topic, score };
  }

  if (best) return { kind: 'answer', text: best.topic.answer(ctx, q) };
  return { kind: 'out-of-scope' };
}
