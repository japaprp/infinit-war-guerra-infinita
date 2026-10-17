import express from "express";
import cors from "cors";
import { createLegacyRoutes } from "./routes/legacyRoutes.js";
import { createV1Routes } from "./routes/v1Routes.js";
import { createStateWriteLockMiddleware } from "./middlewares/userLockMiddleware.js";

export function createApp(env, runtime) {
    const app = express();
    const allowedOrigins = String(env.CORS_ORIGINS || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
    const isProduction = String(env.NODE_ENV || "development").toLowerCase() === "production";

    app.use(cors({
        origin(origin, callback) {
            // Non-browser clients (health checks, CLI, server-to-server) have no Origin header.
            if (!origin) return callback(null, true);

            // Preserve frictionless local development, but never use wildcard CORS in production.
            if (!isProduction && allowedOrigins.length === 0) return callback(null, true);

            return callback(null, allowedOrigins.includes(origin));
        }
    }));
    app.use(express.json({ limit: "1mb" }));
    app.use(createStateWriteLockMiddleware({ redisClient: runtime?.redisClient, ttlSec: 30 }));

    app.use("/", createLegacyRoutes(env, runtime));
    app.use("/v1", createV1Routes(env, runtime));

    app.use((err, _req, res, _next) => {
        const status = err?.status || 500;
        res.status(status).json({
            code: "INTERNAL_ERROR",
            message: err?.message || "Unexpected server error"
        });
    });

    return app;
}
