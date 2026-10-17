import { Router } from "express";
import { randomUUID } from "node:crypto";
import { readDb, writeDb } from "../repositories/dbRepository.js";
import { createSessionToken } from "../services/tokenService.js";
import { verifyFirebaseIdToken } from "../services/firebaseTokenService.js";
import { createMockReceipt, consumeMockReceipt } from "../services/shopService.js";
import { ensureUser, getUserId, validateLegacyStateShape } from "../services/userService.js";
import { createAuthMiddleware } from "../middlewares/authMiddleware.js";
import { createUserLockMiddleware } from "../middlewares/userLockMiddleware.js";
import { wrapAsyncRouteHandlers } from "../middlewares/asyncRoute.js";
import { createIdempotencyMiddleware } from "../middlewares/idempotencyMiddleware.js";

export function createLegacyRoutes(env, runtime = {}) {
    const router = wrapAsyncRouteHandlers(Router());
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

    router.post("/auth/session", userLock, async (req, res) => {
        const { provider, providerUid, idToken } = req.body || {};
        if (!provider) return res.status(400).json({ error: "provider is required" });

        let identity;
        if (provider === "guest") {
            // Deterministic guest IDs are allowed only in development/test for legacy compatibility.
            const isProduction = String(env.NODE_ENV || "development").toLowerCase() === "production";
            identity = {
                provider: "guest",
                providerUid: isProduction ? randomUUID() : (providerUid || randomUUID()),
                email: "",
                displayName: ""
            };
        } else {
            try {
                const verified = await verifyFirebaseIdToken(idToken, env.FIREBASE_PROJECT_ID);
                identity = {
                    provider: verified.provider,
                    providerUid: verified.uid,
                    email: verified.email,
                    displayName: verified.displayName
                };
            } catch {
                return res.status(401).json({ error: "A valid Firebase ID token is required" });
            }
        }

        const db = await readDb();
        const userId = getUserId(identity.provider, identity.providerUid);
        ensureUser(db, userId, identity);
        await writeDb(db);

        const token = createSessionToken({
            sub: userId,
            provider: identity.provider,
            providerUid: identity.providerUid,
            email: identity.email
        }, env.JWT_SECRET);
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

        if (!user.economy) user.economy = { gems: 0 };
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

    router.post("/shop/purchase", authMiddleware, userLock, idempotency, async (req, res) => {
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
