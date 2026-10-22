import pg from "pg";
import { randomUUID } from "node:crypto";
import { initializeRepository, readDb, writeDb, closeRepository } from "../src/repositories/dbRepository.js";

const connectionString = process.env.GAME_SUPABASE_DATABASE_URL;
const ca = process.env.GAME_SUPABASE_CA_CERT?.replace(/\\n/g, "\n").trim();
if (!connectionString || !ca?.includes("-----BEGIN CERTIFICATE-----") || !ca.includes("-----END CERTIFICATE-----")) {
  console.error("PG_REPOSITORY_INTEGRATION_FAILED: database URL or explicit PEM CA is missing.");
  process.exit(1);
}

const schema = "iwar_ci_" + randomUUID().replace(/-/g, "").slice(0, 20);
const baseUrl = new URL(connectionString);
const adminPool = new pg.Pool({
  connectionString,
  ssl: { ca, rejectUnauthorized: true },
  connectionTimeoutMillis: 8000,
  max: 1,
  application_name: "iwar-isolated-repository-test"
});
let schemaCreated = false;
const runtimeUrl = new URL(connectionString);
runtimeUrl.searchParams.set("options", "-c search_path=" + schema + ",public");

const ddl = [
  `CREATE TABLE ${schema}.app_state (id integer PRIMARY KEY, payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE ${schema}.users (id bigserial PRIMARY KEY, external_id varchar(80) NOT NULL UNIQUE, nickname varchar(32) NOT NULL, level integer NOT NULL DEFAULT 1, vip_level smallint NOT NULL DEFAULT 0, power bigint NOT NULL DEFAULT 0, realm_id integer NOT NULL DEFAULT 1, profile_json jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE ${schema}.heroes (id bigserial PRIMARY KEY, user_id bigint NOT NULL REFERENCES ${schema}.users(id), hero_code varchar(48) NOT NULL, rarity varchar(16) NOT NULL, level smallint NOT NULL DEFAULT 1, stars smallint NOT NULL DEFAULT 1, ascension smallint NOT NULL DEFAULT 0, shards_owned integer NOT NULL DEFAULT 0, stats_json jsonb, skill_levels_json jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id, hero_code))`,
  `CREATE TABLE ${schema}.buildings (id bigserial PRIMARY KEY, user_id bigint NOT NULL REFERENCES ${schema}.users(id), building_type varchar(32) NOT NULL, slot_code varchar(32) NOT NULL, level smallint NOT NULL DEFAULT 1, state varchar(16) NOT NULL DEFAULT 'IDLE', end_at_ms bigint NOT NULL DEFAULT 0, task_id varchar(80), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id, slot_code))`,
  `CREATE TABLE ${schema}.inventory (id bigserial PRIMARY KEY, external_id varchar(80) NOT NULL, item_code varchar(64) NOT NULL, quantity bigint NOT NULL DEFAULT 0, metadata_json jsonb, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(external_id, item_code))`,
  `CREATE TABLE ${schema}.receipts (receipt_id varchar(64) PRIMARY KEY, external_id varchar(80) NOT NULL, hero_id varchar(64) NOT NULL, pack_id varchar(64) NOT NULL, cost_gems integer NOT NULL, issued_at_ms bigint NOT NULL, signature varchar(128) NOT NULL, used boolean NOT NULL DEFAULT false, used_at_ms bigint, updated_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE ${schema}.alliances (id bigserial PRIMARY KEY, alliance_uid varchar(80) NOT NULL UNIQUE, realm_id integer NOT NULL DEFAULT 1, name varchar(32) NOT NULL, tag varchar(8) NOT NULL, leader_external_id varchar(80) NOT NULL, member_count integer NOT NULL DEFAULT 1, power bigint NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now())`
];

function makeDb(externalId, gems, gameData = {}) {
  return {
    users: {
      [externalId]: {
        profile: { provider: "test", providerUid: externalId, displayName: "CI Synthetic" },
        economy: { gems },
        inventory: { test_item: 7 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        v1: {
          stateVersion: 1, level: 3, power: 1234, vipLevel: 0,
          resources: { gold: 10, wood: 20, steel: 30, food: 40, gems, energy: 100, energyMax: 100, energyRegenPerMinute: 1.2 },
          heroes: [{ heroId: "ci_hero", rarity: "RARE", level: 4, stars: 2, ascension: 0, stats: { atk: 10, def: 20, units: 30, power: 40 }, shardsOwned: 5, skillLevels: [1, 2, 3] }],
          buildings: [{ buildingId: "b_ci", buildingType: "hq", slotCode: "ci_slot", level: 2, state: "IDLE", endAtMs: 0, taskId: "" }],
          alliances: { allianceId: "", name: "", tag: "" },
          pass: { seasonId: "ci", claimed: {} },
          gameData
        }
      },
    },
    receipts: {}, alliances: {}, rallies: {}, battles: {}
  };
}

try {
  await adminPool.query(`CREATE SCHEMA ${schema}`);
  schemaCreated = true;
  for (const statement of ddl) await adminPool.query(statement);

  await initializeRepository({
    NODE_ENV: "production",
    DATA_DRIVER: "postgres",
    DATABASE_URL: runtimeUrl.toString(),
    POSTGRES_CA_CERT: ca
  });

  const firstId = "ci:" + randomUUID();
  const firstDb = makeDb(firstId, 777, { probe: "round-trip" });
  await writeDb(firstDb);
  const roundTrip = await readDb();
  if (roundTrip.users?.[firstId]?.economy?.gems !== 777 ||
      roundTrip.users?.[firstId]?.inventory?.test_item !== 7 ||
      roundTrip.users?.[firstId]?.v1?.heroes?.[0]?.heroId !== "ci_hero" ||
      roundTrip.users?.[firstId]?.v1?.buildings?.[0]?.slotCode !== "ci_slot" ||
      roundTrip.users?.[firstId]?.v1?.gameData?.probe !== "round-trip") {
    throw new Error("round-trip assertion failed");
  }
  console.log("PG_REPOSITORY_ROUNDTRIP_OK: synthetic user, economy, inventory, hero, building and app_state data round-tripped.");

  const rollbackId = "ci:rollback:" + randomUUID();
  const invalidDb = makeDb(rollbackId, 888);
  invalidDb.users[rollbackId].v1.heroes = [{
    heroId: "x".repeat(60), rarity: "RARE", level: 1, stars: 1, ascension: 0,
    stats: { atk: 1, def: 1, units: 1, power: 1 }, shardsOwned: 0, skillLevels: [1, 1, 1]
  }];
  let rollbackObserved = false;
  try { await writeDb(invalidDb); } catch { rollbackObserved = true; }
  const { rows: rollbackRows } = await adminPool.query(`SELECT count(*)::int AS count FROM ${schema}.users WHERE external_id = $1`, [rollbackId]);
  if (!rollbackObserved || rollbackRows[0].count !== 0) {
    throw new Error("transaction rollback assertion failed");
  }
  console.log("PG_REPOSITORY_ROLLBACK_OK: constraint failure left no partial synthetic user row.");

  const idA = "ci:concurrent:a:" + randomUUID();
  const idB = "ci:concurrent:b:" + randomUUID();
  await Promise.all([writeDb(makeDb(idA, 111)), writeDb(makeDb(idB, 222))]);
  const concurrentRead = await readDb();
  if (!concurrentRead.users?.[idA] || !concurrentRead.users?.[idB]) {
    throw new Error("concurrent write verification failed; one or more synthetic users missing");
  }
  console.log("PG_REPOSITORY_CONCURRENCY_OK: two simultaneous synthetic snapshots completed and both users are present.");

  console.log("PG_REPOSITORY_INTEGRATION_OK: all writes were scoped to an isolated temporary schema; public game tables were not targeted.");
} catch (error) {
  const code = String(error?.code || "UNKNOWN").replace(/[^A-Za-z0-9_]/g, "").slice(0, 32);
  console.error(`PG_REPOSITORY_INTEGRATION_FAILED: test failed (code=${code}); diagnostic details withheld.`);
  process.exitCode = 1;
} finally {
  await closeRepository().catch(() => {});
  if (schemaCreated) {
    try {
      await adminPool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      console.log("PG_REPOSITORY_CLEANUP_OK: temporary schema dropped.");
    } catch {
      console.error("PG_REPOSITORY_CLEANUP_FAILED: temporary schema cleanup failed; manual cleanup may be required.");
      process.exitCode = 1;
    }
  }
  await adminPool.end().catch(() => {});
}
