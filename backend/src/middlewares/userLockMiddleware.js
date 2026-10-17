import crypto from "crypto";
import { acquireRepositoryWriteLock, getRepositoryMode } from "../repositories/dbRepository.js";

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

        // PostgreSQL persistence writes a complete shared snapshot. Serialize the
        // entire read-modify-write request across all app instances, not only per user.
        if (getRepositoryMode() === "postgres") {
            let releaseRepositoryLock;
            try {
                releaseRepositoryLock = await acquireRepositoryWriteLock();
            } catch {
                return res.status(503).json({
                    code: "PERSISTENCE_LOCK_UNAVAILABLE",
                    message: "Não foi possível garantir a gravação segura. Tente novamente."
                });
            }

            if (!releaseRepositoryLock) {
                return res.status(503).json({
                    code: "PERSISTENCE_LOCK_UNAVAILABLE",
                    message: "O bloqueio de persistência não está disponível."
                });
            }

            let released = false;
            const releaseOnce = async () => {
                if (released) return;
                released = true;
                await releaseRepositoryLock().catch(() => {});
            };
            // Do not release on "close": a disconnected client does not cancel
            // the async handler or its database write. Releasing here would allow a
            // second writer to enter while the first handler is still running.
            res.once("finish", () => { releaseOnce().catch(() => {}); });
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
                        // Compare-and-delete atomically: GET followed by DEL can delete a
                        // newer owner's lock if the original lease expires between commands.
                        await redisClient.eval(
                            "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
                            1,
                            lockKey,
                            owner
                        );
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
            // Do not bypass a failed lock in production persistence mode.
            if (getRepositoryMode() === "postgres") {
                return res.status(503).json({
                    code: "PERSISTENCE_LOCK_UNAVAILABLE",
                    message: "Não foi possível garantir a gravação segura. Tente novamente."
                });
            }
            return next();
        }
    };
}
