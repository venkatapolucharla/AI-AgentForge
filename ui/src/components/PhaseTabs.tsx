import type { Agent, Phase, PhaseId } from '../types';

interface Props {
  phases: Phase[];
  active: PhaseId;
  agents: Agent[];
  onChange: (id: PhaseId) => void;
}

export default function PhaseTabs({ phases, active, agents, onChange }: Props) {
  return (
    <nav className="flex shrink-0 items-center gap-1 border-b border-slate-800 bg-slate-950/40 px-3">
      {phases.map((phase) => {
        const phaseAgents = agents.filter((a) => a.phase === phase.id);
        const running = phaseAgents.some((a) => a.status === 'running');
        const awaiting = phaseAgents.some((a) => a.status === 'awaiting');
        const failed = phaseAgents.some((a) => a.status === 'failed');
        const allDone =
          phaseAgents.length > 0 &&
          phaseAgents.every((a) => a.status === 'complete');

        const dot = failed
          ? 'bg-red-500'
          : running
            ? 'bg-sky-400 animate-pulseSoft'
            : awaiting
              ? 'bg-amber-400 animate-pulseSoft'
              : allDone
                ? 'bg-emerald-500'
                : 'bg-slate-600';

        const isActive = phase.id === active;

        return (
          <button
            key={phase.id}
            onClick={() => onChange(phase.id)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition
              ${
                isActive
                  ? 'text-slate-100'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <span className={`h-2 w-2 rounded-full ${dot}`} />
            {phase.label}
            <span className="rounded-full bg-slate-800 px-1.5 text-[10px] text-slate-400">
              {phaseAgents.length}
            </span>
            {isActive && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-sky-500" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
