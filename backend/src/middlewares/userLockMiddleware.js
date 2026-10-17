import crypto from "crypto";

const memoryLocks = new Map();

function acquireMemoryLock(key, owner, ttlSec) {
    const current = memoryLocks.get(key);
    const now = Date.now();

    if (current && now < current.expiresAt) {
        return false;
    }

    memoryLocks.set(key, {
        owner,
        expiresAt: now + ttlSec * 1000
    });
    return true;
}

function releaseMemoryLock(key, owner) {
    const current = memoryLocks.get(key);
    if (current && current.owner === owner) {
        memoryLocks.delete(key);
    }
}

export function createUserLockMiddleware({ redisClient, ttlSec = 6 } = {}) {
    return async (req, res, next) => {
        if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
            return next();
        }

        if (!req.user?.sub) {
            return next();
        }

        const lockKey = `lock:user:${req.user.sub}`;
        const owner = crypto.randomUUID();

        try {
            let acquired = false;
            if (redisClient) {
                const result = await redisClient.set(lockKey, owner, "EX", ttlSec, "NX");
                acquired = result === "OK";
            } else {
                acquired = acquireMemoryLock(lockKey, owner, ttlSec);
            }

            if (!acquired) {
                return res.status(429).json({ code: "LOCKED", message: "Operacao em andamento para este usuario. Tente novamente." });
            }

            const release = async () => {
                try {
                    if (redisClient) {
                        const raw = await redisClient.get(lockKey);
                        if (raw === owner) {
                            await redisClient.del(lockKey);
                        }
                    } else {
                        releaseMemoryLock(lockKey, owner);
                    }
                } catch {
                    // noop
                }
            };

            // "finish" covers normal responses; "close" releases the lock when
            // the client disconnects before the response completes. release() is
            // owner-checked and therefore safe if both events fire.
            const releaseLock = () => {
                release().catch(() => {});
            };
            res.on("finish", releaseLock);
            res.on("close", releaseLock);

            return next();
        } catch {
            return next();
        }
    };
}


/**
 * Snapshot-based repository writes can otherwise overwrite each other's changes
 * when two different users mutate global app state at the same time. Serialize
 * mutating requests until repository writes are transaction-scoped. Redis makes
 * the lock shared between instances; memory mode protects a single process.
 */
export function createStateWriteLockMiddleware({ redisClient, ttlSec = 30 } = {}) {
    return async (req, res, next) => {
        if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();

        const lockKey = "lock:database:write";
        const owner = crypto.randomUUID();
        try {
            let acquired = false;
            if (redisClient) {
                const result = await redisClient.set(lockKey, owner, "EX", ttlSec, "NX");
                acquired = result === "OK";
            } else {
                acquired = acquireMemoryLock(lockKey, owner, ttlSec);
            }

            if (!acquired) {
                return res.status(429).json({
                    code: "STATE_WRITE_LOCKED",
                    message: "Outra gravação está em andamento. Tente novamente em instantes."
                });
            }

            let releasePromise = null;
            const release = () => {
                if (releasePromise) return releasePromise;
                releasePromise = (async () => {
                    try {
                        if (redisClient) {
                            const raw = await redisClient.get(lockKey);
                            if (raw === owner) await redisClient.del(lockKey);
                        } else {
                            releaseMemoryLock(lockKey, owner);
                        }
                    } catch {
                        // TTL is the fallback if the lock store becomes unavailable.
                    }
                })();
                return releasePromise;
            };

            // Release before the JSON response reaches the client. This avoids a
            // fast retry observing a stale lock after the prior request completed.
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                release().finally(() => {
                    try { originalJson(body); } catch { /* client may have disconnected */ }
                });
                return res;
            };
            const releaseLock = () => { release().catch(() => {}); };
            res.on("finish", releaseLock);
            res.on("close", releaseLock);
            return next();
        } catch {
            // Fail closed for mutating requests; allowing writes without the
            // serialization lock would reintroduce lost-update races.
            return res.status(503).json({
                code: "STATE_LOCK_UNAVAILABLE",
                message: "Não foi possível confirmar o bloqueio de gravação. Tente novamente."
            });
        }
    };
}
