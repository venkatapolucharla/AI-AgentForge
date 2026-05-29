import { useState } from 'react';
import type { Agent } from '../types';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}

interface Props {
  open: boolean;
  agents: Agent[];
  onClose: () => void;
}

const SUGGESTIONS = [
  'What is the current pipeline status?',
  'Summarise the last test execution',
  'Which agents have failed?',
];

export default function ChatbotPanel({ open, agents, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      text: 'Hi! I am the QA Chatbot. Ask me about runs, defects, coverage, or any agent’s last output.',
    },
  ]);
  const [input, setInput] = useState('');

  if (!open) return null;

  function answer(question: string): string {
    const q = question.toLowerCase();
    const failed = agents.filter((a) => a.status === 'failed');
    const running = agents.filter((a) => a.status === 'running');
    const done = agents.filter((a) => a.status === 'complete');

    if (q.includes('fail')) {
      return failed.length
        ? `Failed agents: ${failed.map((a) => `${a.id} ${a.name}`).join(', ')}.`
        : 'No agents have failed. ✅';
    }
    if (q.includes('status') || q.includes('pipeline')) {
      return `Pipeline status — ${done.length} complete, ${running.length} running, ${failed.length} failed, out of ${agents.length} agents.`;
    }
    if (q.includes('execut')) {
      const exec = agents.find((a) => a.slug === 'test-executor');
      return exec?.lastOutput ?? 'The Test Executor has not run yet.';
    }
    const named = agents.find((a) => q.includes(a.slug.replace(/-/g, ' ')));
    if (named) {
      return named.lastOutput ?? `${named.name} has no output yet.`;
    }
    return 'I can report on pipeline status, failures, execution results, or any agent’s last output. Try one of the suggestions below.';
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [
      ...m,
      { role: 'user', text: trimmed },
      { role: 'bot', text: answer(trimmed) },
    ]);
    setInput('');
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="flex w-96 animate-slideIn flex-col border-l border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <div>
              <div className="text-sm font-semibold text-slate-100">
                QA Chatbot
              </div>
              <div className="text-[11px] text-slate-500">Agent 15</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-800 text-slate-200'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-slate-700 px-2.5 py-1 text-[11px] text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-slate-800 p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            placeholder="Ask the QA bot…"
            className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
          />
          <button
            onClick={() => send(input)}
            className="rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
