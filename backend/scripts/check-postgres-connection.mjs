import pg from "pg";
import { createPostgresTlsOptions } from "../src/config/postgresTls.js";

const connectionString = process.env.GAME_SUPABASE_DATABASE_URL;
if (!connectionString) {
    console.error("PG_CONNECTION_CHECK_FAILED: GAME_SUPABASE_DATABASE_URL is missing; no connection was attempted.");
    process.exit(1);
}

let parsed;
try {
    parsed = new URL(connectionString);
} catch {
    console.error("PG_CONNECTION_CHECK_FAILED: configured value is not a valid URL.");
    process.exit(1);
}
if (!["postgres:", "postgresql:"].includes(parsed.protocol) || !parsed.hostname) {
    console.error("PG_CONNECTION_CHECK_FAILED: configured value is not a PostgreSQL URL.");
    process.exit(1);
}

let ssl;
try {
    ssl = createPostgresTlsOptions(process.env.GAME_SUPABASE_CA_CERT);
} catch (error) {
    console.error("PG_CONNECTION_CHECK_FAILED: CA certificate validation failed (" + String(error.message).slice(0, 140) + ").");
    process.exit(1);
}

// pg prioritizes SSL parameters in the URI over the explicit SSL object; remove
// them so the configured CA and certificate validation cannot be bypassed.
for (const key of ["sslmode", "ssl", "sslcert", "sslkey", "sslrootcert"]) parsed.searchParams.delete(key);
const pool = new pg.Pool({
    connectionString: parsed.toString(),
    ssl,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 5000,
    max: 1,
    application_name: "iwar-readonly-connection-check"
});

try {
    const result = await pool.query("SELECT 1 AS ok");
    if (result.rows[0]?.ok !== 1) {
        console.error("PG_CONNECTION_CHECK_FAILED: read-only validation query returned an unexpected result.");
        process.exitCode = 1;
    } else {
        console.log("PG_CONNECTION_OK: TLS certificate validation and read-only PostgreSQL query passed.");
    }
} catch (error) {
    const code = String(error?.code || "UNKNOWN").replace(/[^A-Za-z0-9_]/g, "").slice(0, 32);
    console.error("PG_CONNECTION_CHECK_FAILED: connection/query failed (code=" + code + "). Details withheld.");
    process.exitCode = 1;
} finally {
    await pool.end().catch(() => {});
}
