# Agent 03: Test Case Generator

## Purpose
Generate comprehensive, deduplicated test cases from PRD features and acceptance criteria.

## Consolidated Functionality
- **Test Case Generation** (from original agent 04)
- **Smoke Test Selection** (from original agent 05)
- **Regression Suite Optimization** (from original agent 06)

## Inputs
- PRD features and acceptance criteria (from PRD Analyser)
- JIRA stories (from JIRA Story Creator)

## Key Rules

### RULE 1: Strict Deduplication
- Compute fingerprint: `feature | scenario | inputClass | condition`
- Each AC produces exactly ONE primary positive test case
- Negative/edge variants per-field, NOT per AC

### RULE 2: Boundary Value Analysis (BVA)
For every numeric constraint in PRD, generate:
- BVA-1: value = (min - 1) → REJECTION
- BVA-2: value = min → ACCEPTANCE
- BVA-3: value = (min + 1) → ACCEPTANCE
- BVA-4: value = max → ACCEPTANCE
- BVA-5: value = (max + 1) → REJECTION

### RULE 3: Field-Level Validation
For text fields with length constraints:
- FL-1 through FL-10: Cover empty, whitespace, min-1, min, min+1, max-1, max, max+1, padding, spaces

For pattern rules (uppercase + special chars, etc.):
- PAT-1 through PAT-6: All rules met, then each rule missing individually

### RULE 4: Error Message Validation
- ERR-1: Trigger exact condition
- ERR-2: Error disappears when corrected
- ERR-3: No error when input valid

### RULE 5: Scenario Completeness
- ✓ Happy path
- ✓ Missing required fields
- ✓ Invalid data types
- ✓ Concurrent/race conditions
- ✓ Session/auth boundaries
- ✓ Pagination/large datasets
- ✓ Permission boundaries

## Output Format
```json
[
  {
    "id": "TC-001",
    "feature": "User Authentication",
    "scenario": "Valid email and password",
    "type": "Positive",
    "priority": "P0-Critical",
    "technique": "HappyPath",
    "precondition": "User not logged in",
    "steps": ["Navigate to login", "Enter email", "Enter password", "Click submit"],
    "testData": {"email": "user@example.com", "password": "SecurePass123!"},
    "expectedResult": "User authenticated and redirected to dashboard",
    "errorMessage": "N/A",
    "acRef": "F-001-AC1"
  }
]
```

## Smoke vs. Regression
- **Smoke Tests**: Critical path features (login, core workflows) — ~10-15 cases
- **Regression Suite**: Full feature coverage — 70+ cases

## Outputs
- Complete test case JSON array
- Smoke test subset tagged
- Regression suite definition
- Coverage report (% of ACs covered)
