import { useRef } from 'react';
import type { AgentStatus } from '../types';
import { STATUS_STYLES } from '../lib/status';

interface Props {
  prdFileName: string | null;
  globalStatus: AgentStatus;
  globalLabel: string;
  onUploadPrd: (file: File) => void;
  onOpenChatbot: () => void;
}

export default function TopBar({
  prdFileName,
  globalStatus,
  globalLabel,
  onUploadPrd,
  onOpenChatbot,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const s = STATUS_STYLES[globalStatus];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-bold text-white">
          QA
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-100">
            QA Orchestration Platform
          </div>
          <div className="text-[11px] text-slate-500">
            15 agents · 5 phases
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

        {/* PRD upload */}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.md,.txt"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUploadPrd(f);
            e.target.value = '';
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
        >
          <span>⬆️</span>
          {prdFileName ? (
            <span className="max-w-[160px] truncate">{prdFileName}</span>
          ) : (
            'Upload PRD'
          )}
        </button>

        {/* Chatbot trigger */}
        <button
          onClick={onOpenChatbot}
          className="flex items-center gap-2 rounded-md bg-gradient-to-br from-sky-500 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:brightness-110"
        >
          <span>💬</span>
          Ask QA Bot
        </button>
      </div>
    </header>
  );
}
