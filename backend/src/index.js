import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { getRepositoryMode, initializeRepository } from "./repositories/dbRepository.js";
import { initializeRedis } from "./services/redisService.js";

async function bootstrap() {
    await initializeRepository(env);
    const redisClient = await initializeRedis(env);

    const runtime = {
        repositoryMode: getRepositoryMode(),
        redisClient
    };

    const app = createApp(env, runtime);

    app.listen(env.PORT, () => {
        console.log(`infinit-war-backend running at http://localhost:${env.PORT}`);
        console.log(`[boot] repository=${runtime.repositoryMode}, redis=${redisClient ? "on" : "off"}`);
    });
}

bootstrap().catch((error) => {
    console.error("[boot] Failed to initialize backend", error);
    process.exit(1);
});
