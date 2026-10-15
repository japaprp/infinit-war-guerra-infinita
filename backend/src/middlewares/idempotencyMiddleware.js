import { createHash, randomUUID } from "node:crypto";

const memoryEntries = new Map();
const RESERVATION_TTL_SEC = 30;

function canonicalize(value) {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.keys(value).sort().map((key) => [key, canonicalize(value[key])])
        );
    }
    return value;
}

function fingerprintRequest(body) {
    return createHash("sha256")
        .update(JSON.stringify(canonicalize(body ?? null)))
        .digest("hex");
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

function deleteOwnedMemoryReservation(key, owner) {
    const row = memoryEntries.get(key);
    if (row?.value?.state === "processing" && row.value.owner === owner) {
        memoryEntries.delete(key);
    }
}

async function readRedisRecord(redisClient, key) {
    const raw = await redisClient.get(key);
    return raw ? JSON.parse(raw) : null;
}

function conflict(res, code, message) {
    return res.status(409).json({ code, message });
}

export function createIdempotencyMiddleware({ redisClient, ttlSec = 300 } = {}) {
    return async (req, res, next) => {
        if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
            return next();
        }

        const idempotencyKey = req.headers["x-idempotency-key"];
        if (!idempotencyKey) return next();

        if (typeof idempotencyKey !== "string" || idempotencyKey.length > 200) {
            return res.status(400).json({
                code: "INVALID_IDEMPOTENCY_KEY",
                message: "A chave de idempotência deve ter até 200 caracteres."
            });
        }

        const userKey = req.user?.sub || req.ip || "anonymous";
        const key = `idemp:${userKey}:${req.method}:${req.path}:${idempotencyKey}`;
        const fingerprint = fingerprintRequest(req.body);
        const owner = randomUUID();
        const reservation = {
            state: "processing",
            owner,
            fingerprint
        };

        try {
            if (redisClient) {
                const result = await redisClient.set(
                    key,
                    JSON.stringify(reservation),
                    "EX",
                    RESERVATION_TTL_SEC,
                    "NX"
                );

                if (result !== "OK") {
                    const existing = await readRedisRecord(redisClient, key);
                    if (!existing) {
                        return res.status(503).json({
                            code: "IDEMPOTENCY_UNAVAILABLE",
                            message: "Não foi possível reservar a chave de idempotência. Tente novamente."
                        });
                    }
                    if (existing.fingerprint !== fingerprint) {
                        return conflict(res, "IDEMPOTENCY_KEY_REUSED", "A chave de idempotência já foi usada com dados diferentes.");
                    }
                    if (existing.state === "completed") {
                        return res.status(existing.status).json(existing.body);
                    }
                    return conflict(res, "IDEMPOTENCY_IN_PROGRESS", "Já existe uma solicitação em andamento com esta chave. Tente novamente.");
                }
            } else {
                const existing = getFromMemory(key)?.value;
                if (existing) {
                    if (existing.fingerprint !== fingerprint) {
                        return conflict(res, "IDEMPOTENCY_KEY_REUSED", "A chave de idempotência já foi usada com dados diferentes.");
                    }
                    if (existing.state === "completed") {
                        return res.status(existing.status).json(existing.body);
                    }
                    return conflict(res, "IDEMPOTENCY_IN_PROGRESS", "Já existe uma solicitação em andamento com esta chave. Tente novamente.");
                }
                setInMemory(key, reservation, RESERVATION_TTL_SEC);
            }
        } catch {
            return res.status(503).json({
                code: "IDEMPOTENCY_UNAVAILABLE",
                message: "O serviço de idempotência está indisponível. Tente novamente."
            });
        }

        const releaseReservation = async () => {
            try {
                if (redisClient) {
                    const existing = await readRedisRecord(redisClient, key);
                    if (existing?.state === "processing" && existing.owner === owner) {
                        await redisClient.del(key);
                    }
                } else {
                    deleteOwnedMemoryReservation(key, owner);
                }
            } catch {
                // A reserva expira automaticamente; nunca apague uma reserva de outra solicitação.
            }
        };

        let cacheWriteFailed = false;
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            const status = res.statusCode || 200;
            if (status < 200 || status >= 300) {
                void releaseReservation();
                return originalJson(body);
            }

            const completed = {
                state: "completed",
                fingerprint,
                status,
                body
            };

            if (!redisClient) {
                setInMemory(key, completed, ttlSec);
                return originalJson(body);
            }

            return redisClient
                .set(key, JSON.stringify(completed), "EX", ttlSec)
                .then(() => originalJson(body))
                .catch(async () => {
                    cacheWriteFailed = true;
                    // Preserve the processing reservation until its short TTL expires.
                    // This prevents a retry from re-running a mutation whose result could not be cached.
                    res.statusCode = 503;
                    return originalJson({
                        code: "IDEMPOTENCY_UNAVAILABLE",
                        message: "Não foi possível confirmar o registro seguro da operação. Tente novamente."
                    });
                });
        };

        res.on("finish", () => {
            if (!cacheWriteFailed && (res.statusCode < 200 || res.statusCode >= 300)) {
                void releaseReservation();
            }
        });

        return next();
    };
}
