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

        try {
            let cached = null;
            if (redisClient) {
                const raw = await redisClient.get(key);
                cached = raw ? JSON.parse(raw) : null;
            } else {
                cached = getFromMemory(key);
            }

            if (cached) {
                return res.status(cached.status).json(cached.body);
            }

            const originalJson = res.json.bind(res);
            let responseJsonCalled = false;
            res.json = (body) => {
                if (responseJsonCalled) return res;
                responseJsonCalled = true;

                const payload = {
                    status: res.statusCode || 200,
                    body
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
                return res.status(503).json({
                    code: "IDEMPOTENCY_UNAVAILABLE",
                    message: "Não foi possível validar a operação com segurança. Tente novamente."
                });
            }
            return next();
        }
    };
}
