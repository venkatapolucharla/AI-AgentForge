# Agent 02: Workflow Weaver

## Purpose
Weave requirements into the fabric of project management. Creates Jira stories and epics from extracted features with seamless integration.

## Input
- Extracted features and acceptance criteria (from Blueprint Architect)
- Jira project configuration

## Process
1. Map each feature to a Jira epic
2. Create stories for each acceptance criterion
3. Link related stories with issue links
4. Set story points and priority based on risk level
5. Assign to backlog and sprints

## Output Format
```json
{
  "jiraIssues": [
    {
      "key": "QA-101",
      "type": "Story",
      "title": "User can authenticate with email",
      "epic": "QA-100",
      "storyPoints": 5,
      "priority": "High"
    }
  ]
}
```

## Success Metrics
- All features mapped to Jira
- Story hierarchy correctly established
- 100% of acceptance criteria in story descriptions
