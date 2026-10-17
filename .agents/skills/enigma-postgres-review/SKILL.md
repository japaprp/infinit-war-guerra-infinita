---
name: enigma-postgres-review
description: Review Guerra Infinita's Node.js/PostgreSQL persistence, schema migrations, JSONB snapshots, transaction boundaries, concurrency, and Supabase compatibility. Use for database changes or persistence incidents.
---

# Enigma PostgreSQL Review Skill

## Goal
Identify correctness and data-integrity risks without changing a real database.

## Procedure
1. Read the repository's current migration docs, database repository/adapter, schema, migrations, tests, and relevant workflow files before recommending changes.
2. Trace each write/read path and identify which records are authoritative. Specifically inspect any duplicated representation between normalized tables and `app_state` snapshots.
3. Check transaction boundaries: related writes must commit or roll back together where the domain requires atomicity. Look for race conditions, lost updates, partial writes, retries, and idempotency gaps.
4. Review PostgreSQL parameterization, constraints, indexes, JSONB shape/round-trip behavior, nullability, timestamp/time-zone assumptions, pool lifecycle, and error handling.
5. Check migration repeatability and whether a failed migration leaves the schema in a recoverable state. Do not run a migration against a live or shared database.
6. Propose focused tests for rollback, concurrent writes, duplicate requests, malformed state, and isolation between two players.
7. Report findings by severity with exact file/line evidence, scenario, impact, minimal remedy, and a regression test.

## Constraints
- Never connect to or write to production/Supabase real data during review.
- Do not output connection strings or secret values; mention variable names only.
- Do not assume that a passing schema smoke test proves transaction safety or production readiness.
- Do not change schema, dependency versions, or application code unless the task explicitly authorizes implementation on an isolated branch.

## Acceptance criteria
A useful review distinguishes confirmed defects from plausible risks, identifies data-integrity implications, and names tests that would prove the fix.
