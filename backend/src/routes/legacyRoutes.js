import { Router } from "express";
import { readDb, writeDb } from "../repositories/dbRepository.js";
import { createSessionToken } from "../services/tokenService.js";
import { createMockReceipt, consumeMockReceipt } from "../services/shopService.js";
import { ensureUser, getUserId, validateLegacyStateShape } from "../services/userService.js";
import { createAuthMiddleware } from "../middlewares/authMiddleware.js";
import { createUserLockMiddleware } from "../middlewares/userLockMiddleware.js";
import { createIdempotencyMiddleware } from "../middlewares/idempotencyMiddleware.js";

export function createLegacyRoutes(env, runtime = {}) {
    const router = Router();
    const authMiddleware = createAuthMiddleware(env.JWT_SECRET);
    const userLock = createUserLockMiddleware({ redisClient: runtime.redisClient, ttlSec: 6 });
    const idempotency = createIdempotencyMiddleware({ redisClient: runtime.redisClient, ttlSec: 300 });

    router.get("/health", async (_req, res) => {
        res.json({
            ok: true,
            service: "infinit-war-backend",
            at: Date.now(),
            repository: runtime.repositoryMode || "json",
            redis: runtime.redisClient ? "on" : "off"
        });
    });

    router.post("/auth/session", async (req, res) => {
        const { provider, providerUid, email = "", displayName = "" } = req.body || {};

        if (!provider || !providerUid) {
            return res.status(400).json({ error: "provider and providerUid are required" });
        }

        const db = await readDb();
        const userId = getUserId(provider, providerUid);
        ensureUser(db, userId, { provider, providerUid, email, displayName });
        await writeDb(db);

        const token = createSessionToken({ sub: userId, provider, providerUid, email }, env.JWT_SECRET);
        return res.json({ token, userId, expiresIn: 7 * 24 * 3600 });
    });

    router.get("/player/state", authMiddleware, async (req, res) => {
        const db = await readDb();
        const user = db.users[req.user.sub];

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.json({ state: user.state, economy: user.economy || { gems: 0 } });
    });

    router.put("/player/state", authMiddleware, userLock, async (req, res) => {
        const { state } = req.body || {};

        if (!validateLegacyStateShape(state)) {
            return res.status(400).json({ error: "Invalid state payload" });
        }

        const serialized = JSON.stringify(state);
        if (serialized.length > 300_000) {
            return res.status(413).json({ error: "State payload too large" });
        }

        const db = await readDb();
        const user = db.users[req.user.sub];
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.state = state;
        user.updatedAt = Date.now();

        if (!user.economy) user.economy = { gems: 4210 };
        if (state.resources && Number.isFinite(state.resources.gems)) {
            state.resources.gems = user.economy.gems;
        }

        await writeDb(db);
        return res.json({ ok: true, updatedAt: user.updatedAt });
    });

    router.post("/shop/mock-receipt", authMiddleware, userLock, async (req, res) => {
        const { heroId, packId, costGems } = req.body || {};

        if (!heroId || !packId || !Number.isFinite(costGems) || costGems <= 0) {
            return res.status(400).json({ error: "Invalid receipt request" });
        }

        const db = await readDb();
        const user = db.users[req.user.sub];
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const receipt = createMockReceipt(db, req.user.sub, { heroId, packId, costGems }, env.RECEIPT_SECRET);
        await writeDb(db);

        return res.json(receipt);
    });

    router.post("/shop/purchase", authMiddleware, idempotency, userLock, async (req, res) => {
        const { receiptId, signature } = req.body || {};

        if (!receiptId || !signature) {
            return res.status(400).json({ error: "Missing receiptId/signature" });
        }

        const db = await readDb();
        const result = consumeMockReceipt(db, req.user.sub, { receiptId, signature }, env.RECEIPT_SECRET);

        if (result.error) {
            return res.status(result.error.status).json({ error: result.error.message });
        }

        await writeDb(db);
        return res.json(result.data);
    });

    return router;
}
