import Redis from "ioredis";

let redisClient = null;

export async function initializeRedis(env) {
    if (!env.REDIS_ENABLED) {
        redisClient = null;
        console.log("[redis] REDIS_ENABLED=false. Cache/lock em memoria local.");
        return null;
    }

    try {
        redisClient = new Redis(env.REDIS_URL, {
            lazyConnect: true,
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false
        });

        await redisClient.connect();
        await redisClient.ping();
        console.log("[redis] conectado.");
        return redisClient;
    } catch (error) {
        console.warn(`[redis] Falha ao conectar (${error.message}). Fallback em memoria local.`);
        redisClient = null;
        return null;
    }
}

export function getRedisClient() {
    return redisClient;
}
