import pg from "pg";

const CONFLICT_COLUMNS = Object.freeze({
  app_state: "id",
  users: "external_id",
  heroes: "user_id, hero_code",
  buildings: "user_id, slot_code",
  inventory: "external_id, item_code",
  receipts: "receipt_id",
  alliances: "alliance_uid"
});

function walkSql(sql, transformCode) {
  let output = "";
  let code = "";
  let i = 0;
  const flushCode = () => {
    if (code) output += transformCode(code);
    code = "";
  };

  while (i < sql.length) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (ch === "'" || ch === '"') {
      flushCode();
      const quote = ch;
      let literal = ch;
      i++;
      while (i < sql.length) {
        const current = sql[i];
        literal += current;
        if (current === "\\" && i + 1 < sql.length) {
          literal += sql[++i];
        } else if (current === quote) {
          if (sql[i + 1] === quote) {
            literal += sql[++i];
          } else {
            i++;
            break;
          }
        }
        i++;
      }
      output += literal;
      continue;
    }

    if (ch === "/" && next === "*") {
      flushCode();
      const end = sql.indexOf("*/", i + 2);
      if (end === -1) {
        output += sql.slice(i);
        return output + transformCode(code);
      }
      output += sql.slice(i, end + 2);
      i = end + 2;
      continue;
    }

    if ((ch === "-" && next === "-" && (i + 2 >= sql.length || /\s/.test(sql[i + 2]))) || ch === "#") {
      flushCode();
      const end = sql.indexOf("\n", i);
      if (end === -1) {
        output += sql.slice(i);
        return output;
      }
      output += sql.slice(i, end + 1);
      i = end + 1;
      continue;
    }

    code += ch;
    i++;
  }

  flushCode();
  return output;
}

function findKeywordOutsideLiterals(sql, keywordRegex) {
  let quote = "";
  let lineComment = false;
  let blockComment = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1];
    if (lineComment) {
      if (ch === "\\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        i++;
      }
      continue;
    }
    if (quote) {
      if (ch === "\\\\" && i + 1 < sql.length) i++;
      else if (ch === quote) {
        if (next === quote) i++;
        else quote = "";
      }
      continue;
    }
    if (ch === "'" || ch === '"') quote = ch;
    else if (ch === "/" && next === "*") {
      blockComment = true;
      i++;
    } else if ((ch === "-" && next === "-" && (i + 2 >= sql.length || /\\s/.test(sql[i + 2]))) || ch === "#") {
      lineComment = true;
      if (ch === "-" && next === "-") i++;
    } else {
      keywordRegex.lastIndex = 0;
      const match = keywordRegex.exec(sql.slice(i));
      if (match && match.index === 0) return i;
    }
  }
  return -1;
}

function splitTopLevel(input, delimiter = ",") {
  const parts = [];
  let current = "";
  let depth = 0;
  const walked = walkSql(input, (segment) => {
    for (const ch of segment) {
      if (ch === "(") depth++;
      if (ch === ")") depth = Math.max(0, depth - 1);
      if (ch === delimiter && depth === 0) {
        parts.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    return "";
  });
  // walkSql removes quoted/comment text from the callback output; use a direct scan instead.
  // The direct scanner below is intentionally used to preserve the exact original SQL fragments.
  void walked;
  current = "";
  depth = 0;
  let quote = "";
  let lineComment = false;
  let blockComment = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];
    if (lineComment) {
      current += ch;
      if (ch === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      current += ch;
      if (ch === "*" && next === "/") {
        current += next;
        i++;
        blockComment = false;
      }
      continue;
    }
    if (quote) {
      current += ch;
      if (ch === "\\" && i + 1 < input.length) current += input[++i];
      else if (ch === quote) {
        if (next === quote) current += input[++i];
        else quote = "";
      }
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
    } else if (ch === "/" && next === "*") {
      blockComment = true;
      current += ch + next;
      i++;
    } else if ((ch === "-" && next === "-" && (i + 2 >= input.length || /\s/.test(input[i + 2]))) || ch === "#") {
      lineComment = true;
      current += ch;
      if (next === "-" && ch === "-") {
        current += next;
        i++;
      }
    } else if (ch === "(") {
      depth++;
      current += ch;
    } else if (ch === ")") {
      depth = Math.max(0, depth - 1);
      current += ch;
    } else if (ch === delimiter && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function replaceOutsideLiterals(sql, pattern, replacer) {
  return walkSql(sql, (segment) => segment.replace(pattern, replacer));
}

function replacePlaceholders(sql) {
  let index = 0;
  return replaceOutsideLiterals(sql, /\?/g, () => "$" + (++index));
}

export function translatePostgresQuery(input) {
  let sql = String(input || "");
  const duplicateIndex = findKeywordOutsideLiterals(sql, /ON\s+DUPLICATE\s+KEY\s+UPDATE/i);

  if (duplicateIndex >= 0) {
    const insertPrefix = sql.slice(0, duplicateIndex);
    const tableMatch = insertPrefix.match(/INSERT\s+INTO\s+([a-z_][a-z0-9_]*)/i);
    const table = tableMatch?.[1]?.toLowerCase() || "";
    const keywordMatch = /ON\s+DUPLICATE\s+KEY\s+UPDATE/i.exec(sql.slice(duplicateIndex));
    const updateStart = duplicateIndex + keywordMatch[0].length;
    const updateClause = sql.slice(updateStart).trim();
    const assignments = splitTopLevel(updateClause).map((part) => {
      const valuesMatch = part.match(/^([a-z_][a-z0-9_]*)\s*=\s*VALUES\s*\(\s*([a-z_][a-z0-9_]*)\s*\)$/i);
      if (valuesMatch) return valuesMatch[1] + " = EXCLUDED." + valuesMatch[2];
      return replaceOutsideLiterals(part, /CURRENT_TIMESTAMP\(3\)/gi, () => "NOW()");
    });

    const conflict = CONFLICT_COLUMNS[table];
    if (!conflict) throw new Error("No PostgreSQL conflict target configured for table: " + table);
    if (!assignments.length) throw new Error("No assignments found in MySQL ON DUPLICATE KEY UPDATE clause");
    sql = insertPrefix.trimEnd() + " ON CONFLICT (" + conflict + ") DO UPDATE SET " + assignments.join(", ");
  }

  sql = replaceOutsideLiterals(sql, /CURRENT_TIMESTAMP\(3\)/gi, () => "NOW()");
  return replacePlaceholders(sql);
}

function wrapClient(client) {
  return {
    query: async (sql, params = []) => {
      const result = await client.query(translatePostgresQuery(sql), params);
      return [result.rows, result.fields];
    },
    beginTransaction: () => client.query("BEGIN"),
    commit: () => client.query("COMMIT"),
    rollback: () => client.query("ROLLBACK"),
    release: () => client.release()
  };
}

function secureConnectionString(connectionString) {
  const parsed = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error("DATABASE_URL must use the postgres:// or postgresql:// scheme");
  }
  // pg's connection-string SSL options can override the explicit SSL object.
  parsed.searchParams.delete("sslmode");
  parsed.searchParams.delete("ssl");
  return parsed.toString();
}

export function createPostgresPool(env) {
  const pool = new pg.Pool({
    connectionString: secureConnectionString(env.DATABASE_URL),
    ssl: { rejectUnauthorized: true },
    max: 8,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  return {
    driver: "postgres",
    query: async (sql, params = []) => {
      const result = await pool.query(translatePostgresQuery(sql), params);
      return [result.rows, result.fields];
    },
    getConnection: async () => wrapClient(await pool.connect()),
    end: () => pool.end()
  };
}
