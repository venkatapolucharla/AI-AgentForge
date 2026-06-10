import { useRef, useState } from 'react';
import type { Agent } from '../types';
import type { PrdArtifacts, PrdDoc } from '../lib/prd';
import {
  buildReport,
  CONFIRMATION_GATES,
  EXECUTION_ORDER,
  newRequestId,
  runAgentStep,
  summarise,
  downloadReport,
  type AgentResult,
  type OrchestrationReport,
} from '../lib/orchestrator';

interface Props {
  open: boolean;
  agents: Agent[];
  activePrd: PrdDoc | null;
  artifacts: PrdArtifacts | null;
  onClose: () => void;
  /** Push a status/output change into the shared dashboard state. */
  onAgentUpdate: (id: string, patch: Partial<Agent>) => void;
  /** Emit a log line into the dashboard log stream. */
  onLog: (agent: Pick<Agent, 'id' | 'name'>, level: 'info' | 'success' | 'error' | 'warn', message: string) => void;
}

type RunState = 'idle' | 'running' | 'awaiting' | 'done';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function OrchestratorPanel({
  open,
  agents,
  activePrd,
  artifacts,
  onClose,
  onAgentUpdate,
  onLog,
}: Props) {
  const [runState, setRunState] = useState<RunState>('idle');
  const [results, setResults] = useState<AgentResult[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [gateId, setGateId] = useState<string | null>(null);
  const [report, setReport] = useState<OrchestrationReport | null>(null);
  const [requestId, setRequestId] = useState<string>('');
  /** Resolver that the confirmation buttons call to unblock the run loop. */
  const gateResolver = useRef<((ok: boolean) => void) | null>(null);

  if (!open) return null;

  const byId = (id: string) => agents.find((a) => a.id === id)!;

  function awaitGate(id: string): Promise<boolean> {
    setGateId(id);
    setRunState('awaiting');
    return new Promise<boolean>((resolve) => {
      gateResolver.current = (ok) => {
        gateResolver.current = null;
        setGateId(null);
        resolve(ok);
      };
    });
  }

  function resolveGate(ok: boolean) {
    gateResolver.current?.(ok);
  }

  async function runPipeline() {
    if (!activePrd || !artifacts) return;
    const rid = newRequestId();
    setRequestId(rid);
    setResults([]);
    setReport(null);
    setRunState('running');

    // Reset all agents to idle first.
    EXECUTION_ORDER.forEach((id) => onAgentUpdate(id, { status: 'idle', lastOutput: null }));

    const collected: AgentResult[] = [];

    for (const id of EXECUTION_ORDER) {
      const agent = byId(id);

      // Dependency check: prior step must have passed (linear graph).
      const prevIdx = EXECUTION_ORDER.indexOf(id) - 1;
      if (prevIdx >= 0) {
        const prev = collected[prevIdx];
        if (prev && prev.status !== 'PASS') {
          const skipped: AgentResult = {
            agentId: id,
            agentName: agent.name,
            status: 'SKIPPED',
            confidence: 0,
            output: '',
            errors: [`Skipped — dependency ${prev.agentId} did not pass.`],
            attempts: 0,
          };
          collected.push(skipped);
          onAgentUpdate(id, { status: 'idle', lastOutput: 'Skipped (dependency failed).' });
          onLog(agent, 'warn', `Skipped — dependency ${prev.agentId} did not pass.`);
          continue;
        }
      }

      // Confirmation gate.
      if (CONFIRMATION_GATES.has(id)) {
        onAgentUpdate(id, { status: 'awaiting' });
        onLog(agent, 'warn', 'Awaiting confirmation (gated action).');
        setCurrentId(id);
        const ok = await awaitGate(id);
        setRunState('running');
        if (!ok) {
          const skipped: AgentResult = {
            agentId: id,
            agentName: agent.name,
            status: 'SKIPPED',
            confidence: 0,
            output: '',
            errors: ['User declined the confirmation gate.'],
            attempts: 0,
          };
          collected.push(skipped);
          onAgentUpdate(id, { status: 'idle', lastOutput: 'Declined by user.' });
          onLog(agent, 'info', 'Gate declined — step skipped.');
          continue;
        }
      }

      // Run with retry-once on failure.
      setCurrentId(id);
      onAgentUpdate(id, { status: 'running' });
      onLog(agent, 'info', `Running. ${agent.action}`);
      await sleep(600 + Math.random() * 500);

      let res = runAgentStep(agent, activePrd, artifacts, 0);
      if (res.status === 'FAILED') {
        onLog(agent, 'warn', `${res.errors[0]} Retrying once…`);
        await sleep(500);
        res = runAgentStep(agent, activePrd, artifacts, 1);
      }

      collected.push(res);
      if (res.status === 'PASS') {
        onAgentUpdate(id, { status: 'complete', lastOutput: res.output });
        onLog(agent, 'success', `${res.output} (confidence ${res.confidence})`);
      } else {
        onAgentUpdate(id, { status: 'failed', lastOutput: res.errors[0] });
        onLog(agent, 'error', res.errors[0]);
      }
      setResults([...collected]);
    }

    setCurrentId(null);
    const finalReport = buildReport(rid, collected);
    setReport(finalReport);
    setResults(collected);
    setRunState('done');
    onLog(
      { id: '00', name: 'Master Orchestrator' },
      finalReport.final_status === 'PASS' ? 'success' : finalReport.final_status === 'FAIL' ? 'error' : 'warn',
      `Orchestration ${finalReport.final_status}: ${finalReport.summary}`
    );
  }

  const live = summarise(results);
  const gateAgent = gateId ? byId(gateId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 p-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎛️</span>
              <h2 className="text-lg font-semibold text-slate-100">Master Orchestrator</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Runs all 15 agents in order · honours dependencies, confidence (≥0.7), retry-once, and confirmation gates.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {!activePrd && (
            <div className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              No active PRD. Select a PRD before running the pipeline.
            </div>
          )}

          {/* Pipeline progress */}
          <div className="space-y-1.5">
            {EXECUTION_ORDER.map((id) => {
              const agent = byId(id);
              const res = results.find((r) => r.agentId === id);
              const isCurrent = currentId === id && runState === 'running';
              const isGate = gateId === id;
              const gated = CONFIRMATION_GATES.has(id);

              const dot = res
                ? res.status === 'PASS'
                  ? 'bg-emerald-500'
                  : res.status === 'FAILED'
                    ? 'bg-red-500'
                    : 'bg-slate-500'
                : isCurrent || isGate
                  ? 'bg-sky-400 animate-pulseSoft'
                  : 'bg-slate-700';

              return (
                <div
                  key={id}
                  className={`flex items-center gap-3 rounded-md border px-3 py-2 ${isGate ? 'border-amber-500 bg-amber-950/20' : isCurrent ? 'border-sky-600 bg-sky-950/20' : 'border-slate-800'}`}
                >
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                  <span className="font-mono text-[11px] text-slate-500">{id}</span>
                  <span className="text-sm text-slate-200">{agent.name}</span>
                  {gated && (
                    <span className="rounded-full bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-300">
                      gate
                    </span>
                  )}
                  <span className="ml-auto text-right">
                    {res ? (
                      <span
                        className={`text-[11px] ${res.status === 'PASS' ? 'text-emerald-400' : res.status === 'FAILED' ? 'text-red-400' : 'text-slate-500'}`}
                      >
                        {res.status}
                        {res.status === 'PASS' && ` · ${res.confidence}`}
                        {res.attempts > 1 && ' · retried'}
                      </span>
                    ) : isGate ? (
                      <span className="text-[11px] text-amber-300">awaiting confirmation</span>
                    ) : isCurrent ? (
                      <span className="text-[11px] text-sky-300">running…</span>
                    ) : (
                      <span className="text-[11px] text-slate-600">pending</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Live rollup */}
          {results.length > 0 && (
            <div className="mt-4 text-xs text-slate-400">{live.summary}</div>
          )}

          {/* Final report */}
          {report && runState === 'done' && (
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Protocol v2 Report
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${report.final_status === 'PASS' ? 'bg-emerald-500/10 text-emerald-300' : report.final_status === 'FAIL' ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 text-amber-300'}`}
                >
                  {report.final_status}
                </span>
              </div>
              <pre className="max-h-56 overflow-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3 font-mono text-[10px] leading-relaxed text-slate-300">
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Confirmation gate bar */}
        {runState === 'awaiting' && gateAgent && (
          <div className="border-t border-amber-700/50 bg-amber-950/20 p-4">
            <div className="text-sm text-amber-200">
              <span className="font-semibold">Confirmation required — {gateAgent.id} {gateAgent.name}</span>
              <p className="mt-0.5 text-xs text-amber-200/80">{gateAgent.action}</p>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => resolveGate(false)}
                className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
              >
                Decline (skip)
              </button>
              <button
                onClick={() => resolveGate(true)}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Confirm &amp; continue
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-slate-800 p-4">
          {requestId && (
            <span className="font-mono text-[11px] text-slate-600">{requestId}</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {report && (
              <button
                onClick={() => downloadReport(report)}
                className="flex items-center gap-1.5 rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                ⬇️ Download report
              </button>
            )}
            <button
              onClick={runPipeline}
              disabled={!activePrd || runState === 'running' || runState === 'awaiting'}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition enabled:hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {runState === 'idle' ? '▶ Run full pipeline' : runState === 'done' ? '↻ Run again' : 'Running…'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}