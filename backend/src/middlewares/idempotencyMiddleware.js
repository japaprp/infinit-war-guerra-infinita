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
            res.json = (body) => {
                const payload = {
                    status: res.statusCode || 200,
                    body
                };

                // Cache only successful outcomes. Transient responses such as a lock
                // conflict (429) must not poison retries using the same idempotency key.
                if (payload.status >= 200 && payload.status < 300) {
                    if (redisClient) {
                        redisClient.set(key, JSON.stringify(payload), "EX", ttlSec).catch(() => {});
                    } else {
                        setInMemory(key, payload, ttlSec);
                    }
                }

                return originalJson(body);
            };

            return next();
        } catch {
            return next();
        }
    };
}
