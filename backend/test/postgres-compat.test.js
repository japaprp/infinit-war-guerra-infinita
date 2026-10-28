import assert from "node:assert/strict";
import test from "node:test";
import { resolvePostgresCaCertificate, translatePostgresQuery } from "../src/postgresCompat.js";

test("translates positional placeholders in order", () => {
  assert.equal(
    translatePostgresQuery("SELECT * FROM users WHERE external_id = ? AND level >= ?"),
    "SELECT * FROM users WHERE external_id = $1 AND level >= $2"
  );
});

test("does not translate question marks inside quoted values or SQL comments", () => {
  const sql = "SELECT '?' AS literal, value FROM users WHERE external_id = ? -- ignore ?\n/* ignore ? */ AND nickname = '?'";
  assert.equal(
    translatePostgresQuery(sql),
    "SELECT '?' AS literal, value FROM users WHERE external_id = $1 -- ignore ?\n/* ignore ? */ AND nickname = '?'"
  );
});

test("translates user upserts to explicit conflict targets", () => {
  const sql = "INSERT INTO users (external_id, nickname) VALUES (?, ?) ON DUPLICATE KEY UPDATE nickname = VALUES(nickname), updated_at = CURRENT_TIMESTAMP(3)";
  assert.equal(
    translatePostgresQuery(sql),
    "INSERT INTO users (external_id, nickname) VALUES ($1, $2) ON CONFLICT (external_id) DO UPDATE SET nickname = EXCLUDED.nickname, updated_at = NOW()"
  );
});

test("uses compound conflict targets for heroes, buildings, and inventory", () => {
  assert.match(translatePostgresQuery("INSERT INTO heroes (user_id, hero_code) VALUES (?, ?) ON DUPLICATE KEY UPDATE rarity = VALUES(rarity)"), /ON CONFLICT \(user_id, hero_code\) DO UPDATE SET rarity = EXCLUDED\.rarity/);
  assert.match(translatePostgresQuery("INSERT INTO buildings (user_id, slot_code) VALUES (?, ?) ON DUPLICATE KEY UPDATE level = VALUES(level)"), /ON CONFLICT \(user_id, slot_code\) DO UPDATE SET level = EXCLUDED\.level/);
  assert.match(translatePostgresQuery("INSERT INTO inventory (external_id, item_code, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), updated_at = CURRENT_TIMESTAMP(3)"), /ON CONFLICT \(external_id, item_code\) DO UPDATE SET quantity = EXCLUDED\.quantity, updated_at = NOW\(\)/);
});

test("supports all declared conflict targets", () => {
  for (const [table, columns] of [
    ["app_state", "id"],
    ["users", "external_id"],
    ["heroes", "user_id, hero_code"],
    ["buildings", "user_id, slot_code"],
    ["inventory", "external_id, item_code"],
    ["receipts", "receipt_id"],
    ["alliances", "alliance_uid"]
  ]) {
    assert.match(
      translatePostgresQuery(`INSERT INTO ${table} (id) VALUES (?) ON DUPLICATE KEY UPDATE id = VALUES(id)`),
      new RegExp(`ON CONFLICT \\(${columns.replace(/, /g, ", ")}\\) DO UPDATE SET id = EXCLUDED\\.id`)
    );
  }
});

test("rejects upserts without a configured conflict target", () => {
  assert.throws(
    () => translatePostgresQuery("INSERT INTO unknown_table (id) VALUES (?) ON DUPLICATE KEY UPDATE id = VALUES(id)"),
    /No PostgreSQL conflict target configured/
  );
});

test("normalizes MySQL timestamp precision without changing quoted text", () => {
  assert.equal(
    translatePostgresQuery("UPDATE users SET updated_at = CURRENT_TIMESTAMP(3), nickname = 'CURRENT_TIMESTAMP(3)' WHERE id = ?"),
    "UPDATE users SET updated_at = NOW(), nickname = 'CURRENT_TIMESTAMP(3)' WHERE id = $1"
  );
});

test("uses explicit PostgreSQL CA environment value and normalizes escaped newlines", () => {
  const certificate = "-----BEGIN CERTIFICATE-----\\nsynthetic-ca-data\\n-----END CERTIFICATE-----";
  const escaped = certificate.replace(/\\n/g, "\\\\n");
  assert.equal(
    resolvePostgresCaCertificate({ POSTGRES_CA_CERT: escaped, POSTGRES_CA_CERT_PATH: "/missing/ca.pem" }),
    certificate
  );
});

test("returns no CA when neither the environment nor the configured file provides one", () => {
  assert.equal(
    resolvePostgresCaCertificate({ POSTGRES_CA_CERT_PATH: "/missing/ca.pem" }),
    undefined
  );
});
