import { createHash } from "node:crypto";

const memoryEntries = new Map();

// Test hook to emulate a fresh Node.js process between integration-test server boots.
export function clearIdempotencyMemoryForTests() {
    memoryEntries.clear();
}

function getFromMemory(key) {
    const row = memoryEntries.get(key);
    if (!row) return null;
    if (Date.now() > row.expiresAt) {
        memoryEntries.delete(key);
        return null;
    }
    return row.value;
}

function setInMemory(key, value, ttlSec) {
    memoryEntries.set(key, {
        value,
        expiresAt: Date.now() + ttlSec * 1000
    });
}

function stableSerialize(value) {
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
    if (value && typeof value === "object") {
        return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
    }
    return JSON.stringify(value ?? null);
}

function fingerprintRequestBody(body) {
    return createHash("sha256").update(stableSerialize(body ?? null)).digest("hex");
}

export function createIdempotencyMiddleware({ redisClient, ttlSec = 300 } = {}) {
    return async (req, res, next) => {
        if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
            return next();
        }

        const idempotencyKey = req.headers["x-idempotency-key"];
        if (!idempotencyKey) {
            return next();
        }

        const userKey = req.user?.sub || req.ip || "anonymous";
        const key = `idemp:${userKey}:${req.method}:${req.path}:${idempotencyKey}`;
        const requestFingerprint = fingerprintRequestBody(req.body);

        try {
            let cached = null;
            if (redisClient) {
                const raw = await redisClient.get(key);
                cached = raw ? JSON.parse(raw) : getFromMemory(key);
            } else {
                cached = getFromMemory(key);
            }

            if (cached) {
                if (cached.requestFingerprint && cached.requestFingerprint !== requestFingerprint) {
                    return res.status(409).json({
                        code: "IDEMPOTENCY_KEY_REUSED",
                        message: "Esta chave de idempotência já foi usada com dados diferentes."
                    });
                }
                return res.status(cached.status).json(cached.body);
            }

            const originalJson = res.json.bind(res);
            let responseJsonCalled = false;
            res.json = (body) => {
                if (responseJsonCalled) return res;
                responseJsonCalled = true;

                const payload = {
                    status: res.statusCode || 200,
                    body,
                    requestFingerprint
                };

                // Transient server failures must remain retryable; caching a 5xx
                // would replay the failure even after persistence recovers.
                if (payload.status >= 500) return originalJson(body);

                if (redisClient) {
                    // Persist the replayable response before ending the HTTP response.
                    // When a state-write lock is held, the next request must not enter
                    // the mutation window before this idempotency record is visible.
                    Promise.resolve()
                        .then(() => redisClient.set(key, JSON.stringify(payload), "EX", ttlSec))
                        .then(
                            () => originalJson(body),
                            () => {
                                // Keep same-process retries safe if Redis fails after
                                // the mutation has already been persisted.
                                setInMemory(key, payload, ttlSec);
                                return originalJson(body);
                            }
                        )
                        .catch(() => {});
                    return res;
                }

                setInMemory(key, payload, ttlSec);
                return originalJson(body);
            };

            return next();
        } catch {
            // If Redis is configured but cannot be read, fail closed before the
            // mutation runs. Bypassing idempotency here could duplicate a purchase
            // or reward while the cache is temporarily unavailable.
            if (redisClient) {
                const localFallback = getFromMemory(key);
                if (localFallback) return res.status(localFallback.status).json(localFallback.body);
                return res.status(503).json({
                    code: "IDEMPOTENCY_UNAVAILABLE",
                    message: "Não foi possível validar a operação com segurança. Tente novamente."
                });
            }
            return next();
        }
    };
}
