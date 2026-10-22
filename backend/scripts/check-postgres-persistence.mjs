import { randomUUID } from "node:crypto";
import pg from "pg";

const connectionString = process.env.GAME_SUPABASE_DATABASE_URL;
const caCertificate = process.env.GAME_SUPABASE_CA_CERT?.replace(/\\n/g, "\n").trim();

if (!connectionString) {
  console.error("PG_PERSISTENCE_CHECK_FAILED: required database URL secret is missing.");
  process.exit(1);
}
if (!caCertificate ||
    !caCertificate.includes("-----BEGIN CERTIFICATE-----") ||
    !caCertificate.includes("-----END CERTIFICATE-----")) {
  console.error("PG_PERSISTENCE_CHECK_FAILED: a valid explicit PEM CA certificate is required.");
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(connectionString);
} catch {
  console.error("PG_PERSISTENCE_CHECK_FAILED: database URL is invalid.");
  process.exit(1);
}
if (!["postgres:", "postgresql:"].includes(parsed.protocol) || !parsed.hostname) {
  console.error("PG_PERSISTENCE_CHECK_FAILED: URL must target PostgreSQL.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { ca: caCertificate, rejectUnauthorized: true },
  connectionTimeoutMillis: 8000,
  max: 1,
  application_name: "iwar-temporary-persistence-probe"
});

let client;
let transactionOpen = false;
let tableCreated = false;
try {
  client = await pool.connect();
  await client.query("BEGIN");
  transactionOpen = true;

  // TEMP table is scoped to this session and does not modify game tables.
  await client.query(
    "CREATE TEMP TABLE iwar_persistence_probe (probe_id TEXT PRIMARY KEY, payload JSONB NOT NULL) ON COMMIT PRESERVE ROWS"
  );
  tableCreated = true;

  const probeId = randomUUID();
  const payload = { purpose: "persistence-check", marker: randomUUID(), schemaVersion: 1 };

  await client.query(
    "INSERT INTO pg_temp.iwar_persistence_probe (probe_id, payload) VALUES ($1, $2::jsonb)",
    [probeId, JSON.stringify(payload)]
  );
  await client.query("COMMIT");
  transactionOpen = false;

  const { rows } = await client.query(
    "SELECT probe_id, payload FROM pg_temp.iwar_persistence_probe WHERE probe_id = $1",
    [probeId]
  );
  if (rows.length !== 1 ||
      rows[0].probe_id !== probeId ||
      JSON.stringify(rows[0].payload) !== JSON.stringify(payload)) {
    throw new Error("Committed synthetic record did not match the read-back value.");
  }

  await client.query("DROP TABLE pg_temp.iwar_persistence_probe");
  tableCreated = false;
  console.log("PG_PERSISTENCE_OK: synthetic record committed and read back over verified TLS; temporary table dropped; game tables untouched.");
} catch (error) {
  if (client && transactionOpen) {
    await client.query("ROLLBACK").catch(() => {});
    transactionOpen = false;
  }
  if (client && tableCreated) {
    await client.query("DROP TABLE IF EXISTS pg_temp.iwar_persistence_probe").catch(() => {});
  }
  const code = String(error?.code || "UNKNOWN").replace(/[^A-Za-z0-9_]/g, "").slice(0, 32);
  console.error(`PG_PERSISTENCE_CHECK_FAILED: temporary persistence probe failed (code=${code}).`);
  process.exitCode = 1;
} finally {
  client?.release();
  await pool.end().catch(() => {});
}
