import type { Agent, Phase } from '../types';

export const PHASES: Phase[] = [
  {
    id: 'requirements',
    label: 'Requirements',
    blurb: 'Turn the PRD into structured, traceable Jira work items.',
  },
  {
    id: 'test-design',
    label: 'Test Design',
    blurb: 'Author the test plan, cases, smoke set, and regression suite.',
  },
  {
    id: 'execution',
    label: 'Execution',
    blurb: 'Run the tests, triage failures, and file defects.',
  },
  {
    id: 'automation',
    label: 'Automation',
    blurb: 'Generate Playwright code, review it, and commit.',
  },
  {
    id: 'cicd',
    label: 'CI/CD',
    blurb: 'Kick off the pipeline and distribute the results.',
  },
];

export const AGENTS: Agent[] = [
  {
    id: '01',
    slug: 'blueprint-architect',
    name: 'Blueprint Architect',
    phase: 'requirements',
    glyph: 'ðŸ—ï¸',
    description: 'Transform PRD into structured blueprints with features & acceptance criteria.',
    action: 'Analyse the uploaded PRD and architect the requirements blueprint.',
    willDo: [
      'Parse the PRD document structure',
      'Extract features, user stories, and acceptance criteria',
      'Map dependencies and classify risk levels',
    ],
    sampleOutput:
      'Architected 12 features with 34 acceptance criteria across 4 epics. Blueprint ready.',
    status: 'idle',
    lastOutput: null,
  },
  {
    id: '02',
    slug: 'workflow-weaver',
    name: 'Workflow Weaver',
    phase: 'requirements',
    glyph: 'ðŸŽ«',
    description: 'Creates Jira stories from the extracted requirements.',
    action: 'Create Jira stories in project QA from extracted requirements.',
    willDo: [
      'Map each requirement to a Jira story',
      'Set summary, description, and acceptance criteria fields',
      'Create the issues in project "QA" (sprint backlog)',
    ],
    sampleOutput:
      'Created 12 Jira stories (QA-101 â€¦ QA-112) and linked them to epic QA-100.',
    status: 'idle',
    lastOutput: null,
  },
  {
    id: '03',
    slug: 'test-alchemist',
    name: 'Test Alchemist',
    phase: 'test-design',
    glyph: 'âœ¨',
    description: 'Alchemically transform acceptance criteria into comprehensive test cases.',
    action: 'Generate detailed test cases from stories.',
    willDo: [
      'Derive positive, negative, and edge-case scenarios',
      'Craft precise test steps with test data',
      'Classify by test type (smoke, regression, exploratory)',
    ],
    sampleOutput:
      'Transmuted 78 test cases (45 positive, 21 negative, 12 edge). 100% coverage achieved.',
    status: 'idle',
    lastOutput: null,
  },
  {
    id: '04',
    slug: 'quality-guardian',
    name: 'Quality Guardian',
    phase: 'execution',
    glyph: 'ðŸ›¡ï¸',
    description: 'Guard quality by executing tests and capturing comprehensive evidence.',
    action: 'Execute smoke + regression test suites.',
    willDo: [
      'Run all test suites against target environment',
      'Capture pass/fail status with screenshots and logs',
      'Generate detailed execution report',
    ],
    sampleOutput:
      'Guarded 73 tests: 70 passed, 3 failed. Evidence archived.',
    status: 'idle',
    lastOutput: null,
  },
  {
    id: '05',
    slug: 'bug-hunter',
    name: 'Bug Hunter',
    phase: 'execution',
    glyph: 'ðŸ”',
    description: 'Hunt down root causes and separate defects from flaky tests.',
    action: 'Analyse failed tests and identify root causes.',
    willDo: [
      'Inspect failure logs and screenshots',
      'Cluster failures by suspected root cause',
      'Distinguish product defects from environmental issues',
    ],
    sampleOutput:
      'Hunted 3 failures â†’ 2 confirmed defects (1 high, 1 medium), 1 environmental.',
    status: 'idle',
    lastOutput: null,
  },
  {
    id: '06',
    slug: 'code-conjurer',
    name: 'Code Conjurer',
    phase: 'automation',
    glyph: 'ðŸª„',
    description: 'Conjure elegant Playwright automation code with POM pattern.',
    action: 'Generate Playwright test specs for prioritised cases.',
    willDo: [
      'Create Page Object Model for each page',
      'Generate Playwright specs with robust selectors',
      'Add wait strategies and error handling',
    ],
    sampleOutput:
      'Conjured 9 Playwright specs (1,240 LoC) with POM + fixtures.',
    status: 'idle',
    lastOutput: null,
  },
  {
    id: '07',
    slug: 'quality-sentinel',
    name: 'Quality Sentinel',
    phase: 'automation',
    glyph: 'âœ…',
    description: 'Stand sentinel over code quality and best practices.',
    action: 'Review generated Playwright code for quality issues.',
    willDo: [
      'Validate selector robustness and CSS specificity',
      'Check wait strategies for flakiness risks',
      'Verify Page Object Model usage and best practices',
    ],
    sampleOutput:
      'Reviewed 9 specs: approved with 4 suggestions for improvement.',
    status: 'idle',
    lastOutput: null,
  },
  {
    id: '08',
    slug: 'smart-advisor',
    name: 'Smart Advisor',
    phase: 'cicd',
    glyph: 'ðŸ’¬',
    description: 'AI-powered guide through your entire QA orchestration journey.',
    action: 'Open an intelligent chat session.',
    willDo: [
      'Answer questions about runs, defects, and coverage',
      'Provide insights and actionable recommendations',
      'Help navigate the platform and trigger agents',
    ],
    sampleOutput: 'Smart Advisor ready to guide your QA process.',
    status: 'idle',
    lastOutput: null,
  },
];

/** The advisor is surfaced from the top bar, not as a phase card. */
export const CHATBOT_AGENT_ID = '08';
