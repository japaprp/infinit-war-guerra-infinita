import Redis from "ioredis";

let redisClient = null;

export async function initializeRedis(env) {
    if (!env.REDIS_ENABLED) {
        await closeRedisClient();
        if (String(env.NODE_ENV || "development").toLowerCase() === "production") {
            throw new Error("Production requires shared Redis for cross-instance mutation locks.");
        }
        console.log("[redis] REDIS_ENABLED=false. Cache/lock em memoria local.");
        return null;
    }

    const client = new Redis(env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        // Do not keep retrying forever when Redis is unavailable at startup.
        retryStrategy: () => null
    });

    // ioredis emits connection errors even when connect() rejects. Always
    // attach a listener so a failed optional Redis connection cannot crash tests.
    client.on("error", (error) => {
        if (redisClient === client) {
            console.warn(`[redis] erro de conexão (${error.message}).`);
        }
    });

    redisClient = client;

    try {
        await client.connect();
        await client.ping();
        console.log("[redis] conectado.");
        return client;
    } catch (error) {
        if (redisClient === client) {
            redisClient = null;
        }
        client.disconnect();
        if (String(env.NODE_ENV || "development").toLowerCase() === "production") {
            throw new Error("Production Redis connection failed; refusing unsafe in-memory lock fallback.");
        }
        console.warn(`[redis] Falha ao conectar (${error.message}). Fallback em memoria local.`);
        return null;
    }
}

export async function closeRedisClient(client = redisClient) {
    if (!client) {
        return;
    }

    if (redisClient === client) {
        redisClient = null;
    }

    if (client.status === "end") {
        return;
    }

    if (client.status !== "ready") {
        client.disconnect();
        return;
    }

    await new Promise((resolve) => {
        const timeout = setTimeout(() => {
            client.disconnect();
            resolve();
        }, 1000);

        client.quit().then(
            () => {
                clearTimeout(timeout);
                resolve();
            },
            () => {
                clearTimeout(timeout);
                client.disconnect();
                resolve();
            }
        );
    });
}

export function getRedisClient() {
    return redisClient;
}
