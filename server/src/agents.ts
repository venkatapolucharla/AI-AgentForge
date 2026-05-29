import { readFile } from 'node:fs/promises';
import type { AgentDef } from './types.js';

/**
 * The 15 agents. Most stream a few descriptive steps and return a
 * representative output; the PRD Analyser does real work by reading the
 * uploaded document. Each `run` handler is the seam where you'd call the
 * real integration (Jira / Jenkins / git / email) described in ../agents/*.md.
 */
export const AGENT_DEFS: AgentDef[] = [
  {
    id: '01',
    slug: 'prd-analyser',
    name: 'PRD Analyser',
    phase: 'requirements',
    async run(ctx) {
      const { prdPath, prdFileName } = ctx.store;
      if (!prdPath) {
        throw new Error('No PRD uploaded. Use "Upload PRD" first.');
      }
      ctx.log('info', `Reading PRD: ${prdFileName}`);
      await ctx.sleep(400);
      const raw = await readFile(prdPath, 'utf8').catch(() => '');
      const lines = raw.split(/\r?\n/);
      const headings = lines.filter((l) => /^#{1,6}\s+/.test(l.trim()));
      const bullets = lines.filter((l) => /^\s*[-*]\s+/.test(l));
      const words = raw.split(/\s+/).filter(Boolean).length;
      ctx.log('info', `Document parsed — ${words} words, ${lines.length} lines.`);
      await ctx.sleep(500);
      const features = Math.max(headings.length, 1);
      const criteria = Math.max(bullets.length, features * 2);
      ctx.log('info', `Detected ${features} candidate features.`);
      await ctx.sleep(400);
      return `Extracted ${features} features and ${criteria} acceptance criteria from "${prdFileName}". Ready to create Jira stories.`;
    },
  },
  {
    id: '02',
    slug: 'jira-story-creator',
    name: 'Jira Story Creator',
    phase: 'requirements',
    steps: [
      'Mapping requirements to Jira stories…',
      'Setting summary, description, and acceptance criteria…',
      'Creating issues in project "QA"…',
    ],
    output: 'Created 12 Jira stories (QA-101 … QA-112) and linked them to epic QA-100.',
  },
  {
    id: '03',
    slug: 'test-plan-creator',
    name: 'Test Plan Creator',
    phase: 'test-design',
    steps: [
      'Reading stories and acceptance criteria…',
      'Defining scope, strategy, and environments…',
      'Drafting entry/exit criteria…',
    ],
    output: 'Test plan drafted: 5 test areas, 3 environments, risk-based prioritisation applied.',
  },
  {
    id: '04',
    slug: 'test-case-generator',
    name: 'Test Case Generator',
    phase: 'test-design',
    steps: [
      'Deriving positive, negative, and edge cases…',
      'Adding steps, test data, and expected results…',
      'Attaching cases back to Jira stories…',
    ],
    output: 'Generated 78 test cases (45 positive, 21 negative, 12 edge). Coverage: 100% of ACs.',
  },
  {
    id: '05',
    slug: 'smoke-identifier',
    name: 'Smoke Identifier',
    phase: 'test-design',
    steps: [
      'Scoring cases by business criticality…',
      'Selecting the minimal critical-path suite…',
      'Tagging selected cases with "smoke"…',
    ],
    output: 'Selected 9 smoke tests covering login, checkout, and payment happy paths.',
  },
  {
    id: '06',
    slug: 'regression-builder',
    name: 'Regression Builder',
    phase: 'test-design',
    steps: [
      'Grouping cases by feature area and defect density…',
      'Deduplicating overlapping coverage…',
      'Publishing the regression suite definition…',
    ],
    output: 'Regression suite built: 64 cases across 5 areas, est. run time 42 min.',
  },
  {
    id: '07',
    slug: 'test-executor',
    name: 'Test Executor',
    phase: 'execution',
    steps: [
      'Provisioning the target environment…',
      'Running smoke suite (9 cases)…',
      'Running regression suite (64 cases)…',
      'Collecting logs and screenshots…',
    ],
    output: 'Run complete: 70 passed, 3 failed, 0 skipped (73 total) in 38m 12s.',
  },
  {
    id: '08',
    slug: 'defect-analyser',
    name: 'Defect Analyser',
    phase: 'execution',
    steps: [
      'Inspecting failure logs and diffs…',
      'Clustering failures by suspected root cause…',
      'Classifying product defects vs. test/env issues…',
    ],
    output: '3 failures analysed → 2 product defects (1 high, 1 medium), 1 flaky test.',
  },
  {
    id: '09',
    slug: 'defect-creator',
    name: 'Defect Creator',
    phase: 'execution',
    steps: [
      'Drafting bug reports with steps and evidence…',
      'Linking bugs to failing tests and parent stories…',
      'Creating issues in project "QA"…',
    ],
    output: 'Filed 2 bugs: QA-201 (High, payment timeout), QA-202 (Medium, cart total).',
  },
  {
    id: '10',
    slug: 'automation-developer',
    name: 'Automation Developer',
    phase: 'automation',
    steps: [
      'Converting manual cases into Playwright specs…',
      'Applying Page Object Model and fixtures…',
      'Writing files into tests/…',
    ],
    output: 'Generated 9 Playwright specs (1,240 LoC) using POM + fixtures in tests/.',
  },
  {
    id: '11',
    slug: 'code-reviewer',
    name: 'Code Reviewer',
    phase: 'automation',
    steps: [
      'Checking selectors, waits, and assertions…',
      'Flagging flakiness risks and anti-patterns…',
      'Compiling review summary…',
    ],
    output: 'Review done: 4 suggestions, 1 blocking (hard-coded wait in checkout.spec.ts).',
  },
  {
    id: '12',
    slug: 'git-commit',
    name: 'Git Commit',
    phase: 'automation',
    steps: [
      'Staging generated spec files…',
      'Creating conventional commit on branch "qa/auto-suite"…',
      'Pushing to origin and opening pull request…',
    ],
    output: 'Committed 9 files to branch "qa/auto-suite" → PR #58 opened.',
  },
  {
    id: '13',
    slug: 'jenkins-trigger',
    name: 'Jenkins Trigger',
    phase: 'cicd',
    steps: [
      'Calling Jenkins job with branch and suite params…',
      'Build queued — polling status…',
      'Archiving artifacts and HTML report…',
    ],
    output: 'Jenkins build #312 SUCCESS in 6m 04s — artifacts and HTML report archived.',
  },
  {
    id: '14',
    slug: 'report-sender',
    name: 'Report Sender',
    phase: 'cicd',
    steps: [
      'Compiling execution results, defects, and CI status…',
      'Rendering the HTML summary report…',
      'Sending to the QA distribution list…',
    ],
    output: 'Report emailed to qa-team@company.com — 5 recipients, delivered.',
  },
  {
    id: '15',
    slug: 'qa-chatbot',
    name: 'QA Chatbot',
    phase: 'cicd',
    steps: ['Opening chat session over orchestration state…'],
    output: 'Chat session ready.',
  },
];
