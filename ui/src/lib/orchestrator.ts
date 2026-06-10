/**
 * Master Orchestrator (per CLAUDE.md § Master Orchestrator).
 *
 * Runs the 15 specialist agents in the defined execution order, honours the
 * task-graph dependencies and confirmation gates, validates each agent's
 * confidence (re-routing/clarifying below 0.7), retries once on failure,
 * and emits a unified Protocol v2 JSON report.
 *
 * The engine is UI-agnostic: callers drive it step-by-step and supply a
 * confirmation resolver for gated steps, so the dashboard can show live
 * progress and inline confirm/cancel.
 */
import type { Agent } from '../types';
import type { PrdArtifacts, PrdDoc } from './prd';
import { agentOutputFor } from './prd';

/** Execution order = agent ids 01..15 (CLAUDE.md § Agent Execution Order). */
export const EXECUTION_ORDER = [
  '01', '02', '03', '04', '05', '06', '07', '08',
  '09', '10', '11', '12', '13', '14', '15',
];

/** Steps that require explicit user confirmation (the * agents). */
export const CONFIRMATION_GATES = new Set([
  '02', // JIRA Story Creator
  '09', // Defect Creator
  '10', // Automation Developer
  '12', // Git Commit
  '13', // Jenkins Trigger
  '14', // Report Sender
]);

/**
 * Task graph: each agent depends on the previous one in the pipeline.
 * (Linear here, but modelled explicitly so dependency rules are enforced
 * rather than assumed.)
 */
export function buildTaskGraph(): Record<string, string[]> {
  const graph: Record<string, string[]> = {};
  EXECUTION_ORDER.forEach((id, i) => {
    graph[id] = i === 0 ? [] : [EXECUTION_ORDER[i - 1]];
  });
  return graph;
}

export type StepStatus = 'PASS' | 'FAILED' | 'SKIPPED';

/** One agent's result in Protocol v2 form. */
export interface AgentResult {
  agentId: string;
  agentName: string;
  status: StepStatus;
  confidence: number;
  output: string;
  errors: string[];
  attempts: number;
}

export interface OrchestrationReport {
  orchestrator: 'master';
  request_id: string;
  task_graph: { agentId: string; dependsOn: string[] }[];
  agent_results: AgentResult[];
  final_status: 'PASS' | 'FAIL' | 'PARTIAL';
  summary: string;
}

/** Confidence threshold below which a result is re-routed/clarified. */
export const CONFIDENCE_THRESHOLD = 0.7;

/**
 * Produce a single agent's result, grounded in the active PRD's artifacts.
 * `attempt` lets the engine retry once with a fresh draw.
 */
export function runAgentStep(
  agent: Agent,
  prd: PrdDoc,
  art: PrdArtifacts,
  attempt: number
): AgentResult {
  const output = agentOutputFor(agent.slug, prd, art) ?? agent.sampleOutput;

  // Deterministic-ish confidence: most agents are confident; a couple of
  // analytical steps occasionally come back low to exercise the retry path.
  const base = 0.78 + Math.random() * 0.2; // 0.78–0.98
  // First attempt of the two "judgement" agents can dip below threshold.
  const dip = attempt === 0 && (agent.slug === 'defect-analyser') && Math.random() < 0.35
    ? -0.2
    : 0;
  const confidence = Math.max(0.4, Math.min(0.99, base + dip));

  if (confidence < CONFIDENCE_THRESHOLD) {
    return {
      agentId: agent.id,
      agentName: agent.name,
      status: 'FAILED',
      confidence: round2(confidence),
      output: '',
      errors: [
        `Confidence ${round2(confidence)} below threshold ${CONFIDENCE_THRESHOLD} — needs re-route/clarification.`,
      ],
      attempts: attempt + 1,
    };
  }

  return {
    agentId: agent.id,
    agentName: agent.name,
    status: 'PASS',
    confidence: round2(confidence),
    output,
    errors: [],
    attempts: attempt + 1,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Roll up per-agent results into the final status + summary. */
export function summarise(results: AgentResult[]): {
  final_status: OrchestrationReport['final_status'];
  summary: string;
} {
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;
  const skipped = results.filter((r) => r.status === 'SKIPPED').length;
  const total = results.length;

  let final_status: OrchestrationReport['final_status'];
  if (failed === 0 && skipped === 0) final_status = 'PASS';
  else if (passed === 0) final_status = 'FAIL';
  else final_status = 'PARTIAL';

  const summary =
    `${passed}/${total} agents passed` +
    (failed ? `, ${failed} failed` : '') +
    (skipped ? `, ${skipped} skipped` : '') +
    `. Pipeline ${final_status}.`;

  return { final_status, summary };
}

/** Assemble the final Protocol v2 report. */
export function buildReport(
  requestId: string,
  results: AgentResult[]
): OrchestrationReport {
  const graph = buildTaskGraph();
  const { final_status, summary } = summarise(results);
  return {
    orchestrator: 'master',
    request_id: requestId,
    task_graph: EXECUTION_ORDER.map((id) => ({ agentId: id, dependsOn: graph[id] })),
    agent_results: results,
    final_status,
    summary,
  };
}

export function newRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Download a report as a .json file. */
export function downloadReport(report: OrchestrationReport): void {
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orchestration-report_${report.request_id}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}