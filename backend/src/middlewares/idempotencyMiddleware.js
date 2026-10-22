const memoryEntries = new Map();

function canonicalize(value) {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value && typeof value === "object") {
        return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
    }
    return value;
}

function requestFingerprint(req) {
    return JSON.stringify(canonicalize(req.body ?? null));
}

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
        const fingerprint = requestFingerprint(req);

        try {
            let cached = null;
            if (redisClient) {
                const raw = await redisClient.get(key);
                cached = raw ? JSON.parse(raw) : null;
            } else {
                cached = getFromMemory(key);
            }

            if (cached) {
                if (cached.requestFingerprint !== fingerprint) {
                    return res.status(409).json({
                        code: "IDEMPOTENCY_KEY_REUSED",
                        message: "Esta chave de idempotência já foi usada com dados diferentes."
                    });
                }
                return res.status(cached.status).json(cached.body);
            }

            const originalJson = res.json.bind(res);
            res.json = (body) => {
                const payload = {
                    status: res.statusCode || 200,
                    body,
                    requestFingerprint: fingerprint
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
