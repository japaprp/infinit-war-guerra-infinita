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
    application_name: "iwar-postgres-validation"
});

try {
    const { rows } = await pool.query("SELECT 1 AS ok, to_regclass('public.app_state') IS NOT NULL AS app_state_present");
    if (rows[0]?.ok !== 1 || rows[0]?.app_state_present !== true) {
        throw Object.assign(new Error("expected schema check did not pass"), { code: "SCHEMA_CHECK_FAILED" });
    }

    // Exercise a real PostgreSQL transaction without writing to persistent
    // game tables. preserves the temporary table for committed read-back; the script drops it explicitly.
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(
            "CREATE TEMP TABLE iwar_connection_probe (id integer PRIMARY KEY, revision integer NOT NULL, payload jsonb NOT NULL) ON COMMIT PRESERVE ROWS"
        );
        await client.query(
            "INSERT INTO iwar_connection_probe (id, revision, payload) VALUES ($1, $2, $3::jsonb)",
            [1, 1, JSON.stringify({ stage: "insert" })]
        );
        const update = await client.query(
            "UPDATE iwar_connection_probe SET revision = revision + 1, payload = $3::jsonb WHERE id = $1 AND revision = $2 RETURNING revision",
            [1, 1, JSON.stringify({ stage: "update" })]
        );
        const staleUpdate = await client.query(
            "UPDATE iwar_connection_probe SET revision = revision + 1 WHERE id = $1 AND revision = $2 RETURNING id",
            [1, 1]
        );
        if (update.rowCount !== 1 || staleUpdate.rowCount !== 0) {
            throw Object.assign(new Error("temporary PostgreSQL write or stale-revision guard failed"), { code: "PERSISTENCE_PROBE_FAILED" });
        }

        await client.query("COMMIT");
        const probe = await client.query(
            "SELECT revision, payload->>'stage' AS stage FROM pg_temp.iwar_connection_probe WHERE id = $1",
            [1]
        );
        if (probe.rows[0]?.revision !== 2 || probe.rows[0]?.stage !== "update") {
            throw Object.assign(new Error("committed temporary record did not match the read-back value"), { code: "PERSISTENCE_READBACK_FAILED" });
        }

        await client.query("DROP TABLE pg_temp.iwar_connection_probe");
        const cleanup = await client.query(
            "SELECT to_regclass('pg_temp.iwar_connection_probe') IS NULL AS temp_table_dropped"
        );
        if (cleanup.rows[0]?.temp_table_dropped !== true) {
            throw Object.assign(new Error("temporary persistence probe did not clean up"), { code: "PERSISTENCE_CLEANUP_FAILED" });
        }
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
    } finally {
        client.release();
    }

    console.log("PG_CONNECTION_OK: verified TLS connection and read-only schema check passed.");
    console.log("PG_PERSISTENCE_PROBE_OK: temporary transaction insert/update, committed read-back, stale-revision guard, and cleanup passed.");
} catch (error) {
    const code = String(error?.code || "UNKNOWN").replace(/[^A-Za-z0-9_]/g, "").slice(0, 32);
    console.error(`PG_CONNECTION_CHECK_FAILED: database connection or temporary persistence check failed (code=${code}). Details withheld.`);
    process.exitCode = 1;
} finally {
    await pool.end().catch(() => {});
}

