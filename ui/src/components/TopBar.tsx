import type { AgentStatus } from '../types';
import { STATUS_STYLES } from '../lib/status';

interface Props {
  activePrdName: string | null;
  prdCount: number;
  globalStatus: AgentStatus;
  globalLabel: string;
  onOpenPrdManager: () => void;
  onOpenOrchestrator: () => void;
  onOpenChatbot: () => void;
}

export default function TopBar({
  activePrdName,
  prdCount,
  globalStatus,
  globalLabel,
  onOpenPrdManager,
  onOpenOrchestrator,
  onOpenChatbot,
}: Props) {
  const s = STATUS_STYLES[globalStatus];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-bold text-white">
          AI
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-900">
            AI Agent Forge
          </div>
          <div className="text-[11px] text-slate-500">
            8 agents · 5 phases
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Global status pill */}
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${s.chipBg} ${s.text}`}
        >
          <span className={`h-2 w-2 rounded-full ${s.dot}`} />
          {globalLabel}
        </div>

        {/* PRD manager */}
        <button
          onClick={onOpenPrdManager}
          className="flex items-center gap-2 rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
          title="Manage PRD documents"
        >
          <span>📄</span>
          {activePrdName ? (
            <span className="max-w-[160px] truncate">{activePrdName}</span>
          ) : (
            'Upload PRD'
          )}
          {prdCount > 0 && (
            <span className="rounded-full bg-slate-300 px-1.5 text-[10px] text-slate-700">
              {prdCount}
            </span>
          )}
        </button>

        {/* Master Orchestrator */}
        <button
          onClick={onOpenOrchestrator}
          className="flex items-center gap-2 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:brightness-110"
          title="Run the full 8-agent pipeline"
        >
          <span>🎛️</span>
          Run Pipeline
        </button>

        {/* Chatbot trigger */}
        <button
          onClick={onOpenChatbot}
          className="flex items-center gap-2 rounded-md bg-gradient-to-br from-sky-500 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:brightness-110"
        >
          <span>💬</span>
          Ask Smart Advisor
        </button>
      </div>
    </header>
  );
}
