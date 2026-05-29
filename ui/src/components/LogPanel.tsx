import { useEffect, useRef, useState } from 'react';
import type { LogEntry } from '../types';
import { LOG_LEVEL_COLOR } from '../lib/status';

interface Props {
  logs: LogEntry[];
  onClear: () => void;
}

export default function LogPanel({ logs, onClear }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!collapsed) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, collapsed]);

  return (
    <div className="shrink-0 border-t border-slate-800 bg-slate-950/80">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulseSoft rounded-full bg-emerald-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Agent Log Stream
          </h3>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-500">
            {logs.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="text-[11px] text-slate-500 transition hover:text-slate-300"
          >
            Clear
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-[11px] text-slate-500 transition hover:text-slate-300"
          >
            {collapsed ? 'Expand ▲' : 'Collapse ▼'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="h-44 overflow-y-auto px-4 pb-3 font-mono text-[11px] leading-relaxed">
          {logs.length === 0 ? (
            <div className="py-6 text-center text-slate-600">
              No activity yet. Run an agent to see live logs.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-2">
                <span className="shrink-0 text-slate-600">{log.time}</span>
                <span className="shrink-0 text-slate-500">
                  [{log.agentId}]
                </span>
                <span className={LOG_LEVEL_COLOR[log.level]}>
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>
      )}
    </div>
  );
}
