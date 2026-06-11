import { useCallback, useMemo, useState } from 'react';
import type { Agent, AgentStatus, LogEntry, LogLevel, PhaseId } from './types';
import { AGENTS, CHATBOT_AGENT_ID, PHASES } from './data/agents';
import { now, uid } from './lib/status';
import {
  agentOutputFor,
  buildArtifacts,
  createPrdDoc,
  type PrdArtifacts,
  type PrdDoc,
} from './lib/prd';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import PhaseTabs from './components/PhaseTabs';
import PhaseView from './components/PhaseView';
import ConfirmModal from './components/ConfirmModal';
import LogPanel from './components/LogPanel';
import ChatbotPanel from './components/ChatbotPanel';
import PrdManager from './components/PrdManager';
import OrchestratorPanel from './components/OrchestratorPanel';

/** Read an uploaded file as text (best-effort for binary formats). */
function readFileText(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => resolve('');
    reader.readAsText(file);
  });
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function App() {
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activePhase, setActivePhase] = useState<PhaseId>('requirements');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [prdManagerOpen, setPrdManagerOpen] = useState(false);
  const [orchestratorOpen, setOrchestratorOpen] = useState(false);

  // ── Multi-PRD state ────────────────────────────────────────────
  const [prds, setPrds] = useState<PrdDoc[]>([]);
  const [activePrdId, setActivePrdId] = useState<string | null>(null);

  const activePrd = prds.find((p) => p.id === activePrdId) ?? null;
  const artifacts: PrdArtifacts | null = useMemo(
    () => (activePrd ? buildArtifacts(activePrd.profile) : null),
    [activePrd]
  );

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

  /** Reset every agent to idle (used when switching the active PRD). */
  const resetAllAgents = useCallback(() => {
    setAgents((prev) =>
      prev.map((a) => ({ ...a, status: 'idle', lastOutput: null }))
    );
  }, []);

  // ── PRD upload / select / delete ───────────────────────────────
  const uploadPrds = useCallback(
    async (files: FileList) => {
      const created: PrdDoc[] = [];
      for (const file of Array.from(files)) {
        const text = await readFileText(file);
        created.push(createPrdDoc(file.name, text, humanSize(file.size)));
      }
      setPrds((prev) => [...prev, ...created]);
      const prdAgent = AGENTS.find((a) => a.slug === 'prd-analyser')!;
      created.forEach((c) =>
        addLog(
          prdAgent,
          'info',
          `PRD uploaded: ${c.name} (${c.profile.features.length} features detected).`
        )
      );
      // Auto-select the first uploaded PRD if none active yet.
      setActivePrdId((curr) => curr ?? created[0]?.id ?? null);
      if (!activePrdId && created[0]) resetAllAgents();
    },
    [addLog, activePrdId, resetAllAgents]
  );

  const selectPrd = useCallback(
    (id: string) => {
      if (id === activePrdId) return;
      setActivePrdId(id);
      resetAllAgents();
      const prd = prds.find((p) => p.id === id);
      const prdAgent = AGENTS.find((a) => a.slug === 'prd-analyser')!;
      if (prd) {
        addLog(
          prdAgent,
          'info',
          `Active PRD switched to "${prd.name}". Agents reset — run them to regenerate artifacts.`
        );
      }
      setActivePhase('requirements');
    },
    [activePrdId, prds, resetAllAgents, addLog]
  );

  const deletePrd = useCallback(
    (id: string) => {
      setPrds((prev) => prev.filter((p) => p.id !== id));
      if (id === activePrdId) {
        setActivePrdId(null);
        resetAllAgents();
      }
    },
    [activePrdId, resetAllAgents]
  );

  // ── Run lifecycle (PRD-driven) ─────────────────────────────────
  const requestRun = useCallback(
    (id: string) => {
      const agent = agents.find((a) => a.id === id);
      if (!agent) return;
      if (!activePrd) {
        addLog(agent, 'warn', 'No active PRD. Upload and select a PRD first.');
        setPrdManagerOpen(true);
        return;
      }
      setStatus(id, 'awaiting');
      setPendingId(id);
      addLog(agent, 'warn', 'Awaiting confirmation to run.');
    },
    [agents, activePrd, setStatus, addLog]
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
    if (!agent || !activePrd || !artifacts) return;

    setStatus(id, 'running');
    addLog(agent, 'info', `Confirmed. ${agent.action}`);

    const duration = 1400 + Math.random() * 1500;
    window.setTimeout(() => {
      // Output is grounded in the active PRD's artifacts.
      const output =
        agentOutputFor(agent.slug, activePrd, artifacts) ?? agent.sampleOutput;
      patchAgent(id, { status: 'complete', lastOutput: output });
      addLog(agent, 'success', output);
    }, duration);
  }, [pendingId, agents, activePrd, artifacts, setStatus, addLog, patchAgent]);

  const resetAgent = useCallback(
    (id: string) => {
      const agent = agents.find((a) => a.id === id);
      patchAgent(id, { status: 'idle', lastOutput: null });
      if (agent) addLog(agent, 'info', 'Reset to idle.');
    },
    [agents, patchAgent, addLog]
  );

  // ── Selection ──────────────────────────────────────────────────
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
        activePrdName={activePrd?.name ?? null}
        prdCount={prds.length}
        globalStatus={globalStatus}
        globalLabel={globalLabel}
        onOpenPrdManager={() => setPrdManagerOpen(true)}
        onOpenOrchestrator={() => setOrchestratorOpen(true)}
        onOpenChatbot={() => setChatbotOpen(true)}
      />

      {/* No-PRD banner */}
      {!activePrd && (
        <div className="shrink-0 bg-sky-100 px-4 py-1.5 text-center text-[11px] text-sky-700">
          No active PRD. <button onClick={() => setPrdManagerOpen(true)} className="underline">Upload a PRD</button> to let the 8 agents generate the test plan, test cases, smoke &amp; regression suites, defects, and Jira tickets from it.
        </div>
      )}

      <div className="flex min-h-0 flex-1 bg-white">
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
            activePrd={activePrd}
            artifacts={artifacts}
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
        activePrd={activePrd}
        artifacts={artifacts}
        open={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
      />
      <PrdManager
        open={prdManagerOpen}
        prds={prds}
        activePrdId={activePrdId}
        onClose={() => setPrdManagerOpen(false)}
        onUpload={uploadPrds}
        onSelect={selectPrd}
        onDelete={deletePrd}
      />
      <OrchestratorPanel
        open={orchestratorOpen}
        agents={agents}
        activePrd={activePrd}
        artifacts={artifacts}
        onClose={() => setOrchestratorOpen(false)}
        onAgentUpdate={patchAgent}
        onLog={addLog}
      />
    </div>
  );
}
