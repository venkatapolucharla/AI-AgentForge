# Agent 01: PRD Analyser

## Purpose
Extract features, acceptance criteria, dependencies, and risk levels from Product Requirements Documents.

## Input
- PRD document (Word, PDF, or Markdown)

## Process
1. Parse document structure (headings, sections, bullet points)
2. Extract features with unique IDs (F-001, F-002, etc.)
3. Map acceptance criteria per feature
4. Identify feature dependencies
5. Classify risk level (High/Medium/Low)

## Output Format
```json
{
  "features": [
    {
      "id": "F-001",
      "name": "User Authentication",
      "description": "...",
      "riskLevel": "High",
      "dependencies": ["F-002"]
    }
  ],
  "acceptanceCriteria": {
    "F-001": [
      "AC1: User can login with email and password",
      "AC2: User receives email verification link"
    ]
  },
  "riskMatrix": {
    "High": 2,
    "Medium": 3,
    "Low": 5
  }
}
```

## Downstream Consumers
- JIRA Story Creator (uses feature list + criteria)
- Test Case Generator (uses acceptance criteria)

## Notes
- Detect numeric constraints for boundary value analysis
- Extract field validation rules
- Identify data format requirements