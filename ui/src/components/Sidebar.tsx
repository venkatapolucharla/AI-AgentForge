import type { Agent } from '../types';
import AgentCard from './AgentCard';

interface Props {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function Sidebar({ agents, selectedId, onSelect }: Props) {
  const counts = agents.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950/60">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Agents
        </h2>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
          {agents.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pb-3 text-[11px] text-slate-500">
        {counts.running ? (
          <span className="text-sky-400">{counts.running} running</span>
        ) : null}
        {counts.awaiting ? (
          <span className="text-amber-400">{counts.awaiting} awaiting</span>
        ) : null}
        {counts.complete ? (
          <span className="text-emerald-400">{counts.complete} done</span>
        ) : null}
        {counts.failed ? (
          <span className="text-red-400">{counts.failed} failed</span>
        ) : null}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-4">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            selected={agent.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </aside>
  );
}
