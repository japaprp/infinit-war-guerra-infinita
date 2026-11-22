---
name: api-contracts
description: Design, implement, document, or review REST, GraphQL, gRPC, webhooks, API schemas, DTOs, error contracts, versioning, and client/server compatibility.
---

# API contracts skill

## Inspect first
- Identify the actual runtime, framework, API entry points, DTO/schema validation, error format, auth middleware, tests, OpenAPI/protobuf files, and dependency versions.
- Treat existing contracts and consumers as source of truth. Do not add a new API framework just to follow this skill.

## Design and implementation
- Define method, path, request/response schema, status codes, validation, auth requirements, pagination/filtering, rate limits, and idempotency where relevant.
- Validate input at the trust boundary; reject unknown/invalid values according to existing conventions.
- Use stable error shapes without stack traces, tokens, secrets, or unnecessary internal details.
- Preserve backward compatibility where possible. If breaking changes are required, identify affected consumers and migration steps first.
- Keep business rules in the correct service/domain layer; controllers should not become a second source of truth.
- Make retries safe for mutation endpoints where appropriate; avoid duplicate side effects.
- Keep OpenAPI, protobuf, runtime implementation, and tests aligned. Never document behavior that code does not implement.
- Use timeouts and bounded retries for external APIs; never retry non-idempotent operations blindly.

## Security and tests
- Check authentication and authorization separately.
- Test success, malformed input, boundary values, missing/invalid credentials, forbidden access, not-found behavior, and duplicate/retried requests as applicable.
- Avoid logging request bodies or headers that may contain sensitive information.
- Run existing lint, type-check, schema validation, and focused tests when available.

## Report
Summarize contract changes, compatibility impact, security considerations, and exact validation performed.
