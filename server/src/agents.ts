import { readFile } from 'node:fs/promises';
import type { AgentDef } from './types.js';

/**
 * The 8 core agents (Vercel-optimized). Streamlined for serverless execution.
 * Each `run` handler is the seam where you'd call real integrations
 * (JIRA / Playwright / webhooks) described in ../agents/*.md.
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
    slug: 'test-case-generator',
    name: 'Test Case Generator',
    phase: 'test-design',
    steps: [
      'Deriving positive, negative, and edge cases…',
      'Analyzing boundary values and field constraints…',
      'Adding steps, test data, and expected results…',
    ],
    output: 'Generated 78 test cases (45 positive, 21 negative, 12 edge). Coverage: 100% of ACs.',
  },
  {
    id: '04',
    slug: 'test-executor',
    name: 'Test Executor',
    phase: 'execution',
    steps: [
      'Provisioning the test environment…',
      'Running smoke tests + regression suite…',
      'Collecting execution logs and screenshots…',
    ],
    output: 'Execution complete: 70 passed, 3 failed, 0 skipped (73 total) in 38m 12s.',
  },
  {
    id: '05',
    slug: 'defect-analyser',
    name: 'Defect Analyser',
    phase: 'execution',
    steps: [
      'Analyzing failure logs and test diffs…',
      'Extracting root cause and severity…',
      'Drafting JIRA defect details…',
    ],
    output: '3 failures analyzed → 2 product defects (1 high, 1 medium), 1 flaky test.',
  },
  {
    id: '06',
    slug: 'automation-developer',
    name: 'Automation Developer',
    phase: 'automation',
    steps: [
      'Converting test cases to Playwright TypeScript…',
      'Implementing Page Object Model pattern…',
      'Generating specs in tests/ folder…',
    ],
    output: 'Generated 9 Playwright specs (1,240 LoC) with POM + fixtures.',
  },
  {
    id: '07',
    slug: 'code-reviewer',
    name: 'Code Reviewer',
    phase: 'automation',
    steps: [
      'Reviewing selectors, waits, and assertions…',
      'Flagging anti-patterns and flakiness risks…',
      'Validating TypeScript types and best practices…',
    ],
    output: 'Review complete: 4 suggestions, 1 blocking (hard-coded wait detected).',
  },
  {
    id: '08',
    slug: 'qa-chatbot',
    name: 'QA Chatbot',
    phase: 'support',
    steps: ['Initializing chat interface…', 'Loading QA platform knowledge base…'],
    output: 'Chat session ready. Ask about PRD, test cases, agents, or reports.',
  },
];
