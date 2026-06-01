import { useRef } from 'react';
import type { PrdDoc } from '../lib/prd';

interface Props {
  open: boolean;
  prds: PrdDoc[];
  activePrdId: string | null;
  onClose: () => void;
  onUpload: (files: FileList) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function PrdManager({
  open,
  prds,
  activePrdId,
  onClose,
  onUpload,
  onSelect,
  onDelete,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-start">
      <div className="flex w-[26rem] animate-slideIn flex-col border-r border-slate-800 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📄</span>
            <div>
              <div className="text-sm font-semibold text-slate-100">PRD Documents</div>
              <div className="text-[11px] text-slate-500">
                {prds.length} uploaded · select one to drive the agents
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Upload */}
        <div className="border-b border-slate-800 p-4">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.md,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) onUpload(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-600 bg-slate-900/50 px-3 py-3 text-sm font-medium text-slate-200 transition hover:border-sky-500 hover:bg-slate-800"
          >
            <span>⬆️</span> Upload PRD document(s)
          </button>
          <p className="mt-2 text-[11px] text-slate-500">
            You can upload multiple PRDs. The selected one becomes the active
            document all 15 agents act on.
          </p>
        </div>

        {/* List */}
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {prds.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
              No PRDs yet. Upload one to begin.
            </div>
          ) : (
            prds.map((prd) => {
              const active = prd.id === activePrdId;
              return (
                <div
                  key={prd.id}
                  onClick={() => onSelect(prd.id)}
                  className={`cursor-pointer rounded-lg border p-3 transition ${
                    active
                      ? 'border-sky-500 bg-sky-950/30 ring-1 ring-sky-500/40'
                      : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-slate-100">
                          {prd.name}
                        </span>
                        {active && (
                          <span className="rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {prd.sizeLabel} · {prd.uploadedAt}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(prd.id);
                      }}
                      className="shrink-0 rounded px-1.5 py-0.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300"
                      title="Delete this PRD"
                    >
                      🗑
                    </button>
                  </div>

                  {/* Parsed profile preview */}
                  <div className="mt-2 rounded-md bg-slate-950/60 p-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Detected features ({prd.profile.features.length})
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {prd.profile.features.map((feat) => (
                        <span
                          key={feat}
                          className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {!active && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(prd.id);
                      }}
                      className="mt-2 w-full rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500"
                    >
                      Select & drive agents
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="flex-1 bg-black/40" onClick={onClose} />
    </div>
  );
}
