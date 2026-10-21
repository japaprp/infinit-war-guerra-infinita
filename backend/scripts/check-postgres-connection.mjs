import { Pool } from "pg";

const connectionString = process.env.GAME_SUPABASE_DATABASE_URL;
const caCertificate = process.env.GAME_SUPABASE_CA_CERT;

if (!connectionString) {
    console.error("PG_CONNECTION_CHECK_FAILED: required repository secret GAME_SUPABASE_DATABASE_URL is not configured; no connection values are printed.");
    process.exit(1);
}
if (!caCertificate?.includes("-----BEGIN CERTIFICATE-----")) {
    console.error("PG_CONNECTION_CHECK_FAILED: required repository secret GAME_SUPABASE_CA_CERT must contain the Supabase root CA PEM certificate; no connection values are printed.");
    process.exit(1);
}

let parsed;
try {
    parsed = new URL(connectionString);
} catch {
    console.error("PG_CONNECTION_CHECK_FAILED: configured database secret is not a valid URL.");
    process.exit(1);
}

if (!["postgres:", "postgresql:"].includes(parsed.protocol) || !parsed.hostname) {
    console.error("PG_CONNECTION_CHECK_FAILED: configured secret is not a PostgreSQL URL.");
    process.exit(1);
}

// pg's connection-string SSL options can override the explicit SSL object.
// Keep the URL credentials/host but force certificate verification through the supplied CA.
for (const option of ["sslmode", "ssl", "sslrootcert", "sslcert", "sslkey"]) {
    parsed.searchParams.delete(option);
}

const pool = new Pool({
    connectionString: parsed.toString(),
    ssl: { rejectUnauthorized: true, ca: caCertificate },
    connectionTimeoutMillis: 8000,
    max: 1,
    application_name: "iwar-readonly-connection-check"
});

try {
    const { rows } = await pool.query("SELECT 1 AS ok, to_regclass('public.app_state') IS NOT NULL AS app_state_present");
    if (rows[0]?.ok !== 1 || rows[0]?.app_state_present !== true) {
        console.error("PG_CONNECTION_FAILED: connected, but expected schema check did not pass.");
        process.exitCode = 1;
    } else {
        console.log("PG_CONNECTION_OK: TLS connection and read-only schema check passed.");
    }
} catch (error) {
    const code = String(error?.code || "UNKNOWN").replace(/[^A-Za-z0-9_]/g, "").slice(0, 32);
    console.error(`PG_CONNECTION_CHECK_FAILED: database connection/query failed (code=${code}). Details withheld.`);
    process.exitCode = 1;
} finally {
    await pool.end().catch(() => {});
}
