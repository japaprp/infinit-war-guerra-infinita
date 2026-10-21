import pg from "pg";
import { createPostgresTlsOptions } from "../src/config/postgresTls.js";

const connectionString = process.env.GAME_SUPABASE_DATABASE_URL;
if (!connectionString) {
    console.error("PG_PERSISTENCE_CHECK_FAILED: GAME_SUPABASE_DATABASE_URL is missing.");
    process.exit(1);
}

let url;
try {
    url = new URL(connectionString);
} catch {
    console.error("PG_PERSISTENCE_CHECK_FAILED: configured value is not a valid URL.");
    process.exit(1);
}
if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname) {
    console.error("PG_PERSISTENCE_CHECK_FAILED: configured value is not a PostgreSQL URL.");
    process.exit(1);
}

let ssl;
try {
    ssl = createPostgresTlsOptions(process.env.GAME_SUPABASE_CA_CERT);
} catch (error) {
    console.error("PG_PERSISTENCE_CHECK_FAILED: CA certificate validation failed (" + String(error.message).slice(0, 140) + ").");
    process.exit(1);
}
for (const key of ["sslmode", "ssl", "sslcert", "sslkey", "sslrootcert"]) url.searchParams.delete(key);

const options = {
    connectionString: url.toString(),
    ssl,
    max: 1,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 3000,
    application_name: "iwar-isolated-persistence-check"
};

let pool = new pg.Pool(options);
try {
    const client = await pool.connect();
    try {
        // Temporary table is scoped to this session; the probe never changes game tables.
        await client.query("CREATE TEMP TABLE iwar_persistence_probe (id SMALLINT PRIMARY KEY, payload JSONB NOT NULL, revision BIGINT NOT NULL)");
        await client.query(
            "INSERT INTO iwar_persistence_probe (id, payload, revision) VALUES (1, $1::jsonb, 0)",
            [JSON.stringify({ probe: "initial", value: 1 })]
        );

        const read = await client.query("SELECT payload, revision FROM iwar_persistence_probe WHERE id = 1");
        if (read.rows.length !== 1 || read.rows[0].payload.value !== 1 || Number(read.rows[0].revision) !== 0) {
            throw new Error("read-after-insert mismatch");
        }

        const write = await client.query(
            "UPDATE iwar_persistence_probe SET payload = $1::jsonb, revision = revision + 1 WHERE id = 1 AND revision = $2 RETURNING revision",
            [JSON.stringify({ probe: "updated", value: 2 }), 0]
        );
        if (write.rows.length !== 1 || Number(write.rows[0].revision) !== 1) {
            throw new Error("conditional update failed");
        }

        const staleWrite = await client.query(
            "UPDATE iwar_persistence_probe SET payload = $1::jsonb, revision = revision + 1 WHERE id = 1 AND revision = $2 RETURNING revision",
            [JSON.stringify({ probe: "stale", value: 999 }), 0]
        );
        if (staleWrite.rows.length !== 0) {
            throw new Error("stale concurrent write was not rejected");
        }

        const verify = await client.query("SELECT payload, revision FROM iwar_persistence_probe WHERE id = 1");
        if (verify.rows[0]?.payload?.value !== 2 || Number(verify.rows[0]?.revision) !== 1) {
            throw new Error("stale write changed the stored state");
        }
    } finally {
        client.release();
    }

    await pool.end();
    pool = new pg.Pool(options);
    const reconnect = await pool.query("SELECT 1 AS ok");
    if (reconnect.rows[0]?.ok !== 1) throw new Error("fresh TLS connection after pool recreation failed");

    console.log("PG_PERSISTENCE_OK: isolated read/write, revision conflict protection, and fresh TLS reconnection passed.");
} catch (error) {
    console.error("PG_PERSISTENCE_CHECK_FAILED: isolated persistence probe failed (" + String(error?.code || error?.message || "UNKNOWN").replace(/[^A-Za-z0-9 _-]/g, "").slice(0, 100) + ").");
    process.exitCode = 1;
} finally {
    await pool.end().catch(() => {});
}
