import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bus, type BusEvent } from './bus.js';
import { listAgents, resetAgent, runAgent, store } from './runner.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = join(__dirname, '..', 'uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

const PORT = Number(process.env.PORT ?? 8787);

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: UPLOAD_DIR });

// ── Health ───────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, agents: listAgents().length });
});

// ── Agent state ──────────────────────────────────────────────────
app.get('/api/agents', (_req, res) => {
  res.json({ agents: listAgents(), prd: store.prdFileName });
});

app.post('/api/agents/:id/run', async (req, res) => {
  const agent = listAgents().find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'Unknown agent' });
  // Fire-and-stream: respond now, progress arrives over SSE.
  res.status(202).json({ accepted: true, id: agent.id });
  void runAgent(agent.id);
});

app.post('/api/agents/:id/reset', (req, res) => {
  const agent = resetAgent(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Unknown agent' });
  res.json({ agent });
});

// ── PRD upload ───────────────────────────────────────────────────
app.post('/api/prd', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  store.prdFileName = req.file.originalname;
  store.prdPath = req.file.path;
  res.json({ fileName: store.prdFileName });
});

// ── Live log + status stream (Server-Sent Events) ────────────────
app.get('/api/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });
  res.write('retry: 2000\n\n');

  // Send a snapshot so a fresh client is immediately in sync.
  res.write(`event: snapshot\ndata: ${JSON.stringify(listAgents())}\n\n`);

  const onEvent = (event: BusEvent) => {
    res.write(`event: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`);
  };
  bus.on('event', onEvent);

  const keepAlive = setInterval(() => res.write(': ping\n\n'), 25_000);

  req.on('close', () => {
    clearInterval(keepAlive);
    bus.off('event', onEvent);
  });
});

app.listen(PORT, () => {
  console.log(`QA Orchestration server listening on http://localhost:${PORT}`);
});
