import pg from "pg";

const connectionString = process.env.GAME_SUPABASE_DATABASE_URL;
const caCertificate = process.env.GAME_SUPABASE_CA_CERT?.replace(/\\n/g, "\n").trim();

if (!connectionString) {
  console.error("PG_ISOLATION_PREFLIGHT_FAILED: database URL secret is missing.");
  process.exit(1);
}
if (!caCertificate ||
    !caCertificate.includes("-----BEGIN CERTIFICATE-----") ||
    !caCertificate.includes("-----END CERTIFICATE-----")) {
  console.error("PG_ISOLATION_PREFLIGHT_FAILED: explicit PEM CA certificate is missing or invalid.");
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(connectionString);
} catch {
  console.error("PG_ISOLATION_PREFLIGHT_FAILED: database URL is invalid.");
  process.exit(1);
}
if (!["postgres:", "postgresql:"].includes(parsed.protocol) || !parsed.hostname) {
  console.error("PG_ISOLATION_PREFLIGHT_FAILED: URL must target PostgreSQL.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { ca: caCertificate, rejectUnauthorized: true },
  connectionTimeoutMillis: 8000,
  max: 1,
  application_name: "iwar-readonly-isolation-preflight"
});

try {
  const { rows } = await pool.query(`
    SELECT
      current_database() AS database_name,
      current_user AS role_name,
      current_schema() AS current_schema,
      current_setting('search_path') AS search_path,
      has_database_privilege(current_user, current_database(), 'CREATE') AS can_create_schema,
      has_schema_privilege(current_user, 'public', 'CREATE') AS can_create_in_public
  `);
  const result = rows[0];
  const { rows: tableRows } = await pool.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
      AND table_name = ANY($1::text[])
      AND table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name
  `, [["app_state", "users", "heroes", "buildings", "inventory", "receipts", "alliances"]]);

  // Report only non-secret capability facts; never emit connection details.
  console.log("PG_ISOLATION_PREFLIGHT: verified TLS; read-only catalog inspection completed.");
  console.log("PG_ISOLATION_CONTEXT: " + JSON.stringify({
    currentSchema: result.current_schema,
    searchPath: result.search_path,
    canCreateSchema: result.can_create_schema,
    canCreateInPublic: result.can_create_in_public,
    expectedTablesBySchema: tableRows.reduce((acc, row) => {
      (acc[row.table_schema] ||= []).push(row.table_name);
      return acc;
    }, {})
  }));
  console.log("PG_ISOLATION_PREFLIGHT_NOTE: no schemas, tables, rows, grants, or settings were changed.");
} catch (error) {
  const code = String(error?.code || "UNKNOWN").replace(/[^A-Za-z0-9_]/g, "").slice(0, 32);
  console.error(`PG_ISOLATION_PREFLIGHT_FAILED: read-only catalog query failed (code=${code}); details withheld.`);
  process.exitCode = 1;
} finally {
  await pool.end().catch(() => {});
}
