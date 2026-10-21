import { Pool } from "pg";

const connectionString = process.env.GAME_SUPABASE_DATABASE_URL;
if (!connectionString) {
    console.error("PG_CONNECTION_CHECK_FAILED: required repository secret GAME_SUPABASE_DATABASE_URL is missing.");
    process.exit(1);
}

let parsed;
try {
    parsed = new URL(connectionString);
} catch {
    console.error("PG_CONNECTION_CHECK_FAILED: configured secret is not a valid URL.");
    process.exit(1);
}

if (!["postgres:", "postgresql:"].includes(parsed.protocol) || !parsed.hostname) {
    console.error("PG_CONNECTION_CHECK_FAILED: configured secret is not a PostgreSQL URL.");
    process.exit(1);
}

// Trust only the CA explicitly supplied for this database. Do not disable TLS
// verification as a workaround for SELF_SIGNED_CERT_IN_CHAIN.
const caCertificate = process.env.GAME_SUPABASE_CA_CERT?.replace(/\\n/g, "\n").trim();
if (!caCertificate) {
    console.error("PG_CONNECTION_CHECK_FAILED: required repository secret GAME_SUPABASE_CA_CERT is missing.");
    process.exit(1);
}

if (!caCertificate.includes("-----BEGIN CERTIFICATE-----") ||
    !caCertificate.includes("-----END CERTIFICATE-----")) {
    console.error("PG_CONNECTION_CHECK_FAILED: GAME_SUPABASE_CA_CERT is not a PEM certificate.");
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { ca: caCertificate, rejectUnauthorized: true },
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
        console.log("PG_CONNECTION_OK: verified TLS connection and read-only schema check passed.");
    }
} catch (error) {
    const code = String(error?.code || "UNKNOWN").replace(/[^A-Za-z0-9_]/g, "").slice(0, 32);
    console.error(`PG_CONNECTION_CHECK_FAILED: database connection/query failed (code=${code}). Details withheld.`);
    process.exitCode = 1;
} finally {
    await pool.end().catch(() => {});
}
