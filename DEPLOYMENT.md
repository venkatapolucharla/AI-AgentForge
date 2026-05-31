# Deployment

The app deploys as two pieces:

- **Frontend** (`ui/`) → **Vercel** (static Vite build) — already configured via
  [`vercel.json`](vercel.json).
- **Backend** (`server/`) → **Render** (free Node web service) — configured via
  [`render.yaml`](render.yaml).

The frontend works on its own in **offline/simulation mode**; connecting the
backend upgrades it to **live mode** (real agent runs + streamed logs over SSE).

---

## 1. Deploy the backend on Render (free)

Render's free web service tier is genuinely free (750 instance-hours/month —
enough for one always-on service) and supports SSE.

1. Go to <https://dashboard.render.com> → **New** → **Blueprint**.
2. Connect the GitHub repo `nagarjunabhr8/qa-orchestration`.
3. Render reads [`render.yaml`](render.yaml) and proposes a web service named
   `qa-orchestration-server` on the **free** plan. Click **Apply**.
4. Wait for the first deploy. You'll get a URL like
   `https://qa-orchestration-server.onrender.com`.
5. Verify: open `https://<your-service>.onrender.com/api/health` →
   `{"ok":true,"agents":15}`.

Manual alternative (no Blueprint): New → **Web Service**, root directory
`server`, build `npm install`, start `npm start`, health check `/api/health`.

### Cold starts (free tier)
Free services **spin down after ~15 min of inactivity** and take ~1 min to wake
on the next request. Practically: if the backend is asleep when you open the
dashboard, the quick health probe times out and the UI loads in **simulation
mode**. Once the backend wakes (open the `/api/health` URL once, or just retry),
**refresh the dashboard** and it connects in live mode.

---

## 2. Point the frontend at the backend (Vercel)

The frontend reads `VITE_API_URL` **at build time**.

1. Vercel project → **Settings → Environment Variables**.
2. Add: `VITE_API_URL = https://<your-service>.onrender.com` (no trailing slash),
   for the **Production** (and Preview) environments.
3. **Redeploy** the frontend (Deployments → ⋯ → Redeploy) so the value is baked
   into the build.

Without `VITE_API_URL`, the production frontend stays in offline/simulation mode
by design — it won't try to reach `localhost`.

---

## 3. Lock down CORS (optional but recommended)

By default the backend allows all origins. To restrict it to your frontend:

- In Render → the service → **Environment** → set
  `CORS_ORIGIN = https://<your-app>.vercel.app` (comma-separate multiple
  origins). Redeploy the backend.

---

## Database

**None required.** The backend keeps agent state in memory and stores uploaded
PRDs on the (ephemeral) instance disk. State resets when the service restarts —
which is fine for a demo/orchestration cockpit.

If you later want runs/defects to **persist** across restarts, free options:

| Need | Free service | Connection style |
| ---- | ------------ | ---------------- |
| Relational (runs, defects) | [Neon](https://neon.tech) Postgres | `postgresql://user:pass@<host>/db?sslmode=require` (set as `DATABASE_URL`) |
| Key/value or live state | [Upstash](https://upstash.com) Redis | `rediss://default:<token>@<host>:6379` (set as `REDIS_URL`) |
| Postgres + auth + storage | [Supabase](https://supabase.com) | connection string from project settings |

Add the chosen connection string as an env var in Render and wire it into
`server/src/runner.ts` (where state currently lives in a `Map`).

---

## Local development

```bash
# backend
cd server && npm install && npm run dev   # http://localhost:8787

# frontend (separate terminal)
cd ui && npm install && npm run dev        # http://localhost:5173
```

In dev the frontend defaults to `http://localhost:8787`, so live mode works with
no extra configuration.
