import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationPath = path.join(__dirname, "..", "..", "sql", "001_init.sql");

async function run() {
    const sql = fs.readFileSync(migrationPath, "utf8");

    const connection = await mysql.createConnection({
        host: env.MYSQL_HOST,
        port: env.MYSQL_PORT,
        user: env.MYSQL_USER,
        password: env.MYSQL_PASSWORD,
        multipleStatements: true
    });

    try {
        await connection.query(sql);
        console.log("[migrate] 001_init.sql aplicado com sucesso.");
    } finally {
        await connection.end();
    }
}

run().catch((error) => {
    console.error("[migrate] falha:", error.message);
    process.exit(1);
});
