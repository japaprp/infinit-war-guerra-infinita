import dotenv from "dotenv";

dotenv.config();

export const env = {
    NODE_ENV: (process.env.NODE_ENV || "development").toLowerCase(),
    PORT: Number(process.env.PORT || 4000),
    GRPC_PORT: Number(process.env.GRPC_PORT || 50051),
    JWT_SECRET: process.env.JWT_SECRET || "unsafe_dev_secret",
    RECEIPT_SECRET: process.env.RECEIPT_SECRET || "unsafe_receipt_secret",
    DATA_DRIVER: (process.env.DATA_DRIVER || "json").toLowerCase(),
    MYSQL_HOST: process.env.MYSQL_HOST || "127.0.0.1",
    MYSQL_PORT: Number(process.env.MYSQL_PORT || 3306),
    MYSQL_DATABASE: process.env.MYSQL_DATABASE || "infinitwar",
    MYSQL_USER: process.env.MYSQL_USER || "root",
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || "",
    MYSQL_SSL: String(process.env.MYSQL_SSL || "false").toLowerCase() === "true",
    CORS_ORIGINS: process.env.CORS_ORIGINS || "",
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
    REDIS_ENABLED: String(process.env.REDIS_ENABLED || "false").toLowerCase() === "true",
    REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379"
};

export function validateRuntimeConfig(config) {
    if (String(config.NODE_ENV || "development").toLowerCase() !== "production") return;

    const problems = [];
    if (!String(config.FIREBASE_PROJECT_ID || "").trim()) {
        problems.push("FIREBASE_PROJECT_ID is required to verify Firebase ID tokens");
    }
    for (const key of ["JWT_SECRET", "RECEIPT_SECRET"]) {
        const value = String(config[key] || "");
        if (value.length < 32 || value === "unsafe_dev_secret" || value === "unsafe_receipt_secret") {
            problems.push(`${key} must be a unique secret with at least 32 characters`);
        }
    }

    if (String(config.JWT_SECRET || "") === String(config.RECEIPT_SECRET || "")) {
        problems.push("JWT_SECRET and RECEIPT_SECRET must be different values");
    }

    if (String(config.DATA_DRIVER || "").toLowerCase() !== "mysql") {
        problems.push("DATA_DRIVER must be mysql for persistent hosted gameplay");
    }

    for (const key of ["MYSQL_HOST", "MYSQL_DATABASE", "MYSQL_USER", "MYSQL_PASSWORD"]) {
        if (!String(config[key] || "").trim()) problems.push(`${key} is required`);
    }
    if (!Number.isInteger(Number(config.MYSQL_PORT)) || Number(config.MYSQL_PORT) < 1 || Number(config.MYSQL_PORT) > 65535) {
        problems.push("MYSQL_PORT must be an integer between 1 and 65535");
    }

    const origins = String(config.CORS_ORIGINS || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
    if (origins.length === 0) {
        problems.push("CORS_ORIGINS must list at least one exact frontend origin");
    }

    for (const origin of origins) {
        try {
            const parsed = new URL(origin);
            const isLocalHttp = parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname);
            if ((parsed.protocol !== "https:" && !isLocalHttp) || parsed.origin !== origin || parsed.username || parsed.password) {
                problems.push(`CORS_ORIGINS entry must be an exact HTTPS origin (HTTP only for local development): ${origin}`);
            }
        } catch {
            problems.push(`CORS_ORIGINS entry is not a valid URL origin: ${origin}`);
        }
    }

    if (problems.length) {
        throw new Error(`Invalid production configuration: ${problems.join("; ")}`);
    }
}
