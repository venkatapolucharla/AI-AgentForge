# QA Orchestration — Dashboard UI

React + TypeScript + Tailwind CSS dashboard for the QA Orchestration Platform.

## Run

```bash
cd ui
npm install
npm run dev      # http://localhost:5173
```

## Layout

- **Top bar** — PRD upload, global pipeline status, and the QA Chatbot trigger.
- **Left sidebar** — all 15 agent cards with live status indicators
  (idle / running / complete / failed) and their last output.
- **Main area** — 5 phase tabs (Requirements, Test Design, Execution,
  Automation, CI/CD). Each phase shows its agents, outputs, and a **Run**
  button that opens a confirmation modal describing exactly what the agent
  will do before anything happens.
- **Bottom panel** — real-time agent log stream.

## Colour code

| Border | Meaning |
| ------ | ------- |
| Amber  | Awaiting confirmation |
| Sky    | Running |
| Green  | Complete |
| Red    | Failed |

> The agent runs are simulated client-side so the UI is fully interactive
> without a backend. Wire `confirmRun` in `src/App.tsx` to the real agents
> (see `../agents/`) to make it live.
