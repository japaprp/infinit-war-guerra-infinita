import pg from "pg";

const connectionString = process.env.GAME_SUPABASE_DATABASE_URL;
const caCertificate = process.env.GAME_SUPABASE_CA_CERT?.replace(/\\n/g, "\n").trim();

if (!connectionString || !caCertificate?.includes("-----BEGIN CERTIFICATE-----") || !caCertificate.includes("-----END CERTIFICATE-----")) {
  console.error("PG_SCHEMA_CONTRACT_FAILED: database URL or explicit PEM CA certificate is missing.");
  process.exit(1);
}
let parsed;
try { parsed = new URL(connectionString); } catch {
  console.error("PG_SCHEMA_CONTRACT_FAILED: database URL is invalid.");
  process.exit(1);
}
if (!["postgres:", "postgresql:"].includes(parsed.protocol) || !parsed.hostname) {
  console.error("PG_SCHEMA_CONTRACT_FAILED: configured URL is not PostgreSQL.");
  process.exit(1);
}

const required = {
  app_state: ["id", "payload", "updated_at"],
  users: ["id", "external_id", "nickname", "level", "vip_level", "power", "realm_id", "profile_json", "created_at", "updated_at"],
  heroes: ["id", "user_id", "hero_code", "rarity", "level", "stars", "ascension", "shards_owned", "stats_json", "skill_levels_json", "created_at", "updated_at"],
  buildings: ["id", "user_id", "building_type", "slot_code", "level", "state", "end_at_ms", "task_id", "created_at", "updated_at"],
  inventory: ["id", "external_id", "item_code", "quantity", "metadata_json", "updated_at"],
  receipts: ["receipt_id", "external_id", "hero_id", "pack_id", "cost_gems", "issued_at_ms", "signature", "used", "used_at_ms", "updated_at"],
  alliances: ["id", "alliance_uid", "realm_id", "name", "tag", "leader_external_id", "member_count", "power", "created_at"]
};

const pool = new pg.Pool({
  connectionString,
  ssl: { ca: caCertificate, rejectUnauthorized: true },
  connectionTimeoutMillis: 8000,
  max: 1,
  application_name: "iwar-readonly-schema-contract"
});
try {
  const { rows } = await pool.query(
    "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ANY($1::text[])",
    [Object.keys(required)]
  );
  const actual = new Map();
  for (const row of rows) {
    if (!actual.has(row.table_name)) actual.set(row.table_name, new Set());
    actual.get(row.table_name).add(row.column_name);
  }
  const missing = [];
  for (const [table, columns] of Object.entries(required)) {
    const present = actual.get(table) || new Set();
    for (const column of columns) if (!present.has(column)) missing.push(table + "." + column);
  }

  // These unique keys are required by the repository's explicit ON CONFLICT targets.
  const uniqueContracts = [
    ["app_state", ["id"]],
    ["users", ["external_id"]],
    ["heroes", ["user_id", "hero_code"]],
    ["buildings", ["user_id", "slot_code"]],
    ["inventory", ["external_id", "item_code"]],
    ["receipts", ["receipt_id"]],
    ["alliances", ["alliance_uid"]]
  ];
  const { rows: indexRows } = await pool.query(
    `SELECT t.relname AS table_name, pg_get_indexdef(i.indexrelid) AS indexdef
     FROM pg_index i
     JOIN pg_class t ON t.oid = i.indrelid
     JOIN pg_namespace n ON n.oid = t.relnamespace
     WHERE n.nspname = 'public'
       AND t.relname = ANY($1::text[])
       AND i.indisunique
       AND i.indisvalid
       AND i.indpred IS NULL`,
    [Object.keys(required)]
  );
  const uniqueKeys = new Set();
  for (const row of indexRows) {
    const match = row.indexdef.match(/\bUSING\s+\w+\s*\(([^)]+)\)/i);
    if (!match) continue;
    const columns = match[1].split(",").map(column => column.trim().replace(/"/g, ""));
    uniqueKeys.add(row.table_name + ":" + columns.join(","));
  }
  const missingUnique = uniqueContracts
    .filter(([table, columns]) => !uniqueKeys.has(table + ":" + columns.join(",")))
    .map(([table, columns]) => table + "(" + columns.join(",") + ")");

  if (missing.length || missingUnique.length) {
    if (missing.length) console.error("PG_SCHEMA_CONTRACT_MISSING_COLUMNS: " + missing.join(", "));
    if (missingUnique.length) console.error("PG_SCHEMA_CONTRACT_MISSING_UNIQUE_KEYS: " + missingUnique.join(", "));
    console.error("PG_SCHEMA_CONTRACT_FAILED: repository schema contract is incomplete; no data or schema was changed.");
    process.exitCode = 1;
  } else {
    console.log("PG_SCHEMA_CONTRACT_OK: required columns and ON CONFLICT unique keys exist in public schema; catalog-only read, no data or schema changed.");
  }
} catch (error) {
  const code = String(error?.code || "UNKNOWN").replace(/[^A-Za-z0-9_]/g, "").slice(0, 32);
  console.error("PG_SCHEMA_CONTRACT_FAILED: read-only catalog query failed (code=" + code + "); details withheld.");
  process.exitCode = 1;
} finally {
  await pool.end().catch(() => {});
}
