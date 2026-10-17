---
name: enigma-test-design
description: Design, run, and report regression and integration tests for Guerra Infinita's Node.js backend, PostgreSQL persistence, authentication, and player isolation. Use to verify a fix or investigate a defect.
---

# Enigma Test Design Skill

## Goal
Turn requirements and bug reports into focused, repeatable tests with clear evidence.

## Procedure
1. Identify expected behavior, current failure, affected layer, and available test commands from the actual package scripts and CI workflows.
2. Choose the narrowest useful test first, then relevant integration tests, then the full available suite if safe and practical.
3. Prefer deterministic tests, isolated temporary directories/databases, synthetic users, fixed inputs, and explicit cleanup.
4. Cover success, invalid input, unauthorized access, boundary conditions, failure/rollback, retries/idempotency, and concurrent requests where relevant.
5. For PostgreSQL changes, verify schema initialization, parameterized operations, JSONB round trips, transaction rollback, and cross-player isolation as applicable.
6. Record the exact command, exit status, important assertion/output, environment limitations, and commit/branch tested. Do not paste secrets into logs or reports.
7. Separate passed, failed, skipped, not-run, and inconclusive checks. A test not run is not a pass.

## Constraints
- Never point destructive tests at a production or shared database.
- Do not weaken or delete a test just to make CI pass; document why a test is invalid before proposing replacement.
- Do not change application code during a test-only assignment unless explicitly authorized.
- Avoid unnecessary dependency installation or broad test runs that could consume significant resources without approval.

## Acceptance criteria
Every reported pass maps to a real command and observed result. Failures include enough sanitized context to reproduce them.
