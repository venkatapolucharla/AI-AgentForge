import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import type { AgentState, LogEntry, LogLevel } from './types.js';

/**
 * A tiny pub/sub used to fan agent activity out to every connected
 * SSE client in real time.
 */
export const bus = new EventEmitter();
bus.setMaxListeners(0); // unlimited SSE subscribers

export type BusEvent =
  | { type: 'log'; payload: LogEntry }
  | { type: 'agent'; payload: AgentState };

function emit(event: BusEvent) {
  bus.emit('event', event);
}

export function emitAgent(agent: AgentState) {
  emit({ type: 'agent', payload: { ...agent } });
}

export function emitLog(
  agent: Pick<AgentState, 'id' | 'name'>,
  level: LogLevel,
  message: string
): LogEntry {
  const entry: LogEntry = {
    id: randomUUID().slice(0, 8),
    time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
    agentId: agent.id,
    agentName: agent.name,
    level,
    message,
  };
  emit({ type: 'log', payload: entry });
  return entry;
}
