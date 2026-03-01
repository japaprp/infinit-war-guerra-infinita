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

            res.on("finish", () => {
                release().catch(() => {});
            });

            return next();
        } catch {
            return next();
        }
    };
}
