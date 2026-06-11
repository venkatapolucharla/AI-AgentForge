# Agent 01: Blueprint Architect

## Purpose
Transform product vision into structured, actionable blueprints. Extracts features, requirements, and acceptance criteria from Product Requirements Documents with architectural precision.

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
      "AC2: Password must be at least 8 characters"
    ]
  }
}
```

## Success Metrics
- 100% of PRD sections parsed
- All acceptance criteria captured
- Dependencies correctly mapped
