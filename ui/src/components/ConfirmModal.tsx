import { useEffect } from 'react';
import type { Agent } from '../types';

interface Props {
  agent: Agent | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ agent, onConfirm, onCancel }: Props) {
  useEffect(() => {
    if (!agent) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [agent, onConfirm, onCancel]);

  if (!agent) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg animate-fadeIn rounded-2xl border-l-4 border-amber-400 border-y border-r border-y-slate-700 border-r-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-slate-800 p-5">
          <span className="text-2xl">{agent.glyph}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                Confirmation required
              </span>
            </div>
            <h2 className="mt-1.5 text-base font-semibold text-slate-100">
              {agent.id} · {agent.name}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Action
            </div>
            <p className="mt-1 text-sm text-slate-200">{agent.action}</p>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              This agent will
            </div>
            <ul className="mt-1.5 space-y-1.5">
              {agent.willDo.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-slate-300"
                >
                  <span className="mt-0.5 text-amber-400">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-amber-400/5 px-3 py-2 text-[11px] text-amber-200/80">
            Review the steps above. Nothing happens until you confirm.
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-800 p-4">
          <button
            onClick={onCancel}
            className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Confirm &amp; run
          </button>
        </div>
      </div>
    </div>
  );
}
