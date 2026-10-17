---
name: enigma-independent-review
description: Independently review a proposed Guerra Infinita code diff, tests, and research findings without editing files. Use before integration or whenever a change touches auth, persistence, migrations, or player state.
---

# Enigma Independent Review Skill

## Goal
Provide a skeptical, evidence-based review separate from implementation.

## Procedure
1. Read the task acceptance criteria, base commit, full diff, relevant surrounding code, and actual test/CI evidence.
2. Review for correctness, security, data loss, compatibility, API contract changes, duplicated logic, unneeded dependencies, race conditions, and missing rollback paths.
3. Verify whether tests exercise the reported bug and whether they could pass while the bug remains. Check that test output corresponds to the commit being reviewed.
4. Treat implementation notes and other agents' claims as hypotheses until supported by code or test evidence.
5. Do not edit files, push commits, approve/merge PRs, change CI settings, or trigger deployment.
6. Report findings first, ordered by severity, with file/line, concrete failure scenario, impact, and suggested remedy. If no finding is observed, state what was and was not checked.

## Constraints
- Read-only review. Never silently expand scope.
- No live database access or production verification.
- Do not treat a green CI run as proof of deployment health or full correctness.
- Flag changes that alter behavior outside the task's scope.

## Required verdict
Choose one: `REQUEST_CHANGES`, `APPROVE_FOR_HUMAN_REVIEW`, or `INCONCLUSIVE`. Explain the evidence and residual risk. This verdict is advisory and does not authorize merge or deploy.
