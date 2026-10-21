import assert from "node:assert/strict";
import test from "node:test";
import { getRepositoryMode, initializeRepository, readDb, writeDb } from "../src/repositories/dbRepository.js";

test("PostgreSQL mode rejects a missing connection URL without selecting JSON", async () => {
    await assert.rejects(
        initializeRepository({ DATA_DRIVER: "postgres", GAME_SUPABASE_DATABASE_URL: "", GAME_SUPABASE_CA_CERT: "" }),
        /GAME_SUPABASE_DATABASE_URL/
    );
    assert.equal(getRepositoryMode(), "postgres-error");
});

test("PostgreSQL mode rejects a non-PostgreSQL URL without selecting JSON", async () => {
    await assert.rejects(
        initializeRepository({ DATA_DRIVER: "postgres", GAME_SUPABASE_DATABASE_URL: "https://example.invalid/db", GAME_SUPABASE_CA_CERT: "" }),
        /postgres:\/\/ or postgresql:\/\//
    );
    assert.equal(getRepositoryMode(), "postgres-error");
});

test("failed PostgreSQL initialization blocks reads and writes instead of falling back to JSON", async () => {
    await assert.rejects(
        initializeRepository({
            DATA_DRIVER: "postgres",
            GAME_SUPABASE_DATABASE_URL: "postgresql://example.invalid/game",
            GAME_SUPABASE_CA_CERT: ""
        }),
        /GAME_SUPABASE_CA_CERT/
    );
    assert.equal(getRepositoryMode(), "postgres-error");
    await assert.rejects(readDb(), /JSON não será usado/);
    await assert.rejects(writeDb({ users: {}, receipts: {}, alliances: {} }), /gravação em JSON bloqueada/);
    assert.equal(getRepositoryMode(), "postgres-error");
});
