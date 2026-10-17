---
name: enigma-security-audit
description: Audit Guerra Infinita for authentication, authorization, player-to-player data isolation, secrets exposure, unsafe client authority, and API security regressions. Use before accepting backend, auth, database, or deployment-related changes.
---

# Enigma Security Audit Skill

## Goal
Find exploitable trust-boundary failures and produce reproducible, non-destructive evidence.

## Procedure
1. Map entry points, authentication middleware, identity claims, authorization checks, repository access, and sensitive player-owned resources.
2. Verify that the authenticated server-side identity determines player ownership. Do not trust a client-supplied player ID or ownership field without authorization checks.
3. Inspect read, create, update, delete, rewards, purchases, resource changes, expeditions, heroes, buildings, and inventory paths for cross-player access and client-authoritative state.
4. Test unauthenticated, invalid, expired, wrong-audience, and wrong-project tokens where the test setup permits. Never use real user tokens.
5. Review input validation, error leakage, CORS assumptions, rate limiting/idempotency, secret handling, dependency risk, and Supabase RLS/service-role boundaries when applicable.
6. Add or recommend tests using two synthetic players and verify that each cannot read or mutate the other's state. Include negative and positive cases.
7. Classify findings as Critical/High/Medium/Low/Informational and include evidence, attack preconditions, impact, and a minimal mitigation.

## Constraints
- Only use synthetic/test identities and local or disposable test infrastructure.
- Do not exploit live services, enumerate real users, exfiltrate data, or modify production permissions.
- Never print tokens, private keys, secrets, or personal data.
- Do not claim the system is secure based on a narrow test suite; state scope and residual risk.

## Acceptance criteria
Findings must be reproducible and tied to a concrete trust boundary. Recommendations must preserve legitimate gameplay and include regression tests.
