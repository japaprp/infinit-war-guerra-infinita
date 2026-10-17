---
name: access-control-security
description: Use for authentication, authorization, role/permission models, resource ownership, sessions, tokens, tenant isolation, CORS, secrets, privacy, and security reviews.
---

# Access control and security skill

## Security model
- Identify the principal, authentication mechanism, roles/permissions, resource owner, trust boundaries, and data classification before changing access behavior.
- Authentication proves identity; authorization decides whether that identity may perform this action on this resource.
- Default to deny. Enforce authorization on the server/API for every protected operation, including reads, mutations, downloads, and background jobs.
- Check resource ownership and tenant/project boundaries in the same query or transaction where practical. Never trust client-supplied user IDs, role names, prices, ownership, or permissions.
- Apply least privilege to service credentials and tool access. Never paste secrets into source, commits, logs, tests, or examples.
- CORS is not authorization. Configure explicit allowed origins/methods/headers for the real deployment needs; do not use wildcard origins with credentials.
- Validate token issuer, audience, signature, expiry, and intended use according to the identity provider's official guidance.
- Use secure session/cookie defaults appropriate to the stack. Avoid storing long-lived secrets in browser storage when a safer established pattern exists.
- Return only the data a caller is authorized to see. Avoid leaking sensitive existence details in errors.
- Avoid weakening protections to make tests pass; use safe test fixtures and isolated environments.

## Validation
- Build an access matrix for roles × actions × resource ownership when relevant.
- Test anonymous, authenticated-but-forbidden, authorized owner, other user's resource, cross-tenant/project access, expired/invalid token, and admin boundaries where applicable.
- Review CORS, CSRF, rate limits, audit logging, and sensitive-data handling where relevant.
- Run dependency/security scans already configured by the repository.

## Safety
Do not alter production IAM, secrets, DNS, hosting, auth provider settings, or live data without explicit user approval. Report unresolved risks plainly.
