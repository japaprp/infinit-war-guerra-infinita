import crypto from "crypto";

const memoryLocks = new Map();

function acquireMemoryLock(key, owner, ttlSec) {
    const current = memoryLocks.get(key);
    const now = Date.now();
    if (current && now < current.expiresAt) return false;
    memoryLocks.set(key, { owner, expiresAt: now + ttlSec * 1000 });
    return true;
}

function renewMemoryLock(key, owner, ttlSec) {
    const current = memoryLocks.get(key);
    if (!current || current.owner !== owner) return false;
    current.expiresAt = Date.now() + ttlSec * 1000;
    return true;
}

function releaseMemoryLock(key, owner) {
    const current = memoryLocks.get(key);
    if (current && current.owner === owner) memoryLocks.delete(key);
}

const RELEASE_IF_OWNER = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
    end
    return 0
`;

const RENEW_IF_OWNER = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("expire", KEYS[1], ARGV[2])
    end
    return 0
`;

function startLockLease({ redisClient, lockKey, owner, ttlSec, renewIntervalMs }) {
    const renew = async () => {
        if (redisClient) {
            await redisClient.eval(RENEW_IF_OWNER, 1, lockKey, owner, String(ttlSec));
        } else {
            renewMemoryLock(lockKey, owner, ttlSec);
        }
    };

    const interval = setInterval(() => {
        renew().catch(() => {
            // Keep the lease fail-closed: do not delete a lock we can no longer verify.
            // If Redis is unavailable, its TTL remains the final recovery mechanism.
        });
    }, renewIntervalMs ?? Math.max(250, Math.floor((ttlSec * 1000) / 3)));
    interval.unref?.();

    let releasePromise = null;
    const release = () => {
        if (releasePromise) return releasePromise;
        clearInterval(interval);
        releasePromise = (async () => {
            try {
                if (redisClient) {
                    await redisClient.eval(RELEASE_IF_OWNER, 1, lockKey, owner);
                } else {
                    releaseMemoryLock(lockKey, owner);
                }
            } catch {
                // Do not issue a non-atomic GET/DEL fallback. TTL is the recovery path.
            }
        })();
        return releasePromise;
    };

    return release;
}

function attachReleaseOnResponse(res, release) {
    let responseStarted = false;
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        responseStarted = true;
        release().finally(() => {
            try { originalJson(body); } catch { /* client may have disconnected */ }
        });
        return res;
    };

    // A normal response without res.json still releases after it is fully sent.
    res.on("finish", () => {
        if (!responseStarted) release().catch(() => {});
    });
    // Intentionally do not release on "close": a disconnected client does not imply
    // that the async handler/database mutation has stopped.
}

export function createUserLockMiddleware({ redisClient, ttlSec = 6, renewIntervalMs } = {}) {
    return async (req, res, next) => {
        if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method) || !req.user?.sub) {
            return next();
        }

        const lockKey = `lock:user:${req.user.sub}`;
        const owner = crypto.randomUUID();
        try {
            const acquired = redisClient
                ? (await redisClient.set(lockKey, owner, "EX", ttlSec, "NX")) === "OK"
                : acquireMemoryLock(lockKey, owner, ttlSec);

            if (!acquired) {
                return res.status(429).json({ code: "LOCKED", message: "Operacao em andamento para este usuario. Tente novamente." });
            }

            attachReleaseOnResponse(res, startLockLease({ redisClient, lockKey, owner, ttlSec, renewIntervalMs }));
            return next();
        } catch {
            // Preserve the existing per-user behavior: this lock is an additional guard.
            return next();
        }
    };
}

/**
 * Snapshot-based repository writes can otherwise overwrite each other's changes
 * when two different users mutate global app state at the same time.
 */
export function createStateWriteLockMiddleware({ redisClient, ttlSec = 30, renewIntervalMs } = {}) {
    return async (req, res, next) => {
        if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();

        const lockKey = "lock:database:write";
        const owner = crypto.randomUUID();
        try {
            const acquired = redisClient
                ? (await redisClient.set(lockKey, owner, "EX", ttlSec, "NX")) === "OK"
                : acquireMemoryLock(lockKey, owner, ttlSec);

            if (!acquired) {
                return res.status(429).json({
                    code: "STATE_WRITE_LOCKED",
                    message: "Outra gravação está em andamento. Tente novamente em instantes."
                });
            }

            attachReleaseOnResponse(res, startLockLease({ redisClient, lockKey, owner, ttlSec, renewIntervalMs }));
            return next();
        } catch {
            // Fail closed for mutating requests; without a confirmed lock, don't write.
            return res.status(503).json({
                code: "STATE_LOCK_UNAVAILABLE",
                message: "Não foi possível confirmar o bloqueio de gravação. Tente novamente."
            });
        }
    };
}
