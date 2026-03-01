import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.join(__dirname, "..", "..", "..", "docs", "api", "proto", "core_services.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const proto = grpc.loadPackageDefinition(packageDefinition).iwar.core.v1;

function ok(callback, payload) {
    callback(null, payload);
}

const playerService = {
    SyncState: (call, callback) => {
        ok(callback, {
            serverTimeMs: String(Date.now()),
            stateVersion: "1",
            profile: {
                playerId: call.request.auth?.playerId || "stub_player",
                nickname: "stub_player",
                level: 1,
                power: "12000",
                vipLevel: 0,
                realmId: 1,
                resources: {
                    gold: "50000",
                    wood: "40000",
                    steel: "30000",
                    food: "30000",
                    gems: "4200",
                    energy: 120,
                    energyMax: 120
                }
            },
            pendingTimers: []
        });
    }
};

const heroService = {
    ListHeroes: (_call, callback) => ok(callback, { heroes: [] }),
    LevelUpHero: (_call, callback) => ok(callback, { hero: null, resources: null }),
    StarUpHero: (_call, callback) => ok(callback, { hero: null, resources: null }),
    AscendHero: (_call, callback) => ok(callback, { hero: null, resources: null })
};

const buildingService = {
    StartBuild: (_call, callback) => ok(callback, { taskId: "", building: null, resources: null }),
    CompleteBuild: (_call, callback) => ok(callback, { building: null, resources: null }),
    SpeedUpBuild: (_call, callback) => ok(callback, { taskId: "", gemsSpent: 0, completed: true, resources: null })
};

const worldService = {
    QueryTiles: (_call, callback) => ok(callback, { serverTimeMs: String(Date.now()), tiles: [] }),
    StartMarch: (_call, callback) => ok(callback, { marchId: "", departAtMs: String(Date.now()), arriveAtMs: String(Date.now() + 90000) }),
    CreateRally: (_call, callback) => ok(callback, { rallyId: "", leaderPlayerId: "stub_player", closeAtMs: String(Date.now() + 300000) })
};

const allianceService = {
    CreateAlliance: (_call, callback) => ok(callback, { allianceId: "", name: "", tag: "", leaderPlayerId: "", memberCount: 0, power: "0" }),
    SearchAlliances: (_call, callback) => ok(callback, { alliances: [] }),
    JoinAlliance: (_call, callback) => ok(callback, { status: "APPROVED" })
};

const rankingService = {
    QueryPowerRanking: (_call, callback) => ok(callback, { entries: [] })
};

const economyService = {
    Purchase: (_call, callback) => ok(callback, { orderId: "", gemsSpent: 0, grantedItems: [], resources: null }),
    ClaimBattlePassTier: (_call, callback) => ok(callback, { seasonId: "season_1", tier: 1, rewards: [] })
};

const server = new grpc.Server();
server.addService(proto.PlayerService.service, playerService);
server.addService(proto.HeroService.service, heroService);
server.addService(proto.BuildingService.service, buildingService);
server.addService(proto.WorldService.service, worldService);
server.addService(proto.AllianceService.service, allianceService);
server.addService(proto.RankingService.service, rankingService);
server.addService(proto.EconomyService.service, economyService);

server.bindAsync(`0.0.0.0:${env.GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (error) => {
    if (error) {
        console.error("Failed to bind gRPC server", error);
        process.exit(1);
    }

    server.start();
    console.log(`infinit-war-grpc running at 0.0.0.0:${env.GRPC_PORT}`);
});
