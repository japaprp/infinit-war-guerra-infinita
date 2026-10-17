# Copilot repository instructions

Follow `AGENTS.md` as the repository-wide source of truth. Before coding, inspect the relevant source and read applicable `.agents/skills/*/SKILL.md` files. Do not assume the stack, routes, auth model, or design system—derive them from the repository.

For API changes, preserve contracts and error conventions, document schemas, and add tests for success, validation failures, authentication, authorization, and idempotency where applicable.

For routes, preserve existing route conventions and deep links; ensure protected routes have server-side enforcement rather than relying only on client navigation.

For access/security, default to deny, check resource ownership and tenant boundaries server-side, avoid leaking whether private resources exist, and never expose secrets or sensitive data in logs.

For design, reuse existing components/tokens, support mobile and keyboard/screen-reader use, maintain visible focus and semantic structure, and check loading/empty/error/success states.

Do not deploy, merge, change production configuration, or modify unrelated PRs without explicit approval. Run relevant tests and report exact checks and limitations.
