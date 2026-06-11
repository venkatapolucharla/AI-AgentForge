# Agent 02: JIRA Story Creator

## Purpose
Create JIRA stories, epics, and sub-tasks from PRD features and acceptance criteria.

## Confirmation Gate ⚠️
BEFORE executing, present a summary table:

| Epic | Story | Sub-task | Priority |
|------|-------|----------|----------|
| ... | ... | ... | ... |

Then ask: **"Shall I create these X stories in JIRA? (yes/no)"**

Only proceed on explicit **"yes"** response.

## Process (on Confirmation)
1. Group features into epics by business domain
2. Create epic issues with description
3. Create story issues per feature with:
   - Feature ID and name
   - Acceptance criteria as story description
   - Estimated story points
   - Linked to parent epic
4. Create sub-task issues per AC requirement
5. Set priority based on risk level from PRD Analyser

## Output Format
```json
{
  "epics": ["QA-100", "QA-110"],
  "stories": ["QA-101", "QA-102", "QA-103"],
  "subtasks": ["QA-101.1", "QA-101.2", "QA-102.1"],
  "summary": "Created 2 epics, 12 stories, 24 sub-tasks"
}
```

## Integration
- Read from PRD Analyser output
- Call JIRA REST API v3
- Use credentials from config/jira.config.js

## Notes
- Map AC requirements to Definition of Done
- Include acceptance criteria in story description
- Link sub-tasks to parent stories for traceability