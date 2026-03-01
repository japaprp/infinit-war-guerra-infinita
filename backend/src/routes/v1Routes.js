import { Router } from "express";
import { readDb, writeDb } from "../repositories/dbRepository.js";
import { createSessionToken } from "../services/tokenService.js";
import { ensureUser, getUserId, ensureV1State, toPlayerProfile } from "../services/userService.js";
import {
    syncState,
    listHeroes,
    levelUpHero,
    starUpHero,
    ascendHero,
    listBuildings,
    startBuild,
    completeBuild,
    speedUpBuild,
    queryWorldTiles,
    startMarch,
    createRally,
    createAlliance,
    searchAlliances,
    joinAlliance,
    getPowerRanking,
    shopPurchase,
    claimBattlePass,
    getPlayerMe
} from "../services/v1StubService.js";
import { createAuthMiddleware } from "../middlewares/authMiddleware.js";
import { createUserLockMiddleware } from "../middlewares/userLockMiddleware.js";
import { createIdempotencyMiddleware } from "../middlewares/idempotencyMiddleware.js";

function asError(res, result) {
    if (!result || !result.error) return false;
    res.status(result.error.status).json({ code: "BUSINESS_RULE", message: result.error.message });
    return true;
}

export function createV1Routes(env, runtime = {}) {
    const router = Router();
    const authMiddleware = createAuthMiddleware(env.JWT_SECRET);
    const userLock = createUserLockMiddleware({ redisClient: runtime.redisClient, ttlSec: 8 });
    const idempotency = createIdempotencyMiddleware({ redisClient: runtime.redisClient, ttlSec: 300 });

    router.post("/auth/login", async (req, res) => {
        const { provider, idToken, platform, externalId } = req.body || {};
        const resolvedProvider = provider || platform || "guest";
        const resolvedProviderUid = idToken || externalId || "guest";

        const db = await readDb();
        const userId = getUserId(resolvedProvider, resolvedProviderUid);
        const user = ensureUser(db, userId, {
            provider: resolvedProvider,
            providerUid: resolvedProviderUid,
            email: resolvedProvider === "guest" ? "" : `${resolvedProviderUid}@stub.local`,
            displayName: `player_${resolvedProviderUid.slice(0, 6)}`
        });
        ensureV1State(user);

        const token = createSessionToken({ sub: userId, provider: resolvedProvider, providerUid: resolvedProviderUid }, env.JWT_SECRET);
        await writeDb(db);

        res.json({
            accessToken: token,
            refreshToken: token,
            expiresInSec: 7 * 24 * 3600,
            player: toPlayerProfile(userId, user, 1)
        });
    });

    router.use(authMiddleware);

    router.get("/player/me", async (req, res) => {
        const db = await readDb();
        const user = db.users[req.user.sub];
        if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

        res.json(getPlayerMe(req.user.sub, user));
    });

    router.post("/player/sync", async (req, res) => {
        const db = await readDb();
        const user = db.users[req.user.sub];
        if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

        const result = syncState(req.user.sub, user, req.body || {});
        await writeDb(db);
        res.json(result);
    });

    router.get("/heroes", async (req, res) => {
        const db = await readDb();
        const user = db.users[req.user.sub];
        if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

        res.json(listHeroes(user));
    });

    router.post("/heroes/:heroId/level-up", userLock, async (req, res) => {
        const db = await readDb();
        const user = db.users[req.user.sub];
        if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

        const result = levelUpHero(user, req.params.heroId, req.body?.levels || 1);
        if (asError(res, result)) return;

        await writeDb(db);
        res.json(result);
    });

    router.post("/heroes/:heroId/star-up", userLock, async (req, res) => {
        const db = await readDb();
        const user = db.users[req.user.sub];
        if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

        const result = starUpHero(user, req.params.heroId);
        if (asError(res, result)) return;

        await writeDb(db);
        res.json(result);
    });

    router.post("/heroes/:heroId/ascend", userLock, async (req, res) => {
        const db = await readDb();
        const user = db.users[req.user.sub];
        if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

        const result = ascendHero(user, req.params.heroId);
        if (asError(res, result)) return;

        await writeDb(db);
        res.json(result);
    });

    router.get("/buildings", async (req, res) => {
        const db = await readDb();
        const user = db.users[req.user.sub];
        if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

        res.json(listBuildings(user));
    });

    router.post("/buildings/start", userLock, async (req, res) => {
        const { buildingType, slotCode, targetLevel } = req.body || {};
        const db = await readDb();
        const user = db.users[req.user.sub];
        if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

        const result = startBuild(user, buildingType, slotCode, targetLevel);
        if (asError(res, result)) return;

        await writeDb(db);
        res.json(result);
    });

    router.post("/buildings/complete", idempotency, userLock, async (req, res) => {
        const { taskId } = req.body || {};
        const db = await readDb();
        const user = db.users[req.user.sub];
        if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

        const result = completeBuild(user, taskId);
        if (asError(res, result)) return;

        await writeDb(db);
        res.json(result);
    });

    router.post("/buildings/queue/speed-up", userLock, async (req, res) => {
        const { taskId, gemBudgetLimit } = req.body || {};
        const db = await readDb();
        const user = db.users[req.user.sub];
        if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

        const result = speedUpBuild(user, taskId, gemBudgetLimit);
        if (asError(res, result)) return;

        await writeDb(db);
        res.json(result);
    });

    router.get("/world/tiles", async (req, res) => {
        const db = await readDb();
        const user = db.users[req.user.sub];
        if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

        const x = Number(req.query.x || 0);
        const y = Number(req.query.y || 0);
        const radius = Number(req.query.radius || 6);
        res.json(queryWorldTiles(user, x, y, radius));
    });

    router.post("/world/marches/start", userLock, async (req, res) => {
        const db = await readDb();
        const user = db.users[req.user.sub];
        if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

        res.json(startMarch(user, req.body || {}));
    });

    router.post("/world/rallies", userLock, async (req, res) => {
        const joinWindowSec = Number(req.body?.joinWindowSec || 300);
        res.json(createRally(req.user.sub, { joinWindowSec }));
    });

    router.post("/alliances", userLock, async (req, res) => {
        const { name, tag, languageCode = "pt-BR" } = req.body || {};
        if (!name || !tag) return res.status(400).json({ code: "BAD_REQUEST", message: "name and tag are required" });

        const db = await readDb();
        const user = db.users[req.user.sub];
        if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

        const alliance = createAlliance(db, req.user.sub, { name, tag, languageCode });
        ensureV1State(user);
        user.v1.alliances = { allianceId: alliance.allianceId, name, tag };
        await writeDb(db);

        res.json(alliance);
    });

    router.get("/alliances", async (req, res) => {
        const db = await readDb();
        res.json(searchAlliances(db, req.query.q || ""));
    });

    router.post("/alliances/:allianceId/join", userLock, async (req, res) => {
        const db = await readDb();
        const user = db.users[req.user.sub];
        if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

        const result = joinAlliance(db, user, req.params.allianceId);
        if (asError(res, result)) return;

        await writeDb(db);
        res.json(result);
    });

    router.get("/rankings/power", async (req, res) => {
        const db = await readDb();
        const page = Number(req.query.page || 1);
        const pageSize = Number(req.query.pageSize || 50);
        res.json(getPowerRanking(db, page, pageSize));
    });

    router.post("/shop/purchase", idempotency, userLock, async (req, res) => {
        const { sku, quantity, idempotencyKey } = req.body || {};
        if (!sku || !idempotencyKey) {
            return res.status(400).json({ code: "BAD_REQUEST", message: "sku and idempotencyKey are required" });
        }

        const db = await readDb();
        const user = db.users[req.user.sub];
        if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

        const result = shopPurchase(user, { sku, quantity: Number(quantity || 1) });
        if (asError(res, result)) return;

        await writeDb(db);
        res.json(result);
    });

    router.post("/pass/claim", idempotency, userLock, async (req, res) => {
        const { seasonId, tier, premiumTrack } = req.body || {};
        const db = await readDb();
        const user = db.users[req.user.sub];
        if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

        const result = claimBattlePass(user, {
            seasonId: seasonId || "season_1",
            tier: Number(tier || 1),
            premiumTrack: Boolean(premiumTrack)
        });
        if (asError(res, result)) return;

        await writeDb(db);
        res.json(result);
    });

    return router;
}
