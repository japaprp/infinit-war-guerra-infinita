import assert from "node:assert/strict";
import test from "node:test";
import { getRepositoryMode, initializeRepository } from "../src/repositories/dbRepository.js";

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
