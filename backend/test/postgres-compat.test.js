import assert from "node:assert/strict";
import test from "node:test";
import { translatePostgresQuery } from "../src/postgresCompat.js";

test("PostgreSQL adapter converts positional placeholders", () => {
  assert.equal(translatePostgresQuery("SELECT * FROM users WHERE external_id = ? AND level >= ?"), "SELECT * FROM users WHERE external_id = $1 AND level >= $2");
});

test("PostgreSQL adapter translates user upserts to explicit conflict targets", () => {
  const sql = "INSERT INTO users (external_id, nickname) VALUES (?, ?) ON DUPLICATE KEY UPDATE nickname = VALUES(nickname), updated_at = CURRENT_TIMESTAMP(3)";
  assert.equal(translatePostgresQuery(sql), "INSERT INTO users (external_id, nickname) VALUES ($1, $2) ON CONFLICT (external_id) DO UPDATE SET nickname = EXCLUDED.nickname, updated_at = NOW()");
});

test("PostgreSQL adapter uses compound conflict targets for heroes and inventory", () => {
  assert.match(translatePostgresQuery("INSERT INTO heroes (user_id, hero_code) VALUES (?, ?) ON DUPLICATE KEY UPDATE rarity = VALUES(rarity)"), /ON CONFLICT \(user_id, hero_code\) DO UPDATE SET rarity = EXCLUDED\.rarity/);
  assert.match(translatePostgresQuery("INSERT INTO inventory (external_id, item_code, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), updated_at = CURRENT_TIMESTAMP(3)"), /ON CONFLICT \(external_id, item_code\) DO UPDATE SET quantity = EXCLUDED\.quantity, updated_at = NOW\(\)/);
});

test("PostgreSQL adapter refuses unconfigured upsert targets", () => {
  assert.throws(() => translatePostgresQuery("INSERT INTO unknown_table (id) VALUES (?) ON DUPLICATE KEY UPDATE id = VALUES(id)"), /No PostgreSQL conflict target configured/);
});