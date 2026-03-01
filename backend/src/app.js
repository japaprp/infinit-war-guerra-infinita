import express from "express";
import cors from "cors";
import { createLegacyRoutes } from "./routes/legacyRoutes.js";
import { createV1Routes } from "./routes/v1Routes.js";

export function createApp(env, runtime) {
    const app = express();

    app.use(cors());
    app.use(express.json({ limit: "1mb" }));

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
