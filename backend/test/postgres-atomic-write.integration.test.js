import assert from "node:assert/strict";
import test from "node:test";
import pg from "pg";
import { env } from "../src/config/env.js";
import { closeRepository, initializeRepository, writeDb } from "../src/repositories/dbRepository.js";

test("normalized player writes roll back when app_state snapshot write fails", async () => {
    // This test runs only against the disposable PostgreSQL service in CI.
    env.NODE_ENV = "production";
    env.DATA_DRIVER = "postgres";

    const client = new pg.Client({
        host: env.MYSQL_HOST,
        port: Number(env.MYSQL_PORT),
        database: env.MYSQL_DATABASE,
        user: env.MYSQL_USER,
        password: env.MYSQL_PASSWORD,
        ssl: env.MYSQL_SSL ? { rejectUnauthorized: false } : false
    });

    let connected = false;
    try {
        await initializeRepository(env);
        await client.connect();
        connected = true;

        const externalId = "guest:atomic_snapshot_write_test";
        const makeState = (level) => ({
            users: {
                [externalId]: {
                    profile: {
                        provider: "guest",
                        providerUid: "atomic_snapshot_write_test",
                        email: "",
                        displayName: "Atomic Write Test"
                    },
                    economy: { gems: 10 },
                    inventory: { test_item: 1 },
                    createdAt: 1000,
                    updatedAt: 2000,
                    v1: {
                        stateVersion: 1,
                        level,
                        power: 100,
                        vipLevel: 0,
                        resources: {
                            gold: 50, wood: 20, steel: 30, food: 40,
                            gems: 10, energy: 80, energyMax: 100,
                            energyRegenPerMinute: 1.2
                        },
                        heroes: [],
                        buildings: [],
                        alliances: { allianceId: "", name: "", tag: "" },
                        pass: { seasonId: "season_1", claimed: {} }
                    }
                }
            },
            receipts: {},
            alliances: {}
        });

        await writeDb(makeState(1));
        const before = await client.query(
            "SELECT level FROM users WHERE external_id = $1",
            [externalId]
        );
        assert.equal(before.rows.length, 1);
        assert.equal(before.rows[0].level, 1);

        await client.query(`
            CREATE OR REPLACE FUNCTION fail_app_state_write_for_test()
            RETURNS trigger AS $$
            BEGIN
                RAISE EXCEPTION 'injected app_state write failure for atomicity test';
            END;
            $$ LANGUAGE plpgsql
        `);
        await client.query("DROP TRIGGER IF EXISTS fail_app_state_write_for_test ON app_state");
        await client.query(`
            CREATE TRIGGER fail_app_state_write_for_test
            BEFORE INSERT OR UPDATE ON app_state
            FOR EACH ROW EXECUTE FUNCTION fail_app_state_write_for_test()
        `);

        await assert.rejects(
            writeDb(makeState(9)),
            /Production PostgreSQL write failed/
        );

        const after = await client.query(
            "SELECT level FROM users WHERE external_id = $1",
            [externalId]
        );
        assert.equal(after.rows.length, 1);
        assert.equal(
            after.rows[0].level,
            1,
            "normalized write must roll back when the snapshot write fails"
        );
    } finally {
        if (connected) {
            await client.query("DROP TRIGGER IF EXISTS fail_app_state_write_for_test ON app_state").catch(() => {});
            await client.query("DROP FUNCTION IF EXISTS fail_app_state_write_for_test()").catch(() => {});
        }
        await closeRepository().catch(() => {});
        if (connected) await client.end().catch(() => {});
    }
});
