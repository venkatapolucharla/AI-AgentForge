import { AGENT_DEFS } from './agents.js';
import { emitAgent, emitLog } from './bus.js';
import type { AgentDef, AgentState, AgentStatus, Store } from './types.js';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** In-memory, server-owned state for every agent. */
const state = new Map<string, AgentState>();
for (const def of AGENT_DEFS) {
  state.set(def.id, {
    id: def.id,
    slug: def.slug,
    name: def.name,
    phase: def.phase,
    status: 'idle',
    lastOutput: null,
  });
}

/** Shared run state (the uploaded PRD lives here). */
export const store: Store = { prdFileName: null, prdPath: null };

export function listAgents(): AgentState[] {
  return [...state.values()];
}

function setStatus(id: string, status: AgentStatus, lastOutput?: string | null) {
  const agent = state.get(id);
  if (!agent) return;
  agent.status = status;
  if (lastOutput !== undefined) agent.lastOutput = lastOutput;
  emitAgent(agent);
}

export function resetAgent(id: string): AgentState | undefined {
  const agent = state.get(id);
  if (!agent) return undefined;
  setStatus(id, 'idle', null);
  emitLog(agent, 'info', 'Reset to idle.');
  return agent;
}

const defById = new Map<string, AgentDef>(AGENT_DEFS.map((d) => [d.id, d]));

/**
 * Run an agent: flip to "running", stream its steps, then settle on
 * "complete" (or "failed" if the handler throws). Returns immediately;
 * progress is delivered over the SSE bus.
 */
export async function runAgent(id: string): Promise<AgentState> {
  const agent = state.get(id);
  const def = defById.get(id);
  if (!agent || !def) throw new Error(`Unknown agent: ${id}`);
  if (agent.status === 'running') return agent;

  setStatus(id, 'running');
  emitLog(agent, 'info', 'Run confirmed — starting.');

  try {
    // Stream the descriptive steps.
    for (const step of def.steps ?? []) {
      await sleep(500 + Math.random() * 600);
      emitLog(agent, 'info', step);
    }

    // Custom handler does real work and may override the output.
    const output = def.run
      ? await def.run({
          agent,
          log: (level, message) => emitLog(agent, level, message),
          sleep,
          store,
        })
      : (def.output ?? 'Done.');

    setStatus(id, 'complete', output);
    emitLog(agent, 'success', output);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    setStatus(id, 'failed', message);
    emitLog(agent, 'error', message);
  }

  return state.get(id)!;
}
