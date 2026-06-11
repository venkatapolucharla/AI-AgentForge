import type { Agent } from '../types';
import { STATUS_STYLES } from '../lib/status';
import StatusBadge from './StatusBadge';

interface Props {
  agent: Agent;
  selected: boolean;
  onSelect: (id: string) => void;
}

export default function AgentCard({ agent, selected, onSelect }: Props) {
  const s = STATUS_STYLES[agent.status];

  return (
    <button
      onClick={() => onSelect(agent.id)}
      className={`group w-full rounded-lg border-l-4 ${s.border} border-y border-r border-y-slate-200 border-r-slate-200 bg-slate-100 p-3 text-left transition
        hover:bg-slate-150 hover:border-r-slate-300
        ${selected ? 'ring-2 ring-sky-500/60 bg-sky-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-base leading-none">{agent.glyph}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-slate-500">
                {agent.id}
              </span>
              <span className="truncate text-sm font-semibold text-slate-900">
                {agent.name}
              </span>
            </div>
          </div>
        </div>
        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
      </div>

      <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-slate-600">
        {agent.lastOutput ?? agent.description}
      </p>

      <div className="mt-2">
        <StatusBadge status={agent.status} />
      </div>
    </button>
  );
}
