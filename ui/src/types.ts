export type AgentStatus = 'idle' | 'awaiting' | 'running' | 'complete' | 'failed';

export type PhaseId =
  | 'requirements'
  | 'test-design'
  | 'execution'
  | 'automation'
  | 'cicd';

export interface Phase {
  id: PhaseId;
  label: string;
  blurb: string;
}

export interface Agent {
  /** Two-digit ordinal, e.g. "01" */
  id: string;
  /** kebab slug, e.g. "prd-analyser" */
  slug: string;
  /** Display name */
  name: string;
  /** Phase this agent belongs to */
  phase: PhaseId;
  /** Short emoji/glyph for the card */
  glyph: string;
  /** What the agent does, in one line */
  description: string;
  /** The concrete action shown in the confirmation modal */
  action: string;
  /** Bullet points of what the agent will read / produce */
  willDo: string[];
  /** Sample output produced when the run completes */
  sampleOutput: string;
  /** Live state */
  status: AgentStatus;
  /** Last output text, shown on the card and in the phase view */
  lastOutput: string | null;
}

export type LogLevel = 'info' | 'success' | 'error' | 'warn';

export interface LogEntry {
  id: string;
  time: string;
  agentId: string;
  agentName: string;
  level: LogLevel;
  message: string;
}
