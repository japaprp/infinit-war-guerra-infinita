# Deployment preparation

This repository has a staged browser-only package and a hosted API blueprint, but it is **not deploy-ready until the frontend origin and production database configuration are confirmed**.

## Frontend API URL

- Local development on `localhost` or `127.0.0.1` defaults to `http://localhost:4000`.
- The Render account confirms the API origin `https://infinit-war-api.onrender.com`; both pages use it in `iwar-api-base-url` and their `connect-src` policy. `api/config.js` rejects insecure hosted endpoints, paths, and remote localhost fallbacks while preserving `http://localhost:4000` only for local development. The API is not currently booting because required Render environment variables are missing; do not treat the URL alone as proof of availability.
- Do not commit secrets or invent a production URL.
- Both source pages and staged copies include the exact API hostname in `connect-src`, alongside localhost for development. Do not add broad wildcards for the API.

## Public frontend package

The static-site publish root must be `frontend/public/` only, never the repository root. This folder contains a deliberately narrow allowlist of browser HTML, CSS, and JavaScript files. `tests/public-frontend-package.test.mjs` enforces the exact allowlist, checks staged files match the source files, and validates local HTML dependencies.

The package is **staged, not yet approved for publication**. Keep the static site undeployed until the new test passes and all workflows finish successfully. Do not add backend source, tests, environment examples, scripts, Electron files, or internal documentation to `frontend/public/`.

## Static frontend Blueprint

A separate `render-frontend.yaml` template defines the static site `infinit-war-web` and sets `staticPublishPath: ./frontend/public`. It is deliberately separate from the API Blueprint so preparing the frontend cannot change the existing API's database configuration. The template has **not** been applied and no Render service has been created. Do not apply it until the integration branch is reviewed and publication is explicitly authorized.

Render documents static sites as `type: web` with `runtime: static`, served from a configured publish path. See the [Render Blueprint specification](https://render.com/docs/blueprint-spec).

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

No new hosting service, database, DNS record, or production secret was created. The existing API service is configured, but its latest deploy fails because `MYSQL_PASSWORD` and `CORS_ORIGINS` are missing. The public frontend origin remains unknown, and PR #14's expedition routes must be reviewed and integrated before the production branch can serve those routes. PRs for packaging and deployment remain drafts until checks and review complete.

## Free database provider decision

Do not create a database until the existing Aiven account inventory is confirmed. Aiven's current free MySQL tier allows only one free service of each service type per organization, with 1 CPU, 1 GB RAM, 1 GB disk, up to 76 connections, and possible power-off after prolonged inactivity. The account inventory tool could not be queried during this preparation, so availability is unknown. Never reuse the EventosRP database for this game.

If the existing Aiven free MySQL service is already allocated, TiDB Cloud Starter is a candidate to evaluate because it supports the MySQL protocol and its free quota currently includes 5 GiB row storage and 50 million request units per month for eligible instances. Reaching the free quota can block new connections until quota reset. Before choosing TiDB, run the backend integration and schema-migration tests against a real TiDB instance; MySQL protocol compatibility alone does not prove every SQL feature used by this repository will behave identically.

Provider references:
- Aiven free MySQL tier: https://aiven.io/docs/products/mysql/concepts/mysql-free-tier
- TiDB Cloud Starter tier and quotas: https://docs.pingcap.com/tidbcloud/select-cluster-tier/
