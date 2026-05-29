qa-orchestration/
├── CLAUDE.md                    ← orchestrator instructions
├── agents/
│   ├── 01-prd-analyser.md
│   ├── 02-jira-story-creator.md
│   ├── 03-test-plan-creator.md
│   ├── 04-test-case-generator.md
│   ├── 05-smoke-identifier.md
│   ├── 06-regression-builder.md
│   ├── 07-test-executor.md
│   ├── 08-defect-analyser.md
│   ├── 09-defect-creator.md
│   ├── 10-automation-developer.md
│   ├── 11-code-reviewer.md
│   ├── 12-git-commit.md
│   ├── 13-jenkins-trigger.md
│   ├── 14-report-sender.md
│   └── 15-qa-chatbot.md
├── ui/                          ← React frontend
├── prompts/                     ← saved prompts per agent
├── config/
│   ├── jira.config.js
│   ├── jenkins.config.js
│   └── git.config.js
└── tests/                       ← generated Playwright tests land here