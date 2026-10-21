# Deployment preparation — validation only

This branch is an isolated integration and test branch. It is **not approved for merge or deployment**. The original authentication branch remains unchanged, the existing Render API service remains on `fix/firebase-id-token-validation`, and no Render configuration or Supabase schema/data was changed during this stage.

## Current validation status

- Backend configuration/deployment tests: passed.
- Backend integration tests: passed, including authentication, map hunts, alliance rallies, chest idempotency, vehicle loadouts, and lock release after client disconnect.
- Public frontend package and real-browser persistence/backend-recovery workflow: passed.
- Static contract scan: 34 frontend API request definitions checked, with no unmatched method/path pairs in the integrated backend.
- Real Node.js `pg` pool connection to Supabase: **not yet verified**. A read-only SQL query through the Supabase connector succeeded, but that does not prove the deployed API's connection URL, credentials, TLS settings, or driver configuration work.

## Frontend API URL and CORS

- Local development on `localhost` or `127.0.0.1` defaults to `http://localhost:4000`.
- The known API service origin is `https://infinit-war-api.onrender.com`. The root pages and staged public copies use that exact origin in `iwar-api-base-url` and their `connect-src` policy.
- The API origin is not the frontend origin. The public frontend has not been published, so its final origin is still unknown. Do not configure production `CORS_ORIGINS` until the actual frontend origin is confirmed.
- `api/config.js` rejects insecure hosted endpoints, URL paths, and remote localhost fallbacks while preserving localhost HTTP only for local development.
- Do not commit secrets or invent a production URL.

## Public frontend package

The static-site publish root must be `frontend/public/` only, never the repository root. The allowlist and source-parity test verifies the public HTML, CSS, and JavaScript files, plus their local dependencies.

The static site template in `render-frontend.yaml` has **not** been applied and no frontend service has been created. Do not apply it until the integration branch is reviewed and publication is explicitly authorized.

## PostgreSQL / Supabase status

The dedicated Supabase project `guerra-infinita-db` (region `sa-east-1`, ref `gfjquedlehkxonjwaoec`) is active and healthy. The read-only database check confirmed:

- Migration `initial_game_schema` is registered.
- The eight expected tables (`app_state`, `users`, `heroes`, `buildings`, `inventory`, `receipts`, `alliances`, `battles`) exist and currently contain zero rows.
- Row-level security is enabled on those tables. The current policy query returned no explicit policies, so access must remain server-side through a trusted database role; never expose database credentials or use the browser to connect directly.

The isolated integration branch supports `DATA_DRIVER=postgres` with `DATABASE_URL`. The schema is already present, but the application has not yet completed a real Node.js `pg` pool connection or a write/read/restart test against this project. Do not treat the successful connector `SELECT 1` as proof that the API's private connection works.

A manual, read-only Node.js connection workflow is available at `.github/workflows/postgres-connection-check.yml`. It reads the repository secret `GAME_SUPABASE_DATABASE_URL`, runs `SELECT 1` plus a schema-presence check, and never prints the URL or connection error details. If the secret is absent or malformed, the check exits with failure; it does not report a successful skip. To run it, add the database URL directly in GitHub **Settings → Secrets and variables → Actions** under that secret name, then open **Actions → PostgreSQL connection check → Run workflow** and select `integration/postgres-auth-isolated`. Do not paste the URL into chat or commit it.

## Render environment

The existing Render API service has not been modified. The last previously observed deployment issue involved `MYSQL_PASSWORD` and `CORS_ORIGINS`; that earlier status was not revalidated during this stage. The available read-only Render connector does not expose environment-variable names, so this branch has not confirmed the current variable inventory and has not read or printed any values.

The currently configured production branch still follows the existing MySQL deployment path. For that branch, the required settings include `DATA_DRIVER=mysql`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `FIREBASE_PROJECT_ID`, `JWT_SECRET`, `RECEIPT_SECRET`, and exact `CORS_ORIGINS`. The isolated PostgreSQL path instead requires `DATA_DRIVER=postgres` and `DATABASE_URL`, plus the same authentication secrets and exact CORS origins. These are expected variable names, not confirmation that they are currently configured.

## Deployment boundaries

- Do not merge PR #31 until the real Node.js-to-PostgreSQL connection and persistence checks are complete.
- Do not deploy the static frontend or change the Render service's branch, environment, or build settings.
- Do not apply additional migrations or create services as part of this validation step.
- Keep `Perifa-Pro` and `EventosRP` separate; their databases and configuration must not be reused for this game.

## Remaining blockers before publication

1. Configure `GAME_SUPABASE_DATABASE_URL` securely and run the manual read-only Node.js connection workflow.
2. Decide on an explicitly authorized, non-persistent strategy for PostgreSQL write/read/restart and concurrent-write tests; do not write to the live game tables during this validation stage.
3. Confirm the final hosted frontend origin and inspect Render variable names without exposing values.
4. Re-run the full checks on the final candidate commit and present the results before requesting publication authorization.
