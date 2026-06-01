import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Agent, AgentStatus, LogEntry, LogLevel, PhaseId } from './types';
import { AGENTS, CHATBOT_AGENT_ID, PHASES } from './data/agents';
import { now, uid } from './lib/status';
import * as api from './lib/api';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import PhaseTabs from './components/PhaseTabs';
import PhaseView from './components/PhaseView';
import ConfirmModal from './components/ConfirmModal';
import LogPanel from './components/LogPanel';
import ChatbotPanel from './components/ChatbotPanel';

export default function App() {
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activePhase, setActivePhase] = useState<PhaseId>('requirements');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [prdFileName, setPrdFileName] = useState<string | null>(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  /** null = still probing, true = backend connected, false = offline sim */
  const [live, setLive] = useState<boolean | null>(null);
  const liveRef = useRef(false);

  const addLog = useCallback(
    (agent: Pick<Agent, 'id' | 'name'>, level: LogLevel, message: string) => {
      setLogs((prev) => [
        ...prev,
        { id: uid(), time: now(), agentId: agent.id, agentName: agent.name, level, message },
      ]);
    },
    []
  );

  const patchAgent = useCallback((id: string, patch: Partial<Agent>) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const setStatus = useCallback(
    (id: string, status: AgentStatus) => patchAgent(id, { status }),
    [patchAgent]
  );

  // ── Connect to backend (falls back to local simulation) ────────
  useEffect(() => {
    let dispose: (() => void) | undefined;
    (async () => {
      const ok = await api.probe();
      setLive(ok);
      liveRef.current = ok;
      if (!ok) return;

      // Server is the source of truth — merge its state onto our metadata.
      const applyServer = (servers: api.ServerAgent[]) =>
        setAgents((prev) =>
          prev.map((a) => {
            const s = servers.find((x) => x.id === a.id);
            return s ? { ...a, status: s.status, lastOutput: s.lastOutput } : a;
          })
        );

      try {
        const { agents: serverAgents, prd } = await api.fetchAgents();
        applyServer(serverAgents);
        
        if (prd) setPrdFileName(prd);
      } catch {
        /* stream snapshot will sync us shortly */
      }

      dispose = api.connectStream({
        onSnapshot: applyServer,
        onAgent: (s) =>
          patchAgent(s.id, { status: s.status, lastOutput: s.lastOutput }),
        onLog: (l) => setLogs((prev) => [...prev, l]),
      });
    })();
    return () => dispose?.();
  }, [patchAgent]);

  // ── Run lifecycle ──────────────────────────────────────────────
  const requestRun = useCallback(
    (id: string) => {
      const agent = agents.find((a) => a.id === id);
      if (!agent) return;
      setStatus(id, 'awaiting');
      setPendingId(id);
      addLog(agent, 'warn', 'Awaiting confirmation to run.');
    },
    [agents, setStatus, addLog]
  );

  const cancelRun = useCallback(() => {
    if (!pendingId) return;
    const agent = agents.find((a) => a.id === pendingId);
    setStatus(pendingId, 'idle');
    if (agent) addLog(agent, 'info', 'Run cancelled by user.');
    setPendingId(null);
  }, [pendingId, agents, setStatus, addLog]);

  const confirmRun = useCallback(() => {
    if (!pendingId) return;
    const id = pendingId;
    const agent = agents.find((a) => a.id === id);
    setPendingId(null);
    if (!agent) return;

    // Live: hand off to the backend; SSE drives status + logs from here.
    if (liveRef.current) {
      setStatus(id, 'running');
      void api.runAgent(id).catch(() => {
        patchAgent(id, { status: 'failed', lastOutput: 'Could not reach server.' });
        addLog(agent, 'error', 'Could not reach server.');
      });
      return;
    }

    // Offline: simulate the run locally.
    setStatus(id, 'running');
    addLog(agent, 'info', `Confirmed. ${agent.action}`);
    const duration = 1600 + Math.random() * 1800;
    window.setTimeout(() => {
      const failed = Math.random() < 0.12;
      if (failed) {
        const msg = 'Run failed — see logs for details.';
        patchAgent(id, { status: 'failed', lastOutput: msg });
        addLog(agent, 'error', msg);
      } else {
        patchAgent(id, { status: 'complete', lastOutput: agent.sampleOutput });
        addLog(agent, 'success', agent.sampleOutput);
      }
    }, duration);
  }, [pendingId, agents, setStatus, addLog, patchAgent]);

  const resetAgent = useCallback(
    (id: string) => {
      const agent = agents.find((a) => a.id === id);
      if (liveRef.current) {
        void api.resetAgent(id);
        return; // SSE will reflect the reset
      }
      patchAgent(id, { status: 'idle', lastOutput: null });
      if (agent) addLog(agent, 'info', 'Reset to idle.');
    },
    [agents, patchAgent, addLog]
  );

  // ── Selection (also switches to the agent's phase) ─────────────
  const selectAgent = useCallback(
    (id: string) => {
      setSelectedId(id);
      if (id === CHATBOT_AGENT_ID) {
        setChatbotOpen(true);
        return;
      }
      const agent = agents.find((a) => a.id === id);
      if (agent) setActivePhase(agent.phase);
    },
    [agents]
  );

  const uploadPrd = useCallback(
    async (file: File) => {
      setActivePhase('requirements');
      const prd = agents.find((a) => a.slug === 'prd-analyser')!;
      if (liveRef.current) {
        try {
          const name = await api.uploadPrd(file);
          setPrdFileName(name);
          addLog(prd, 'info', `PRD uploaded: ${name}`);
        } catch {
          addLog(prd, 'error', 'PRD upload failed.');
        }
        return;
      }
      setPrdFileName(file.name);
      addLog(prd, 'info', `PRD uploaded: ${file.name}`);
    },
    [agents, addLog]
  );

  // ── Derived global status ──────────────────────────────────────
  const { globalStatus, globalLabel } = useMemo(() => {
    const has = (s: AgentStatus) => agents.some((a) => a.status === s);
    const completed = agents.filter((a) => a.status === 'complete').length;
    if (has('failed'))
      return { globalStatus: 'failed' as AgentStatus, globalLabel: 'Attention needed' };
    if (has('running'))
      return { globalStatus: 'running' as AgentStatus, globalLabel: 'Pipeline running' };
    if (has('awaiting'))
      return { globalStatus: 'awaiting' as AgentStatus, globalLabel: 'Awaiting confirmation' };
    if (completed === agents.length)
      return { globalStatus: 'complete' as AgentStatus, globalLabel: 'All complete' };
    return {
      globalStatus: 'idle' as AgentStatus,
      globalLabel: completed ? `${completed}/${agents.length} complete` : 'Idle',
    };
  }, [agents]);

  const phase = PHASES.find((p) => p.id === activePhase)!;
  const phaseAgents = agents.filter((a) => a.phase === activePhase);
  const pendingAgent = agents.find((a) => a.id === pendingId) ?? null;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar
        prdFileName={prdFileName}
        globalStatus={globalStatus}
        globalLabel={globalLabel}
        onUploadPrd={uploadPrd}
        onOpenChatbot={() => setChatbotOpen(true)}
      />

      {/* Connection banner */}
      {live === false && (
        <div className="shrink-0 bg-amber-500/10 px-4 py-1.5 text-center text-[11px] text-amber-300">
          Offline mode — backend not detected. Runs are simulated. Start the
          server (<span className="font-mono">cd server &amp;&amp; npm run dev</span>) for live agents.
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <Sidebar agents={agents} selectedId={selectedId} onSelect={selectAgent} />

        <main className="flex min-w-0 flex-1 flex-col">
          <PhaseTabs
            phases={PHASES}
            active={activePhase}
            agents={agents}
            onChange={setActivePhase}
          />
          <PhaseView
            phase={phase}
            agents={phaseAgents}
            selectedId={selectedId}
            prdFileName={prdFileName}
            onSelect={selectAgent}
            onRequestRun={requestRun}
            onReset={resetAgent}
          />
          <LogPanel logs={logs} onClear={() => setLogs([])} />
        </main>
      </div>

      <ConfirmModal agent={pendingAgent} onConfirm={confirmRun} onCancel={cancelRun} />
      <ChatbotPanel
        agents={agents}
        prdFileName={prdFileName}
        open={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
      />
    </div>
  );
}
