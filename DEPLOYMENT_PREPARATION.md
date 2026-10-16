# Deployment preparation

This repository is prepared for a hosted API, but it is **not deploy-ready until the actual frontend and API origins are confirmed**.

## Frontend API URL

- Local development on `localhost` or `127.0.0.1` defaults to `http://localhost:4000`.
- Hosted environments intentionally have no implicit API URL. Configure `window.IWAR_API_BASE_URL` before `api/config.js` loads, or replace the empty hosted default with the confirmed HTTPS API origin in the deployment-specific configuration.
- Do not commit secrets or invent a production URL.
- `index.html` has a Content Security Policy. Once the actual API hostname is confirmed, add that exact HTTPS origin to `connect-src`; do not use a broad wildcard.

## Backend environment

Required for a hosted instance:
- `NODE_ENV=production`
- `PORT` (provided by the host)
- `CORS_ORIGINS`: comma-separated, exact frontend origins, including scheme and port where applicable
- `DATA_DRIVER=mysql`
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`
- Strong, unique `JWT_SECRET` and `RECEIPT_SECRET` values, configured in the hosting dashboard rather than committed to Git

The API currently supports MySQL via `mysql2`. The JSON-file driver is suitable for local development only on hosts with ephemeral filesystems; it must not be used for persistent hosted gameplay. In production, startup now fails if MySQL cannot initialize, and reads/writes refuse to fall back to a local JSON file. Configure `MYSQL_SSL=true` when the database provider requires TLS.

## Render API blueprint

`render.yaml` is a free-plan API service template. It does not create a service by itself. If used later, Render will ask for the database connection values and the exact frontend origin; the API cannot pass production startup validation until these are supplied. The template enables MySQL TLS. Render's free web service may sleep when idle, so the first request can be delayed.

## Health and validation

The backend exposes `GET /health`. After the service is deployed, validate:
1. `GET /health` returns `ok: true` and reports the repository mode.
2. The deployed process reports `repository=mysql`.
3. Frontend login and `GET /v1/expeditions/status` work from the real hosted origin.
4. Start and claim an expedition, retry the same claim idempotency key, then reload and confirm the reward is applied once.
5. Verify disallowed browser origins cannot read API responses.

## Explicit blockers

No hosting service, database, DNS record, production secret, or deployment was created or changed by this preparation. A GitHub Actions workflow was added to run configuration and backend integration tests on relevant pushes and pull requests. The public frontend origin and API URL are still unknown, and PR #14's expedition routes must be reviewed and integrated before the production branch can serve those routes.
