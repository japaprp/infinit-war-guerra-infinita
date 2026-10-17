---
name: routing-and-navigation
description: Use when designing or changing API routes, frontend navigation, route parameters, controllers, deep links, route guards, redirects, or URL structure.
---

# Routing and navigation skill

## Inspect first
- Identify router/framework, route registration, naming conventions, URL/base-path configuration, middleware, deep links, and existing tests.
- Determine whether the route is a public page, authenticated page, API endpoint, webhook, or internal-only route.

## Rules
- Follow established naming and versioning conventions; do not create duplicate routes for the same resource.
- Prefer resource-oriented, predictable paths and explicit HTTP methods for REST APIs.
- Validate and normalize path/query parameters; encode values safely and handle missing/invalid parameters deliberately.
- Keep route registration thin and delegate domain behavior to existing service/use-case layers.
- Preserve deep links, redirects, trailing-slash behavior, and backward compatibility unless a deliberate migration is documented.
- Route guards improve navigation UX but are not a substitute for server-side authorization.
- Avoid open redirects; allowlist redirect destinations where user-controlled input is involved.
- Define consistent 404/405 behavior and prevent private-resource enumeration where security requires it.

## Tests
- Test route matching, parameter validation, methods, redirects/deep links, authentication, authorization, and not-found behavior.
- Confirm the API docs and frontend links agree with actual routes.
- Run existing route tests and type/lint checks where available.
