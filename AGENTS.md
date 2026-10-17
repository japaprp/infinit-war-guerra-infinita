# Repository-wide agent rules

## Work protocol
1. Inspect the repository's existing instructions, architecture, dependencies, and relevant skills before planning or editing. Read every applicable `SKILL.md`; do not invent skill contents or claim a skill was followed if it was not read.
2. Identify the actual stack and conventions from code/configuration. Do not impose a new framework or duplicate an existing implementation without evidence.
3. Before editing, state the intended scope and affected files in the work summary. Prefer the smallest coherent change and preserve established structure.
4. Keep projects, environments, credentials, and data isolated. Never copy secrets between projects, print secret values, or weaken authentication to make a test pass.
5. Do not run destructive migrations, alter DNS/hosting/secrets, deploy, merge, or modify production resources without explicit authorization.
6. Never edit unrelated pull requests or branches. Keep this agent setup isolated from existing feature work.
7. For security-sensitive behavior, default to deny, validate on the server, and test both allowed and denied cases.
8. Validate with existing scripts and tests where available. If a check cannot be run, say exactly what was and was not verified. Do not claim success without evidence.
9. Review the diff for regressions, duplicated files, accidental generated output, secrets, and scope creep before finishing.

## Specialist routing
- API contracts, schemas, versioning, errors, idempotency, OpenAPI: use the API contract skill and API Architect agent.
- URL paths, navigation, controllers, route guards, deep links, route naming: use the routing skill and Route Architect agent.
- Authentication, authorization, permissions, ownership, tenant isolation, data exposure: use the access-control skill and Security & Access agent.
- UI consistency, responsive behavior, usability, accessibility, visual tokens: use the design-accessibility skill and Design Systems agent.
- Cross-cutting tasks must load every relevant skill, reconcile conflicts, and report any unresolved conflict before implementing.

## Mandatory skill discipline
Before implementation, discover and read applicable repository/personal skills available to the current tool. Prefer existing skills over creating duplicates. If a skill is unavailable in the current environment, use the repository's `.agents/skills/` copy where supported and disclose platform limitations. Skills are guidance, not permission to bypass tests, security, or user approvals.
