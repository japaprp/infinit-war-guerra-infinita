import pg from "pg";

const CONFLICT_COLUMNS = { app_state: "id", users: "external_id", heroes: "user_id, hero_code", buildings: "user_id, slot_code", inventory: "external_id, item_code", receipts: "receipt_id", alliances: "alliance_uid" };

export function translatePostgresQuery(input) {
  let sql = String(input || "");
  const insertMatch = sql.match(/INSERT\s+INTO\s+([a-z_]+)/i);
  const table = insertMatch ? insertMatch[1].toLowerCase() : "";
  const duplicateIndex = sql.search(/ON DUPLICATE KEY UPDATE/i);
  if (duplicateIndex >= 0) {
    const updateClause = sql.slice(duplicateIndex).replace(/^ON DUPLICATE KEY UPDATE/i, "").trim();
    const assignments = updateClause.split(/,\s*(?=[a-z_]+\s*=)/i).map((part) => part.trim()).filter(Boolean).map((part) => {
      const match = part.match(/^([a-z_]+)\s*=\s*VALUES\(([a-z_]+)\)$/i);
      if (match) return match[1] + " = EXCLUDED." + match[2];
      return part.replace(/CURRENT_TIMESTAMP\(3\)/gi, "NOW()");
    });
    const conflict = CONFLICT_COLUMNS[table];
    if (!conflict) throw new Error("No PostgreSQL conflict target configured for table: " + table);
    sql = sql.slice(0, duplicateIndex).trimEnd() + " ON CONFLICT (" + conflict + ") DO UPDATE SET " + assignments.join(", ");
  }
  sql = sql.replace(/CURRENT_TIMESTAMP\(3\)/gi, "NOW()");
  let index = 0;
  return sql.replace(/\?/g, () => "$" + (++index));
}

function wrapClient(client) {
  return {
    query: async (sql, params = []) => { const result = await client.query(translatePostgresQuery(sql), params); return [result.rows, result.fields]; },
    beginTransaction: () => client.query("BEGIN"),
    commit: () => client.query("COMMIT"),
    rollback: () => client.query("ROLLBACK"),
    release: () => client.release()
  };
}

export function createPostgresPool(env) {
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: true }, max: 8, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 });
  return {
    driver: "postgres",
    query: async (sql, params = []) => { const result = await pool.query(translatePostgresQuery(sql), params); return [result.rows, result.fields]; },
    getConnection: async () => wrapClient(await pool.connect())
  };
}