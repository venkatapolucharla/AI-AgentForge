export type AgentStatus =
  | 'idle'
  | 'awaiting'
  | 'running'
  | 'complete'
  | 'failed';

export type PhaseId =
  | 'requirements'
  | 'test-design'
  | 'execution'
  | 'automation'
  | 'cicd';

export type LogLevel = 'info' | 'success' | 'error' | 'warn';

export interface LogEntry {
  id: string;
  time: string;
  agentId: string;
  agentName: string;
  level: LogLevel;
  message: string;
}

/** Live, server-owned state for an agent. */
export interface AgentState {
  id: string;
  slug: string;
  name: string;
  phase: PhaseId;
  status: AgentStatus;
  lastOutput: string | null;
}

/** Context handed to each agent handler at run time. */
export interface RunContext {
  agent: AgentState;
  /** Emit a log line on the live stream. */
  log: (level: LogLevel, message: string) => void;
  /** Await a number of milliseconds (used to pace work). */
  sleep: (ms: number) => Promise<void>;
  /** Shared run state (e.g. the uploaded PRD path). */
  store: Store;
}

export interface Store {
  prdFileName: string | null;
  prdPath: string | null;
}

/** A single agent's definition: metadata + how it runs. */
export interface AgentDef {
  id: string;
  slug: string;
  name: string;
  phase: PhaseId;
  /** Informational log lines emitted, in order, while running. */
  steps?: string[];
  /** Default output when no custom handler overrides it. */
  output?: string;
  /** Optional custom handler that does real work and returns the output. */
  run?: (ctx: RunContext) => Promise<string>;
}
