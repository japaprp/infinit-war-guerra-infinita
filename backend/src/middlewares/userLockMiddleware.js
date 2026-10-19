import crypto from "crypto";
import { acquireRepositoryWriteLock, getRepositoryMode } from "../repositories/dbRepository.js";

const memoryLocks = new Map();
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const REDIS_RELEASE_SCRIPT = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
const REDIS_RENEW_SCRIPT = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('expire', KEYS[1], ARGV[2]) else return 0 end";

function acquireMemoryLock(key, owner) {
    if (memoryLocks.has(key)) return false;
    memoryLocks.set(key, owner);
    return true;
}

function releaseMemoryLock(key, owner) {
    if (memoryLocks.get(key) === owner) memoryLocks.delete(key);
}

async function acquireDistributedLock({ redisClient, key, owner, ttlSec }) {
    if (!redisClient) return acquireMemoryLock(key, owner) ? "memory" : null;

    const result = await redisClient.set(key, owner, "EX", ttlSec, "NX");
    if (result !== "OK") return null;

    // Redis is a fallback for non-PostgreSQL modes. Renew the lease while the
    // request is still executing, and always compare owner atomically on release.
    const intervalMs = Math.max(1000, Math.floor((ttlSec * 1000) / 3));
    const renewTimer = setInterval(() => {
        redisClient.eval(REDIS_RENEW_SCRIPT, 1, key, owner, ttlSec).catch(() => {
            // Do not release on renewal failure; keep the request fail-safe.
        });
    }, intervalMs);
    renewTimer.unref?.();
    return { kind: "redis", renewTimer };
}

async function releaseDistributedLock({ redisClient, key, owner, lock }) {
    if (!lock) return;
    if (lock === "memory") {
        releaseMemoryLock(key, owner);
        return;
    }

    clearInterval(lock.renewTimer);
    try {
        await redisClient.eval(REDIS_RELEASE_SCRIPT, 1, key, owner);
    } catch {
        // The lease expires if Redis is unavailable; compare-and-delete prevents
        // this owner from deleting a newer lock.
    }
}

function finishResponseWithRelease(res, release) {
    let releasePromise;
    const releaseOnce = () => {
        if (!releasePromise) releasePromise = Promise.resolve().then(release);
        return releasePromise;
    };

    // A client disconnect does not cancel the async handler or its database write.
    // Keep the lock until the handler attempts its terminal response.
    const originalEnd = res.end.bind(res);
    res.end = (...args) => {
        const result = originalEnd(...args);
        releaseOnce().catch(() => {});
        return result;
    };

    res.once("finish", () => { releaseOnce().catch(() => {}); });
    // "close" is deliberately not a release signal unless the response has ended.
    res.once("close", () => {
        if (res.writableEnded || res.finished) releaseOnce().catch(() => {});
    });
}

async function acquireRequestLock({ req, res, redisClient, key, ttlSec, failCode, failMessage }) {
    const owner = crypto.randomUUID();
    let lock;
    try {
        lock = await acquireDistributedLock({ redisClient, key, owner, ttlSec });
    } catch {
        return res.status(503).json({ code: failCode, message: failMessage });
    }

    if (!lock) {
        return res.status(429).json({ code: failCode, message: failMessage });
    }

    finishResponseWithRelease(res, () => releaseDistributedLock({ redisClient, key, owner, lock }));
    return undefined;
}

export function createUserLockMiddleware({ redisClient, ttlSec = 6 } = {}) {
    return async (req, res, next) => {
        if (!MUTATING_METHODS.has(req.method) || !req.user?.sub) return next();

        // PostgreSQL writes mutate a shared snapshot, so per-user locks are not
        // sufficient. Use the repository-wide advisory lock in persistent mode.
        if (getRepositoryMode() === "postgres") {
            // The app-level state lock already serializes every mutation in PostgreSQL.
            // Acquiring a second session-level advisory lock here would wait on the
            // same lock held by this request and deadlock before the route handler.
            if (req.repositoryWriteLockHeld) return next();

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
            finishResponseWithRelease(res, releaseRepositoryLock);
            return next();
        }

        const result = await acquireRequestLock({
            req, res, redisClient, key: `lock:user:${req.user.sub}`, ttlSec,
            failCode: "LOCKED",
            failMessage: "Operacao em andamento para este usuario. Tente novamente."
        });
        if (result === undefined) return next();
    };
}

/**
 * Serialize all mutating requests because snapshot writes can overwrite changes
 * from another request. PostgreSQL advisory locks coordinate every backend
 * instance and are held until the request reaches its terminal response.
 */
export function createStateWriteLockMiddleware({ redisClient, ttlSec = 30 } = {}) {
    return async (req, res, next) => {
        if (!MUTATING_METHODS.has(req.method)) return next();

        if (getRepositoryMode() === "postgres") {
            let releaseRepositoryLock;
            try {
                releaseRepositoryLock = await acquireRepositoryWriteLock();
            } catch {
                return res.status(503).json({
                    code: "STATE_LOCK_UNAVAILABLE",
                    message: "Não foi possível confirmar o bloqueio de gravação. Tente novamente."
                });
            }
            if (!releaseRepositoryLock) {
                return res.status(503).json({
                    code: "STATE_LOCK_UNAVAILABLE",
                    message: "O bloqueio de persistência não está disponível."
                });
            }
            req.repositoryWriteLockHeld = true;
            finishResponseWithRelease(res, async () => {
                try {
                    await releaseRepositoryLock();
                } finally {
                    delete req.repositoryWriteLockHeld;
                }
            });
            return next();
        }

        const result = await acquireRequestLock({
            req, res, redisClient, key: "lock:database:write", ttlSec,
            failCode: "STATE_WRITE_LOCKED",
            failMessage: "Outra gravação está em andamento. Tente novamente em instantes."
        });
        if (result === undefined) return next();
    };
}
