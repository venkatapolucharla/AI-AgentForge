# Vercel Deployment Guide — 8-Agent QA Orchestration Platform

## Overview
This guide covers deploying the 8-agent QA Orchestration Platform to Vercel with serverless functions for each agent.

## Architecture

### Deployment Model
```
Vercel (Edge + Serverless Functions)
├── Frontend (React/Vite) → ui/dist/
├── Backend (Express) → api/agents/
├── Agent Functions (Serverless) → api/agents/
└── Database/Storage → External (MongoDB, S3, etc.)
```

### 8 Agents as Serverless Functions
Each agent runs as an autonomous serverless function:
1. **PRD Analyser** → `api/agents/01-prd-analyser.ts`
2. **JIRA Story Creator** → `api/agents/02-jira-story-creator.ts`
3. **Test Case Generator** → `api/agents/03-test-case-generator.ts`
4. **Test Executor** → `api/agents/04-test-executor.ts`
5. **Defect Analyser** → `api/agents/05-defect-analyser.ts`
6. **Automation Developer** → `api/agents/06-automation-developer.ts`
7. **Code Reviewer** → `api/agents/07-code-reviewer.ts`
8. **QA Chatbot** → `api/agents/08-qa-chatbot.ts`

## Prerequisites

### Required Accounts
- ✅ Vercel account (free tier sufficient for most uses)
- ✅ GitHub repository with this code
- ✅ JIRA API token (for Agent 02)
- ✅ Playwright/testing infrastructure credentials
- ✅ Storage service (S3, Google Cloud Storage, or Vercel Blob)

### Local Setup
```bash
# Install Vercel CLI
npm install -g vercel

# Install dependencies
npm install --prefix server
npm install --prefix ui

# Test locally
npm run dev --prefix server &
npm run dev --prefix ui
```

## Step 1: Connect GitHub Repository

```bash
# Login to Vercel
vercel login

# Deploy from root directory
vercel
```

Or use the Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Select your GitHub repository
4. Vercel auto-detects monorepo structure

## Step 2: Configure Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

### Server Environment Variables
```
NODE_ENV=production
PORT=3000
VITE_API_URL=https://your-project.vercel.app/api

# JIRA Configuration (Agent 02)
JIRA_API_URL=https://your-instance.atlassian.net
JIRA_API_TOKEN=your-api-token-here
JIRA_PROJECT_KEY=QA

# Test Execution (Agent 04)
TEST_URL=https://staging.app.example.com
TEST_TIMEOUT=30000
WORKERS=4
CAPTURE_VIDEO=true

# Database/Storage
DATABASE_URL=mongodb+srv://...
AWS_S3_BUCKET=qa-orchestration-artifacts
AWS_ACCESS_KEY_ID=your-key-id
AWS_SECRET_ACCESS_KEY=your-secret-key

# Webhook Integrations
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
TEAMS_WEBHOOK_URL=https://outlook.webhook.office.com/...

# Agent Configuration
ENABLE_CONFIRMATION_GATES=true
AGENT_TIMEOUT=300000
AGENT_RETRY_ATTEMPTS=2
```

### UI Environment Variables
```
VITE_API_URL=https://your-project.vercel.app/api
VITE_ENV=production
```

## Step 3: Update package.json Scripts

### Server package.json
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "typecheck": "tsc --noEmit",
    "build": "tsc"
  }
}
```

### UI package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

## Step 4: Configure vercel.json

The provided `vercel.json` includes:
- ✅ Dynamic routing for agents
- ✅ Static file serving for UI
- ✅ Environment variable injection
- ✅ Security headers
- ✅ Cache control policies
- ✅ CORS headers (if needed)

## Step 5: Agent API Routes

### Folder Structure for Agents
```
api/
├── agents/
│   ├── 01-prd-analyser.ts
│   ├── 02-jira-story-creator.ts
│   ├── 03-test-case-generator.ts
│   ├── 04-test-executor.ts
│   ├── 05-defect-analyser.ts
│   ├── 06-automation-developer.ts
│   ├── 07-code-reviewer.ts
│   └── 08-qa-chatbot.ts
├── middleware/
│   ├── auth.ts
│   ├── errorHandler.ts
│   └── logger.ts
└── utils/
    ├── jira.ts
    ├── storage.ts
    └── notifications.ts
```

### Example Agent Route (Agent 01: PRD Analyser)
```typescript
// api/agents/01-prd-analyser.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileAsync } from '../utils/storage';
import { logEvent } from '../middleware/logger';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    logEvent('PRD_ANALYSER_START', req.body);
    
    const { prdPath } = req.body;
    const prdContent = await readFileAsync(prdPath);
    
    // Extract features, criteria, dependencies
    const analysis = {
      features: [],
      acceptanceCriteria: {},
      dependencies: [],
      riskMatrix: {}
    };
    
    // ... analysis logic ...
    
    logEvent('PRD_ANALYSER_COMPLETE', analysis);
    return res.status(200).json({
      status: 'success',
      data: analysis
    });
  } catch (error) {
    logEvent('PRD_ANALYSER_ERROR', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
```

## Step 6: Build and Deploy

### Deploy via CLI
```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

### Deploy via GitHub (Recommended)
1. Push to GitHub `main` branch
2. Vercel automatically builds and deploys
3. Get preview URL on each PR
4. Automatic production deploy on merge

## Step 7: Monitor Deployment

### Vercel Dashboard
- Go to https://vercel.com/dashboard
- Select your project
- View build logs
- Monitor function execution times
- Check error rates

### Real-time Logs
```bash
vercel logs --follow
```

## Step 8: Test Agent Endpoints

### Test PRD Analyser
```bash
curl -X POST https://your-project.vercel.app/api/agents/01-prd-analyser \
  -H "Content-Type: application/json" \
  -d '{
    "prdPath": "s3://bucket/prd.pdf"
  }'
```

### Test JIRA Story Creator
```bash
curl -X POST https://your-project.vercel.app/api/agents/02-jira-story-creator \
  -H "Content-Type: application/json" \
  -d '{
    "features": [...],
    "acceptanceCriteria": {...}
  }'
```

## Step 9: Setup Webhooks & CI/CD

### GitHub Actions Integration
Create `.github/workflows/test-on-deploy.yml`:
```yaml
name: Run QA Tests on Deploy
on:
  deployment:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: |
          curl -X POST ${{ secrets.VERCEL_API_URL }}/agents/04-test-executor \
            -H "Authorization: Bearer ${{ secrets.AGENT_API_TOKEN }}"
```

### Slack Notifications
Configure webhook in `api/utils/notifications.ts`:
```typescript
export async function notifySlack(message: string) {
  return fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({ text: message })
  });
}
```

## Performance Optimization

### Cold Start Reduction
```json
{
  "functions": {
    "api/agents/*.ts": {
      "maxDuration": 30,
      "memory": 512,
      "regions": ["lhr1", "sfo1"]
    }
  }
}
```

### Caching Strategy
- Static UI assets: `Cache-Control: public, max-age=31536000`
- API responses: `Cache-Control: public, max-age=300` (5 min)
- Agent outputs: No cache (real-time results)

### Database Optimization
- Use connection pooling (PgBouncer for PostgreSQL)
- Cache JIRA queries in memory (5 min TTL)
- Store PRD analysis results for 24 hours

## Security Best Practices

### API Authentication
```typescript
// Middleware to verify requests
export const authenticateRequest = (req: VercelRequest) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || !verifyToken(token)) {
    throw new Error('Unauthorized');
  }
};
```

### Secrets Management
- Never commit `.env` files
- Use Vercel Environment Variables for secrets
- Rotate API tokens regularly
- Use least-privilege for service accounts

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per window
});

app.use('/api/agents', limiter);
```

## Troubleshooting

### Issue: Function Timeout
**Solution**: Increase timeout in `vercel.json` or break into smaller steps

### Issue: Cold Starts
**Solution**: Use Vercel Pro for faster node allocation or pre-warm functions

### Issue: Database Connections Failing
**Solution**: Use connection pooling and increase pool size

### Issue: JIRA API Rate Limit
**Solution**: Implement caching and exponential backoff

## Rollback & Versioning

```bash
# View deployment history
vercel list

# Rollback to previous version
vercel rollback

# Deploy specific version
vercel --target production --commit <SHA>
```

## Monitoring & Analytics

### Setup Application Performance Monitoring
```bash
# Using Vercel Analytics
npm install @vercel/analytics
```

### Custom Metrics
Track:
- Agent execution time
- Success/failure rates
- JIRA API response times
- Test execution duration
- Error logs

## Cost Estimation

### Vercel Pricing
- **Pro Plan**: $20/month + $0.50 per 1M function invocations
- **100K monthly agent executions** ≈ $20-30/month
- **Storage**: Use S3 ($0.023/GB) for artifacts

### Recommended Tier
Start with **Vercel Pro** for:
- ✅ 50GB bandwidth/month
- ✅ Unlimited serverless functions
- ✅ Unlimited deployments
- ✅ Priority support

## Next Steps

1. **Push to GitHub** → Auto-deploys
2. **Configure JIRA/Storage** → Set env vars
3. **Test Agent Endpoints** → Verify API responses
4. **Setup Notifications** → Slack/Teams webhooks
5. **Monitor Performance** → Use Vercel Analytics
6. **Optimize Costs** → Adjust function memory/timeout

## Support & Resources

- Vercel Docs: https://vercel.com/docs
- Vercel CLI: https://vercel.com/cli
- Serverless Functions: https://vercel.com/docs/concepts/functions/serverless-functions
- Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables

## Deployment Checklist

- [ ] GitHub repo connected to Vercel
- [ ] Environment variables configured
- [ ] API routes tested locally
- [ ] JIRA credentials validated
- [ ] Storage service configured (S3/GCS)
- [ ] Webhooks configured (Slack/Teams)
- [ ] GitHub Actions workflow setup
- [ ] Monitoring enabled (Vercel Analytics)
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Database connection pooling configured
- [ ] Backup/rollback strategy documented
- [ ] Team members invited to Vercel project

---

**Deployment Complete!** 🚀

Your 8-agent QA Orchestration Platform is now live on Vercel.
Visit: `https://your-project.vercel.app`
