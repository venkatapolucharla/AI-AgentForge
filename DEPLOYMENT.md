# Deployment Guide — 8-Agent QA Orchestration Platform

## Overview

This platform deploys as a single unified Vercel project with serverless functions for all 8 agents.

**Architecture:**
- **Frontend** (`ui/`) → Vercel Static Build (React/Vite)
- **Backend** (`server/`) → Vercel Serverless Functions (Express + Agent Runners)
- **Agents** (8 serverless functions) → Deployed as `/api/agents/*`

## Deployment Models

### Option 1: Vercel (Recommended for Production)
- **Frontend + Backend**: All on Vercel
- **Startup**: 15-30 seconds
- **Cost**: ~$20-30/month (Pro plan recommended)
- **Scaling**: Automatic via Vercel
- **Uptime**: 99.95% SLA

### Option 2: Hybrid (Legacy)
- **Frontend**: Vercel
- **Backend**: Render (free tier)
- **Cold Starts**: 1-2 minutes after 15 min inactivity
- **Cost**: Free (frontend + backend)
- **Limitation**: Free backend spins down after inactivity

---

## RECOMMENDED: Deploy on Vercel (Full Stack)

### Prerequisites
- GitHub repo with this code
- Vercel account (free or Pro)
- JIRA API token
- Storage service credentials (S3, GCS, or Vercel Blob)

### Step 1: Connect GitHub to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login and deploy
vercel login
vercel --prod
```

Or via Dashboard:
1. Visit https://vercel.com/dashboard
2. Click "Add New → Project"
3. Import your GitHub repository
4. Vercel auto-detects monorepo structure

### Step 2: Configure Environment Variables

In Vercel Dashboard → **Settings → Environment Variables**:

```env
# Core Settings
NODE_ENV=production
VITE_API_URL=https://your-project.vercel.app/api

# JIRA Configuration (Agent 02: JIRA Story Creator)
JIRA_API_URL=https://your-instance.atlassian.net
JIRA_API_TOKEN=your-api-token-here
JIRA_PROJECT_KEY=QA

# Test Execution (Agent 04: Test Executor)
TEST_URL=https://staging.app.example.com
TEST_TIMEOUT=30000
WORKERS=4
CAPTURE_VIDEO=true

# Storage & Artifacts
STORAGE_TYPE=s3  # or "gcs" or "vercel-blob"
AWS_S3_BUCKET=qa-orchestration-artifacts
AWS_ACCESS_KEY_ID=your-key-id
AWS_SECRET_ACCESS_KEY=your-secret-key

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
TEAMS_WEBHOOK_URL=https://outlook.webhook.office.com/webhookb2/...

# Agent Settings
ENABLE_CONFIRMATION_GATES=true
AGENT_TIMEOUT=300000
AGENT_RETRY_ATTEMPTS=2
```

### Step 3: Verify Build & Deploy

```bash
# Check build locally
npm run build --prefix ui
npm run typecheck --prefix server

# Deploy to production
vercel --prod

# Get live URL
# https://your-project.vercel.app
```

### Step 4: Test Agent Endpoints

```bash
# Health check
curl https://your-project.vercel.app/api/health

# Test PRD Analyser
curl -X POST https://your-project.vercel.app/api/agents/01-prd-analyser \
  -H "Content-Type: application/json" \
  -d '{"prdPath": "s3://bucket/prd.pdf"}'

# Test QA Chatbot
curl https://your-project.vercel.app/api/agents/08-qa-chatbot
```

---

## LEGACY: Deploy Frontend on Vercel + Backend on Render

### Step 1: Deploy Backend on Render

1. Go to https://dashboard.render.com → **New** → **Blueprint**
2. Connect your GitHub repository
3. Render reads `render.yaml` and deploys `qa-orchestration-server`
4. Get your backend URL: `https://qa-orchestration-server.onrender.com`
5. Test health: `https://<your-service>.onrender.com/api/health` → `{"ok":true,"agents":8}`

**Note**: Free tier spins down after 15 min of inactivity (takes ~1 min to wake up).

### Step 2: Configure Frontend on Vercel

1. Vercel → Project → **Settings → Environment Variables**
2. Add: `VITE_API_URL=https://qa-orchestration-server.onrender.com` (no trailing slash)
3. For environment: **Production** (and Preview if desired)
4. **Redeploy** frontend (Deployments → ⋯ → Redeploy)

### Step 3: Access the Application

- **Frontend**: https://your-project.vercel.app
- **Backend**: https://qa-orchestration-server.onrender.com
- **Health Check**: https://qa-orchestration-server.onrender.com/api/health

---

## 8 Agent Deployment Map

Each agent is deployed as a serverless function:

| Agent | Endpoint | Function | Purpose |
|-------|----------|----------|---------|
| 1 | `/api/agents/01-prd-analyser` | `api/agents/01-prd-analyser.ts` | Extract PRD features |
| 2 | `/api/agents/02-jira-story-creator` | `api/agents/02-jira-story-creator.ts` | Create JIRA stories |
| 3 | `/api/agents/03-test-case-generator` | `api/agents/03-test-case-generator.ts` | Generate test cases |
| 4 | `/api/agents/04-test-executor` | `api/agents/04-test-executor.ts` | Run tests |
| 5 | `/api/agents/05-defect-analyser` | `api/agents/05-defect-analyser.ts` | Analyze failures |
| 6 | `/api/agents/06-automation-developer` | `api/agents/06-automation-developer.ts` | Generate automation code |
| 7 | `/api/agents/07-code-reviewer` | `api/agents/07-code-reviewer.ts` | Review code quality |
| 8 | `/api/agents/08-qa-chatbot` | `api/agents/08-qa-chatbot.ts` | Chat interface |

---

## Monitoring & Troubleshooting

### Vercel Logs
```bash
# View real-time logs
vercel logs --follow

# View specific function logs
vercel logs --function api/agents/01-prd-analyser
```

### Common Issues

| Issue | Solution |
|-------|----------|
| **Function timeout** | Increase timeout in `vercel.json` or break into async steps |
| **Cold start delays** | Upgrade to Vercel Pro (faster node allocation) |
| **JIRA 401 Unauthorized** | Verify JIRA_API_TOKEN is correct and not expired |
| **S3 access denied** | Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY |
| **Webhook failures** | Verify SLACK_WEBHOOK_URL and TEAMS_WEBHOOK_URL |

### Rollback
```bash
# See deployment history
vercel list

# Rollback to previous version
vercel rollback

# Deploy specific commit
vercel --target production --commit <GIT_SHA>
```

---

## Performance Optimization

### Cold Start Reduction
- ✅ Keep function memory ≥ 512MB
- ✅ Minimize dependencies (tree-shake unused code)
- ✅ Use connection pooling for databases
- ✅ Cache JIRA API responses (5 min TTL)

### API Response Caching
- Static assets: `max-age=31536000` (1 year)
- API responses: `max-age=300` (5 minutes)
- Agent outputs: No cache (real-time)

---

## Security Best Practices

1. **Never commit secrets** → Use Vercel Environment Variables
2. **Rotate API tokens** → Monthly for JIRA, AWS keys
3. **Enable rate limiting** → Protect API endpoints
4. **Use HTTPS only** → All communication encrypted
5. **Validate inputs** → Prevent SQL/script injection
6. **Log securely** → No sensitive data in logs

---

## Cost Estimation

### Vercel Pro Plan: $20/month + usage
- **100K agent executions**: +$5/month
- **Total**: ~$25/month
- **Includes**: 50GB bandwidth, unlimited functions, priority support

### Render Free Tier (Legacy): Free
- **Limitation**: Cold starts after 15 min inactivity
- **Suitable for**: Development/testing only

---

## Deployment Checklist

- [ ] GitHub repo created and pushed
- [ ] Vercel project created
- [ ] Environment variables configured
- [ ] Frontend builds successfully
- [ ] Backend builds and typecheck passes
- [ ] Agents endpoints return 200 OK
- [ ] JIRA integration tested
- [ ] Storage service connected
- [ ] Slack/Teams webhooks working
- [ ] Health check passes
- [ ] Load test completed
- [ ] Team access configured
- [ ] Monitoring enabled

---

## Next Steps

1. **Deploy to Vercel**: Follow "RECOMMENDED" section above
2. **Configure Integrations**: Set JIRA, storage, webhooks
3. **Run Test Suite**: Execute all agents end-to-end
4. **Setup Monitoring**: Enable Vercel Analytics
5. **Document**: Update team wiki with agent endpoints

---

**Deployment Support**

- Vercel Docs: https://vercel.com/docs
- Server code: `server/src/index.ts`
- UI code: `ui/src/App.tsx`
- Agent specs: `agents/*.md`

For issues, check agent logs in Vercel Dashboard.


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
