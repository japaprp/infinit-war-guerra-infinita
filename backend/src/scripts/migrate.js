import { env } from "../config/env.js";
import { getRepositoryMode, initializeRepository } from "../repositories/dbRepository.js";

async function run() {
    if (String(env.DATA_DRIVER || "").toLowerCase() !== "postgres") {
        throw new Error("Set DATA_DRIVER=postgres before running the PostgreSQL migration.");
    }
    await initializeRepository(env);
    if (getRepositoryMode() !== "postgres") {
        throw new Error("PostgreSQL repository initialization did not complete.");
    }
    console.log("[migrate] PostgreSQL schema and repository initialization completed.");
}

run().catch((error) => {
    console.error("[migrate] failed:", error.message);
    process.exit(1);
});
