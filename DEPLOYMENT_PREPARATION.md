# Deployment preparation

This repository is prepared for a hosted API, but it is **not deploy-ready until the actual frontend and API origins are confirmed**.

## Frontend API URL

- Local development on `localhost` or `127.0.0.1` defaults to `http://localhost:4000`.
- Hosted environments intentionally have no implicit API URL. The `index.html` and `game.html` pages now expose `<meta name="iwar-api-base-url" content="">`; once the backend URL is known, set that value to the confirmed HTTPS API origin on both pages. `api/config.js` reads this metadata while preserving the local-only localhost default.
- Do not commit secrets or invent a production URL.
- `index.html` has a Content Security Policy. Once the actual API hostname is confirmed, add that exact HTTPS origin to `connect-src`; do not use a broad wildcard.

## Backend environment

Required for a hosted instance:
- `NODE_ENV=production`
- `PORT` (provided by the host)
- `FIREBASE_PROJECT_ID`: exact Firebase project ID; required in production for server-side ID-token verification
- `CORS_ORIGINS`: comma-separated, exact frontend origins, including scheme and port where applicable
- `DATA_DRIVER=mysql`
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`
- Strong, unique `JWT_SECRET` and `RECEIPT_SECRET` values, configured in the hosting dashboard rather than committed to Git

## Authentication security

The legacy and v1 login routes now verify non-guest Firebase ID tokens against Google Secure Token signing certificates, including signature, issuer, audience/project, subject, and time claims. User ID, provider, email, and display name are derived from verified claims rather than trusted client fields. Production requires `FIREBASE_PROJECT_ID`. Production guest identities are generated server-side; client-supplied guest IDs are retained only for development/test compatibility. Firebase configuration and the real project ID must be confirmed before login can be validated. Do not deploy until the security tests and full CI pass.

The API currently supports MySQL via `mysql2`. The JSON-file driver is suitable for local development only on hosts with ephemeral filesystems; it must not be used for persistent hosted gameplay. In production, startup now fails if MySQL cannot initialize, and reads/writes refuse to fall back to a local JSON file. Configure `MYSQL_SSL=true` when the database provider requires TLS.

## Frontend hosting boundary

The current browser client files (`index.html`, `game.html`, JavaScript, CSS, and assets) are stored at the repository root alongside backend code and internal project files. Do **not** publish the repository root as a static site (`staticPublishPath: .`): that risks exposing backend source and development artifacts as public web files. Before adding a static-site service, move or copy only the required browser assets into a dedicated public directory, update and test relative paths, and verify the published file manifest contains no backend code, tests, environment examples, or internal docs. This isolation is intentionally not done in the deployment-preparation branch because it is a separate, potentially breaking packaging change.

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


## Free database provider decision

Do not create a database until the existing Aiven account inventory is confirmed. Aiven's current free MySQL tier allows only one free service of each service type per organization, with 1 CPU, 1 GB RAM, 1 GB disk, up to 76 connections, and possible power-off after prolonged inactivity. The account inventory tool could not be queried during this preparation, so availability is unknown. Never reuse the EventosRP database for this game.

If the existing Aiven free MySQL service is already allocated, TiDB Cloud Starter is a candidate to evaluate because it supports the MySQL protocol and its free quota currently includes 5 GiB row storage and 50 million request units per month for eligible instances. Reaching the free quota can block new connections until quota reset. Before choosing TiDB, run the backend integration and schema-migration tests against a real TiDB instance; MySQL protocol compatibility alone does not prove every SQL feature used by this repository will behave identically.

Provider references:
- Aiven free MySQL tier: https://aiven.io/docs/products/mysql/concepts/mysql-free-tier
- TiDB Cloud Starter tier and quotas: https://docs.pingcap.com/tidbcloud/select-cluster-tier/
