import { useEffect, useRef, useState } from 'react';
import type { Agent } from '../types';
import type { PrdArtifacts, PrdDoc } from '../lib/prd';
import {
  answerQuestion,
  isGreeting,
  GREETING_MESSAGE,
  OUT_OF_SCOPE_MESSAGE,
  OPTION_TOPIC_IDS,
  TOPICS,
  WELCOME_MESSAGE,
  type KbContext,
} from '../lib/knowledgeBase';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  /** Topic option buttons rendered under a bot message. */
  options?: { id: string; label: string }[];
}

interface Props {
  open: boolean;
  agents: Agent[];
  activePrd: PrdDoc | null;
  artifacts: PrdArtifacts | null;
  onClose: () => void;
}

const STARTER_SUGGESTIONS = [
  'What features are in the PRD?',
  'Show me the test plan',
  'Give me the P0 test cases',
];

/** Phrases that signal the user wants to end the chat. */
const END_PHRASES = [
  'bye', 'goodbye', 'no thanks', 'that is all', "that's all", 'exit', 'quit',
  'end chat', 'no, thanks', 'nothing else', 'done',
];

const optionButtons = () =>
  OPTION_TOPIC_IDS.map((id) => {
    const t = TOPICS.find((x) => x.id === id)!;
    return { id, label: t.label };
  });

export default function ChatbotPanel({ open, agents, activePrd, artifacts, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', text: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState('');
  const [ended, setEnded] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!open) return null;

  const ctx: KbContext = { agents, activePrd, artifacts };

  function pushBot(text: string, options?: ChatMessage['options']) {
    setMessages((m) => [...m, { role: 'bot', text, options }]);
  }

  function endSession() {
    setEnded(true);
    pushBot(
      'Thank you for contacting QA Orchestration Support! 🙏 If you need anything else, reopen the chat anytime. Have a great day!'
    );
  }

  function respondTo(question: string) {
    const q = question.toLowerCase().trim();

    // 1. End-of-chat intent.
    if (END_PHRASES.some((p) => q === p || q.includes(p))) {
      endSession();
      return;
    }

    // 2. Greeting → ONLY the greeting message (per spec).
    if (isGreeting(question)) {
      pushBot(GREETING_MESSAGE);
      return;
    }

    // 3. Topic routing.
    const result = answerQuestion(question, ctx);
    if (result.kind === 'answer') {
      pushBot(result.text);
      pushBot('Is there anything else I can help you with?');
      return;
    }

    // 4. Out-of-scope → exact refusal + topic options.
    pushBot(OUT_OF_SCOPE_MESSAGE, optionButtons());
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || ended) return;
    setMessages((m) => [...m, { role: 'user', text: trimmed }]);
    setInput('');
    setTimeout(() => respondTo(trimmed), 120);
  }

  function chooseOption(id: string) {
    if (ended) return;
    const topic = TOPICS.find((t) => t.id === id);
    if (!topic) return;
    setMessages((m) => [...m, { role: 'user', text: topic.label }]);
    setTimeout(() => {
      pushBot(topic.answer(ctx, topic.label.toLowerCase()));
      pushBot('Is there anything else I can help you with?');
    }, 120);
  }

  function restart() {
    setMessages([{ role: 'bot', text: WELCOME_MESSAGE }]);
    setEnded(false);
    setInput('');
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="flex w-96 animate-slideIn flex-col border-l border-slate-800 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <div>
              <div className="text-sm font-semibold text-slate-100">QA Chatbot</div>
              <div className="text-[11px] text-slate-500">
                Agent 15 · {ended ? 'Session ended' : 'Online'}
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

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i}>
              <div
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  {m.text}
                </div>
              </div>
              {m.options && !ended && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => chooseOption(opt.id)}
                      className="rounded-full border border-sky-700 bg-sky-900/30 px-2.5 py-1 text-[11px] text-sky-200 transition hover:bg-sky-800/50"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Starter suggestions (only at the very start) */}
        {messages.length === 1 && !ended && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {STARTER_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-slate-700 px-2.5 py-1 text-[11px] text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Composer / ended state */}
        {ended ? (
          <div className="border-t border-slate-800 p-3">
            <button
              onClick={restart}
              className="w-full rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          <div className="border-t border-slate-800 p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send(input)}
                placeholder="Ask about the PRD, test plan, or test cases…"
                className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
              />
              <button
                onClick={() => send(input)}
                className="rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
              >
                Send
              </button>
            </div>
            <button
              onClick={endSession}
              className="mt-2 text-[11px] text-slate-500 transition hover:text-slate-300"
            >
              End chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
