
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const keys = {};
const pressed = {};
const world = { width: 3600, height: 2400 };
const camera = { x: 0, y: 0 };
const STORAGE_KEY = "iwar_village_state_v1";
const LEGACY_STORAGE_KEY = "gde_village_state_v4";
const ONBOARDING_KEY = "iwar_onboarding_seen_v1";
const LEGACY_ONBOARDING_KEY = "gde_onboarding_seen_v1";
const INITIAL_UNLOCKED = 1;
const PUZZLES_PER_HERO = 10;
const EQUIPMENT_DROP_CHANCE = 0.2;
const CHEST_DROP_CHANCE = 0.1;
const EXPEDITION_DESTINATIONS = [
    { id: "grey-forest", label: "Floresta Cinzenta", region: "Floresta", x: 900, y: 620, rewardMultiplier: 1, objectiveIds: ["explore", "hunt", "gather"] },
    { id: "old-ruins", label: "Ruínas Antigas", region: "Ruínas", x: 2180, y: 900, rewardMultiplier: 1.25, objectiveIds: ["explore", "hunt"] },
    { id: "ash-marsh", label: "Pântano das Cinzas", region: "Pântano", x: 2840, y: 1780, rewardMultiplier: 1.45, objectiveIds: ["hunt", "gather"] }
];
const EXPEDITION_OBJECTIVES = [
    { id: "explore", label: "Explorar região", description: "Mapear trilhas e descobrir recursos", rewardMultiplier: 1 },
    { id: "hunt", label: "Caçar criaturas", description: "Priorizar ameaças e troféus", rewardMultiplier: 1.2 },
    { id: "gather", label: "Coletar suprimentos", description: "Priorizar alimento e materiais", rewardMultiplier: 1.1 }
];
const CHEST_REWARD_TABLE = [
    { id: "resources", label: "Recursos", weight: 0.45 },
    { id: "shards", label: "Fragmentos", weight: 0.25 },
    { id: "equipment", label: "Equipamento", weight: 0.15 },
    { id: "moduleChest", label: "Baú de Módulos", weight: 0.15 }
];
const EQUIPMENT_SLOTS = { weapon: "Arma", armor: "Armadura", boots: "Botas" };
const CHIP_CATALOG = [
    { id: "assault-module", name: "Módulo de Assalto", role: "Guerreiro", stat: "attackPct", statLabel: "Dano de combate", basePct: 32.6, upgradeCopies: 5, rarity: "Épico", color: "#a56bff" },
    { id: "gravity-barrier", name: "Barreira Gravitacional", role: "Guerreiro", stat: "hpPct", statLabel: "Vida e proteção", basePct: 6.8, upgradeCopies: 3, rarity: "Épico", color: "#53c7e8" },
    { id: "recon-array", name: "Matriz de Reconhecimento", role: "Batedor", stat: "attackPct", statLabel: "Dano de combate", basePct: 12, upgradeCopies: 4, rarity: "Raro", color: "#4f9bff" },
    { id: "supply-core", name: "Núcleo de Suprimentos", role: "Suporte", stat: "hpPct", statLabel: "Vida e proteção", basePct: 10, upgradeCopies: 4, rarity: "Raro", color: "#4f9bff" }
];
const CHIP_MAX_LEVEL = 10;
// Hero promotion reference baseline: five internal steps per star tier.
// Values are based on secondary community guides and remain configurable pending direct in-game cost screenshots.
const HERO_STAR_FRAGMENT_COSTS = [
    [1, 1, 2, 3, 3],
    [5, 5, 5, 5, 15],
    [15, 15, 15, 15, 50],
    [50, 50, 50, 50, 100],
    [100, 100, 100, 100, 100]
];
// Prototype chest odds are original design values, not a claim about the reference game's full pool.
// The observed 0.2% orange tier and 30% blue subtotal are retained as research anchors.
const MODULE_CHEST_ODDS = [
    { id: "legendary", label: "Módulo lendário", chance: 0.2 },
    { id: "blue-a", label: "Módulo azul: Assalto", chance: 7.5 },
    { id: "blue-b", label: "Módulo azul: Barreira", chance: 7.5 },
    { id: "blue-c", label: "Módulo azul: Reconhecimento", chance: 7.5 },
    { id: "blue-d", label: "Módulo azul: Suprimentos", chance: 7.5 },
    { id: "purple", label: "Módulo avançado", chance: 30 },
    { id: "materials", label: "Materiais de módulo", chance: 39.8 }
];
const EQUIPMENT_RARITIES = [
    { id: "common", label: "Comum", weight: 0.72, multiplier: 1 },
    { id: "rare", label: "Raro", weight: 0.23, multiplier: 1.6 },
    { id: "epic", label: "Épico", weight: 0.05, multiplier: 2.5 }
];
const AUTH_SESSION_KEY = "iwar_auth_session";
const LEGACY_AUTH_SESSION_KEY = "gde_auth_session";
const ACTION_COOLDOWNS = {
    collect: 350,
    fight: 700,
    buy: 500
};
const ENERGY_REGEN_PER_SECOND = 0.045;
const VERTICAL_SLICE_BUILD_MS = 45000;
const VERTICAL_SLICE_ENERGY_COST = 15;
const AUTO_ACTION_INTERVALS = {
    collect: 1400,
    hunt: 1800
};
const actionCooldowns = {
    collect: 0,
    fight: 0,
    buy: 0
};

const elementConfig = {
    fire: { color: "#ff6a3d", name: "Fogo" },
    water: { color: "#4cb8ff", name: "Agua" },
    earth: { color: "#80b13f", name: "Terra" }
};

const heroTabs = [
    { id: "atributos", label: "Atributos" },
    { id: "habilidade", label: "Habilidade" },
    { id: "ascensao", label: "Ascensao" },
    { id: "modulos", label: "Módulos" }
];

const heroTemplates = [
    { id: "lucas", unlockOrder: 1, tier: "gold", name: "Lucas", icon: "L", weapon: "Sentenca Flamejante", baseStats: { atk: 15440, def: 14304, troops: 503 }, skills: ["Golpe Ardente", "Supressao", "Escudo de Aco"] },
    { id: "kai", unlockOrder: 2, tier: "silver", name: "Kai", icon: "K", weapon: "Laminas Duplas", baseStats: { atk: 12990, def: 11120, troops: 422 }, skills: ["Corte Veloz", "Rastro Sombrio", "Investida"] },
    { id: "megan", unlockOrder: 3, tier: "silver", name: "Megan", icon: "M", weapon: "Martelo Guardiao", baseStats: { atk: 10620, def: 13880, troops: 410 }, skills: ["Barreira", "Protecao", "Selo de Ferro"] },
    { id: "cyrus", unlockOrder: 4, tier: "gold", name: "Cyrus", icon: "C", weapon: "Canhao Tatico", baseStats: { atk: 14100, def: 12200, troops: 460 }, skills: ["Bombardeio", "Mira de Elite", "Pressao"] },
    { id: "quinn", unlockOrder: 5, tier: "bronze", name: "Quinn", icon: "Q", weapon: "Rapieira Celeste", baseStats: { atk: 12030, def: 10950, troops: 390 }, skills: ["Perfurar", "Danca", "Finta"] },
    { id: "corleone", unlockOrder: 6, tier: "gold", name: "Corleone", icon: "R", weapon: "Punho Executor", baseStats: { atk: 16500, def: 12000, troops: 540 }, skills: ["Execucao", "Pressao", "Dominio"] },
    { id: "ivy", unlockOrder: 7, tier: "bronze", name: "Ivy", icon: "I", weapon: "Arco Verde", baseStats: { atk: 9800, def: 10200, troops: 370 }, skills: ["Seta Tripla", "Camuflagem", "Pico Critico"] }
];

function migrateLegacyStorage() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        const legacySave = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacySave) {
            localStorage.setItem(STORAGE_KEY, legacySave);
        }
    }

    if (!localStorage.getItem(ONBOARDING_KEY)) {
        const legacyOnboarding = localStorage.getItem(LEGACY_ONBOARDING_KEY);
        if (legacyOnboarding) {
            localStorage.setItem(ONBOARDING_KEY, legacyOnboarding);
        }
    }

    if (!localStorage.getItem(AUTH_SESSION_KEY)) {
        const legacySession = localStorage.getItem(LEGACY_AUTH_SESSION_KEY);
        if (legacySession) {
            localStorage.setItem(AUTH_SESSION_KEY, legacySession);
        }
    }
}

migrateLegacyStorage();

const nick = localStorage.getItem("playerNick");
const element = localStorage.getItem("playerElement") || "fire";
const selectedElement = elementConfig[element] || elementConfig.fire;
const authRaw = localStorage.getItem(AUTH_SESSION_KEY);
let authSession = null;

try {
    authSession = authRaw ? JSON.parse(authRaw) : null;
} catch {
    authSession = null;
}

if (!nick || !authSession || !authSession.uid) {
    window.location.href = "index.html";
}

const ui = {
    powerValue: document.getElementById("powerValue"),
    goldValue: document.getElementById("goldValue"),
    silverValue: document.getElementById("silverValue"),
    woodValue: document.getElementById("woodValue"),
    foodValue: document.getElementById("foodValue"),
    energyValue: document.getElementById("energyValue"),
    gemValue: document.getElementById("gemValue"),
    bronzeShardValue: document.getElementById("bronzeShardValue"),
    silverShardValue: document.getElementById("silverShardValue"),
    goldShardValue: document.getElementById("goldShardValue"),
    unlockProgressText: document.getElementById("unlockProgressText"),
    missionText: document.getElementById("missionText"),
    vsTimer: document.getElementById("vsTimer"),
    bonusTimer: document.getElementById("bonusTimer"),
    heroPanel: document.getElementById("heroPanel"),
    heroRoster: document.getElementById("heroRoster"),
    squadSlots: document.getElementById("squadSlots"),
    toggleHeroes: document.getElementById("toggleHeroes"),
    closeHeroPanel: document.getElementById("closeHeroPanel"),
    saveSquadBtn: document.getElementById("saveSquadBtn"),
    heroTabsElement: document.getElementById("heroTabs"),
    heroTabContent: document.getElementById("heroTabContent"),
    openShopBtn: document.getElementById("openShopBtn"),
    shopPanel: document.getElementById("shopPanel"),
    closeShopBtn: document.getElementById("closeShopBtn"),
    shopGrid: document.getElementById("shopGrid"),
    systemFeed: document.getElementById("systemFeed"),
    loadingScreen: document.getElementById("loadingScreen"),
    loadingStatusText: document.getElementById("loadingStatusText"),
    loadingBarFill: document.getElementById("loadingBarFill"),
    loadingPercentText: document.getElementById("loadingPercentText"),
    staminaFill: document.getElementById("staminaFill"),
    stateHint: document.getElementById("stateHint"),
    minimapPanel: document.getElementById("minimapPanel"),
    minimapCanvas: document.getElementById("minimapCanvas"),
    quickHealBtn: document.getElementById("quickHealBtn"),
    toggleAutoCollectBtn: document.getElementById("toggleAutoCollectBtn"),
    toggleAutoHuntBtn: document.getElementById("toggleAutoHuntBtn"),
    returnVillageBtn: document.getElementById("returnVillageBtn"),
    pauseBadge: document.getElementById("pauseBadge"),
    interactionHint: document.getElementById("interactionHint"),
    collectHintText: document.getElementById("collectHintText"),
    fightHintText: document.getElementById("fightHintText"),
    toggleMapBtn: document.getElementById("toggleMapBtn"),
    focusMissionBtn: document.getElementById("focusMissionBtn"),
    openHeroesRailBtn: document.getElementById("openHeroesRailBtn"),
    focusPvpBtn: document.getElementById("focusPvpBtn"),
    missionToast: document.querySelector(".mission-toast"),
    verticalSlicePanel: document.getElementById("verticalSlicePanel"),
    verticalSliceStatus: document.getElementById("verticalSliceStatus"),
    verticalSliceSteps: document.getElementById("verticalSliceSteps"),
    sliceStartBuildBtn: document.getElementById("sliceStartBuildBtn"),
    sliceCompleteBuildBtn: document.getElementById("sliceCompleteBuildBtn"),
    sliceFightPveBtn: document.getElementById("sliceFightPveBtn"),
    sliceUpgradeHeroBtn: document.getElementById("sliceUpgradeHeroBtn"),
    sliceClaimRewardBtn: document.getElementById("sliceClaimRewardBtn"),
    expeditionPanel: document.getElementById("expeditionPanel"),
    expeditionStatus: document.getElementById("expeditionStatus"),
    expeditionMapLabel: document.getElementById("expeditionMapLabel"),
    startExpeditionBtn: document.getElementById("startExpeditionBtn"),
    claimExpeditionBtn: document.getElementById("claimExpeditionBtn"),
    expeditionDestination: document.getElementById("expeditionDestination"),
    expeditionObjective: document.getElementById("expeditionObjective"),
    expeditionRewardPreview: document.getElementById("expeditionRewardPreview")
};

const heroDetail = {
    portrait: document.getElementById("heroPortrait"),
    name: document.getElementById("heroName"),
    weapon: document.getElementById("heroWeapon"),
    stats: document.getElementById("heroStats"),
    skills: document.getElementById("heroSkills")
};

const player = new Player(1200, 1000, selectedElement.color, nick || "Jogador");
const PLAYER_BASE_SPEED = player.speed;
const minimapCtx = ui.minimapCanvas ? ui.minimapCanvas.getContext("2d") : null;

const villageBuildings = [
    { x: 920, y: 820, w: 120, h: 90, roof: "#8f4d39", body: "#6f5a4e", level: 30 },
    { x: 1090, y: 840, w: 130, h: 92, roof: "#96533e", body: "#7a6354", level: 30 },
    { x: 1280, y: 860, w: 125, h: 86, roof: "#8a4634", body: "#6a5546", level: 29 },
    { x: 1020, y: 1020, w: 110, h: 82, roof: "#7f3f32", body: "#624d41", level: 28 },
    { x: 1180, y: 1030, w: 140, h: 108, roof: "#9b5c44", body: "#6f5e54", level: 30 },
    { x: 1370, y: 1050, w: 115, h: 84, roof: "#844335", body: "#655246", level: 30 },
    { x: 1140, y: 1220, w: 180, h: 150, roof: "#b4684a", body: "#745d51", level: 30 }
];

const resourceKinds = {
    gold: {
        label: "Ouro",
        color: "#d8b35d",
        value: 4200,
        radius: 17,
        maxLevel: 25,
        gainPerLevel: 0.1,
        respawnBaseMs: 42000,
        respawnJitterMs: 28000,
        respawnPerLevelMs: 7000
    },
    silver: {
        label: "Prata",
        color: "#9aa7be",
        value: 5600,
        radius: 17,
        maxLevel: 30,
        gainPerLevel: 0.09,
        respawnBaseMs: 36000,
        respawnJitterMs: 24000,
        respawnPerLevelMs: 6500
    },
    wood: {
        label: "Madeira",
        color: "#6d4f2f",
        value: 4700,
        radius: 17,
        maxLevel: 28,
        gainPerLevel: 0.08,
        respawnBaseMs: 38000,
        respawnJitterMs: 26000,
        respawnPerLevelMs: 7200
    },
    food: {
        label: "Alimento",
        color: "#81b855",
        value: 210,
        radius: 18,
        maxLevel: 40,
        gainPerLevel: 0.04,
        respawnBaseMs: 60000,
        respawnJitterMs: 35000,
        respawnPerLevelMs: 18000
    }
};

function computeChecksum(payload) {
    const raw = JSON.stringify(payload);
    let hash = 2166136261;
    for (let i = 0; i < raw.length; i += 1) {
        hash ^= raw.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16);
}

function createHeroState(template) {
    return {
        unlocked: template.unlockOrder <= INITIAL_UNLOCKED,
        level: 1,
        stars: 1,
        starStep: 0,
        specificShards: 0,
        equipment: { weapon: 0, armor: 0, boots: 0 },
        equippedChips: { attackPct: null, hpPct: null },
        skillLevels: [1, 1, 1]
    };
}

function createDefaultState() {
    return {
        resources: { gold: 0, silver: 0, wood: 0, food: 0, energy: 100, gems: 0 },
        inventory: { equipment: [], chests: [], chips: [], chipMaterials: 0 },
        vehicleChipLoadouts: window.IWChipLoadouts.createDefaultLoadouts(),
        activeVehicleChipPreset: "I",
        genericShards: { bronze: 0, silver: 0, gold: 0 },
        selectedHeroId: "lucas",
        activeHeroTab: "atributos",
        activeSquadSlot: 0,
        totalPuzzles: 0,
        nextUnlockAt: PUZZLES_PER_HERO,
        squad: ["lucas", null, null, null, null],
        mission: { monsters: 0, monstersTarget: 3 },
        events: {
            vsEndsAt: Date.now() + 8 * 24 * 3600 * 1000 + 3 * 3600 * 1000,
            bonusEndsAt: Date.now() + 25 * 24 * 3600 * 1000 + 10 * 3600 * 1000
        },
        buildings: {
            hq: { level: 1 },
            barracks: { level: 1 }
        },
        buildQueue: [],
        verticalSlice: {
            constructionStarted: false,
            constructionCompleted: false,
            pveWon: false,
            heroUpgraded: false,
            rewardClaimed: false
        },
        expedition: { id: null, active: false, startedAt: null, endsAt: null, rewardClaimed: true, completedCount: 0, destinationId: "grey-forest", objectiveId: "explore", claimedIds: [] },
        heroes: Object.fromEntries(heroTemplates.map((template) => [template.id, createHeroState(template)]))
    };
}

function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();

    try {
        const envelope = JSON.parse(raw);
        if (!envelope || !envelope.payload || !envelope.checksum) {
            throw new Error("Invalid envelope");
        }

        const expectedChecksum = computeChecksum(envelope.payload);
        if (expectedChecksum !== envelope.checksum) {
            throw new Error("Tampered save");
        }

        const parsed = envelope.payload;
        if (parsed.ownerUid && authSession && parsed.ownerUid !== authSession.uid) {
            throw new Error("Save owner mismatch");
        }
        const fallback = createDefaultState();
        const merged = { ...fallback, ...parsed };

        merged.resources = { ...fallback.resources, ...(parsed.resources || {}) };
        merged.genericShards = { ...fallback.genericShards, ...(parsed.genericShards || {}) };
        merged.inventory = {
            equipment: Array.isArray(parsed.inventory?.equipment) ? parsed.inventory.equipment.filter((item) => item && typeof item.id === "string" && EQUIPMENT_SLOTS[item.slot] && Number.isFinite(item.bonus) && item.bonus > 0).slice(0, 500) : [],
            chests: Array.isArray(parsed.inventory?.chests) ? parsed.inventory.chests.slice(0, 100) : [],
            chips: Array.isArray(parsed.inventory?.chips) ? parsed.inventory.chips.filter((item) => item && typeof item.id === "string" && CHIP_CATALOG.some((chip) => chip.id === item.typeId) && Number.isInteger(item.level) && item.level >= 1 && item.level <= CHIP_MAX_LEVEL).slice(0, 500) : [],
            chipMaterials: Number.isFinite(parsed.inventory?.chipMaterials) && parsed.inventory.chipMaterials >= 0 ? Math.floor(parsed.inventory.chipMaterials) : 0
        };
        merged.vehicleChipLoadouts = window.IWChipLoadouts.normalizeLoadouts(
            parsed.vehicleChipLoadouts,
            new Set(merged.inventory.chips.map((chip) => chip.id))
        );
        merged.activeVehicleChipPreset = window.IWChipLoadouts.PRESETS.includes(parsed.activeVehicleChipPreset)
            ? parsed.activeVehicleChipPreset
            : "I";
        merged.events = { ...fallback.events, ...(parsed.events || {}) };
        merged.mission = { ...fallback.mission, ...(parsed.mission || {}) };
        merged.buildings = { ...fallback.buildings, ...(parsed.buildings || {}) };
        merged.verticalSlice = { ...fallback.verticalSlice, ...(parsed.verticalSlice || {}) };
        merged.expedition = { ...fallback.expedition, ...(parsed.expedition || {}) };
        merged.expedition.destinationId = EXPEDITION_DESTINATIONS.some((item) => item.id === merged.expedition.destinationId) ? merged.expedition.destinationId : fallback.expedition.destinationId;
        merged.expedition.objectiveId = EXPEDITION_OBJECTIVES.some((item) => item.id === merged.expedition.objectiveId) ? merged.expedition.objectiveId : fallback.expedition.objectiveId;
        merged.expedition.claimedIds = Array.isArray(merged.expedition.claimedIds) ? [...new Set(merged.expedition.claimedIds.filter((id) => typeof id === "string"))].slice(-200) : [];
        if (merged.expedition.active && (!Number.isFinite(merged.expedition.endsAt) || !merged.expedition.id)) {
            merged.expedition = { ...fallback.expedition, completedCount: Math.max(0, Number(merged.expedition.completedCount) || 0) };
        }
        merged.heroes = { ...fallback.heroes, ...(parsed.heroes || {}) };
        merged.squad = Array.isArray(parsed.squad) ? parsed.squad.slice(0, 5) : fallback.squad;
        merged.buildQueue = Array.isArray(parsed.buildQueue) ? parsed.buildQueue.slice(0, 2) : fallback.buildQueue;

        heroTemplates.forEach((template) => {
            const current = merged.heroes[template.id] || createHeroState(template);
            merged.heroes[template.id] = {
                ...createHeroState(template),
                ...current,
                equipment: { weapon: 0, armor: 0, boots: 0, ...(current.equipment || {}) },
                equippedItems: Object.fromEntries(Object.keys(EQUIPMENT_SLOTS).map((slot) => [slot, current.equippedItems?.[slot] || null])),
                equippedChips: { attackPct: current.equippedChips?.attackPct || null, hpPct: current.equippedChips?.hpPct || null },
                starStep: Number.isInteger(current.starStep) ? clamp(current.starStep, 0, 5) : 0,
                skillLevels: Array.isArray(current.skillLevels) ? current.skillLevels.slice(0, 3) : [1, 1, 1]
            };
        });
        // Discard stale chip references and enforce one owner per physical module.
        const seenEquippedChipIds = new Set();
        heroTemplates.forEach((template) => {
            const hero = merged.heroes[template.id];
            for (const stat of ["attackPct", "hpPct"]) {
                const chipId = hero.equippedChips[stat];
                const chip = merged.inventory.chips.find((item) => item.id === chipId);
                const definition = chip && CHIP_CATALOG.find((item) => item.id === chip.typeId);
                if (!chip || definition?.stat !== stat || seenEquippedChipIds.has(chipId)) {
                    hero.equippedChips[stat] = null;
                    continue;
                }
                seenEquippedChipIds.add(chipId);
            }
        });

        // Clamp de seguranca para reduzir manipulacao simples de save.
        merged.resources.gold = clamp(merged.resources.gold, 0, 9999999999);
        merged.resources.silver = clamp(merged.resources.silver, 0, 9999999999);
        merged.resources.wood = clamp(merged.resources.wood, 0, 9999999999);
        merged.resources.food = clamp(merged.resources.food, 0, 9999999999);
        merged.resources.energy = clamp(merged.resources.energy, 0, 120);
        merged.resources.gems = clamp(merged.resources.gems, 0, 9999999999);

        return merged;
    } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
        return createDefaultState();
    }
}

const state = loadState();
const runtime = {
    resourceNodes: [],
    monsters: [],
    auto: {
        collectEnabled: false,
        huntEnabled: false,
        nextCollectAt: 0,
        nextHuntAt: 0
    },
    sprint: {
        current: 100,
        max: 100,
        minToSprint: 10,
        drainPerSecond: 36,
        regenPerSecond: 22
    },
    energyRegenBuffer: 0,
    paused: false,
    minimapVisible: true
};
let backendSyncTimer = null;
let gameLoopRequestId = null;
let lastTime = performance.now();

function getApiClient() {
    return window.IWARApi || window.GDEApi || null;
}

function saveState() {
    const payload = {
        ...state,
        ownerUid: authSession ? authSession.uid : "",
        lastSavedAt: Date.now()
    };
    const checksum = computeChecksum(payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ payload, checksum }));
    scheduleBackendSync(payload);
}

function scheduleBackendSync(payload) {
    const api = getApiClient();
    if (!api || !api.hasToken || !api.hasToken()) {
        return;
    }

    if (backendSyncTimer) {
        clearTimeout(backendSyncTimer);
    }

    backendSyncTimer = setTimeout(async () => {
        try {
            await api.pushState(payload);
        } catch {
            // offline/back-end down: local save still preserved.
        }
    }, 300);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function distance(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
}

function isActionOnCooldown(actionName) {
    return Date.now() < actionCooldowns[actionName];
}

function setActionCooldown(actionName) {
    actionCooldowns[actionName] = Date.now() + ACTION_COOLDOWNS[actionName];
}

function formatCompact(value) {
    return Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function getHeroTemplate(heroId) {
    return heroTemplates.find((hero) => hero.id === heroId) || heroTemplates[0];
}

function tierLabel(tier) {
    if (tier === "gold") return "Ouro";
    if (tier === "silver") return "Prata";
    return "Bronze";
}
function getHeroRuntime(heroId) {
    const template = getHeroTemplate(heroId);
    const heroState = state.heroes[heroId];
    const ownedItems = Array.isArray(state.inventory?.equipment) ? state.inventory.equipment : [];
    const getEquippedBonus = (slot) => {
        const itemId = heroState.equippedItems?.[slot];
        return itemId ? (ownedItems.find((item) => item.id === itemId)?.bonus || 0) : 0;
    };
    const equipBonusAtk = heroState.equipment.weapon * 64 + getEquippedBonus("weapon");
    const equipBonusDef = heroState.equipment.armor * 57 + getEquippedBonus("armor");
    const equipBonusTroops = heroState.equipment.boots * 2 + getEquippedBonus("boots");
    const skillAtkBonus = heroState.skillLevels.reduce((sum, level) => sum + level * 28, 0);
    const skillDefBonus = heroState.skillLevels.reduce((sum, level) => sum + level * 22, 0);
    const equippedChips = Object.values(heroState.equippedChips || {}).filter(Boolean)
        .map((chipId) => state.inventory.chips.find((chip) => chip.id === chipId))
        .filter(Boolean);
    // Original Guerra Infinita prototype progression only. The reference captures show
    // two before/after values, not a complete level formula; do not present this as verified
    // Dark War: Survival behavior.
    const chipPct = (stat) => equippedChips.reduce((sum, item) => {
        const definition = CHIP_CATALOG.find((chip) => chip.id === item.typeId);
        return sum + (definition?.stat === stat ? definition.basePct + (item.level - 1) * 9.6 : 0);
    }, 0) / 100;
    const starMultiplier = 1 + (heroState.stars - 1) * 0.08 + (heroState.starStep || 0) * 0.01;

    const atk = Math.floor((template.baseStats.atk + equipBonusAtk + skillAtkBonus) * starMultiplier * (1 + chipPct("attackPct")));
    const def = Math.floor((template.baseStats.def + equipBonusDef + skillDefBonus) * starMultiplier);
    const troops = Math.floor((template.baseStats.troops + equipBonusTroops) * starMultiplier * (1 + chipPct("hpPct")));
    const power = atk * 8 + def * 6 + troops * 28 + heroState.level * 3200;
    const skillAverage = heroState.skillLevels.reduce((a, b) => a + b, 0) / 3;

    return { template, heroState, atk, def, troops, power, skillAverage };
}

function getSquadPower() {
    return state.squad.reduce((sum, heroId) => {
        if (!heroId) return sum;
        return sum + getHeroRuntime(heroId).power;
    }, 0);
}

function pushFeed(message) {
    const item = document.createElement("div");
    item.className = "feed-item";
    item.textContent = message;
    ui.systemFeed.prepend(item);

    setTimeout(() => {
        item.classList.add("fade");
        setTimeout(() => item.remove(), 500);
    }, 2800);
}

function waitFrame() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => resolve());
    });
}

function setLoadingProgress(progress, statusText) {
    const safeProgress = clamp(Math.floor(progress), 0, 100);
    if (ui.loadingBarFill) ui.loadingBarFill.style.width = `${safeProgress}%`;
    if (ui.loadingPercentText) ui.loadingPercentText.textContent = `${safeProgress}%`;
    if (ui.loadingStatusText && statusText) ui.loadingStatusText.textContent = statusText;
}

function hideLoadingScreen() {
    if (!ui.loadingScreen) return;
    ui.loadingScreen.classList.add("is-hidden");
    setTimeout(() => {
        if (ui.loadingScreen && ui.loadingScreen.parentNode) {
            ui.loadingScreen.remove();
        }
    }, 420);
}

function updateStaminaHud() {
    if (!ui.staminaFill) return;
    const percent = clamp((runtime.sprint.current / runtime.sprint.max) * 100, 0, 100);
    ui.staminaFill.style.width = `${percent}%`;

    if (percent <= 25) ui.staminaFill.style.background = "linear-gradient(90deg, #ff9d70, #ff6a6a)";
    else ui.staminaFill.style.background = "linear-gradient(90deg, #82d7ff, #4ca6f2)";
}

function getQuickHealCost() {
    const missingLife = Math.max(0, 100 - player.life);
    return Math.ceil(missingLife * 2.1);
}

function updateQuickHealButton() {
    if (!ui.quickHealBtn) return;
    const cost = getQuickHealCost();
    const hasMissingLife = player.life < 100;
    const canAfford = state.resources.food >= cost;

    if (!hasMissingLife) {
        ui.quickHealBtn.textContent = "Cura Rapida [H]";
        ui.quickHealBtn.disabled = true;
        return;
    }

    ui.quickHealBtn.textContent = `Cura Rapida [H] (${cost} alim.)`;
    ui.quickHealBtn.disabled = !canAfford;
}

function updateInteractionHint() {
    if (!ui.interactionHint || !ui.collectHintText || !ui.fightHintText) return;

    const node = getNearestAvailableNode(150);
    if (!node) {
        ui.collectHintText.textContent = "Sem recurso perto";
    } else {
        const nodeDistance = Math.round(distance(node.x, node.y, player.x, player.y));
        const resourceLabel = resourceKinds[node.kind].label;
        const canCollectNow = nodeDistance <= 85;
        ui.collectHintText.textContent = canCollectNow ? `${resourceLabel} pronto` : `${resourceLabel} a ${nodeDistance}m`;
    }

    const monster = getNearestMonster(180);
    if (!monster) {
        ui.fightHintText.textContent = "Sem monstro perto";
    } else {
        const monsterDistance = Math.round(distance(monster.x, monster.y, player.x, player.y));
        const canFightNow = monsterDistance <= 95;
        ui.fightHintText.textContent = canFightNow ? `Monstro Nv.${monster.level} pronto` : `Monstro Nv.${monster.level} a ${monsterDistance}m`;
    }

    ui.interactionHint.classList.toggle("is-warning", player.life <= 28);
}

function renderAutomationButtons() {
    if (ui.toggleAutoCollectBtn) {
        ui.toggleAutoCollectBtn.textContent = `Auto-Coleta: ${runtime.auto.collectEnabled ? "ON" : "OFF"}`;
        ui.toggleAutoCollectBtn.classList.toggle("active", runtime.auto.collectEnabled);
    }
    if (ui.toggleAutoHuntBtn) {
        ui.toggleAutoHuntBtn.textContent = `Auto-Caca: ${runtime.auto.huntEnabled ? "ON" : "OFF"}`;
        ui.toggleAutoHuntBtn.classList.toggle("active", runtime.auto.huntEnabled);
    }

    if (ui.stateHint) {
        const modes = [];
        if (runtime.auto.collectEnabled) modes.push("Auto-Coleta");
        if (runtime.auto.huntEnabled) modes.push("Auto-Caca");
        const suffix = modes.length ? ` | Ativos: ${modes.join(", ")}` : "";
        ui.stateHint.textContent = `Shift: correr | H: cura | M: mapa | P: pausa${suffix}`;
    }
}

function openHeroPanel() {
    ui.heroPanel.classList.add("open");
    ui.heroPanel.setAttribute("aria-hidden", "false");
}

function closeHeroPanel() {
    ui.heroPanel.classList.remove("open");
    ui.heroPanel.setAttribute("aria-hidden", "true");
}

function openShopPanel() {
    ui.shopPanel.classList.add("open");
    ui.shopPanel.setAttribute("aria-hidden", "false");
}

function closeShopPanel() {
    ui.shopPanel.classList.remove("open");
    ui.shopPanel.setAttribute("aria-hidden", "true");
}

function closeTransientPanels() {
    let closedAny = false;
    if (ui.heroPanel.classList.contains("open")) {
        closeHeroPanel();
        closedAny = true;
    }
    if (ui.shopPanel.classList.contains("open")) {
        closeShopPanel();
        closedAny = true;
    }
    return closedAny;
}

function pulseMissionCard() {
    if (!ui.missionToast) return;
    ui.missionToast.classList.remove("pulse");
    void ui.missionToast.offsetWidth;
    ui.missionToast.classList.add("pulse");
    setTimeout(() => {
        if (ui.missionToast) ui.missionToast.classList.remove("pulse");
    }, 650);
}

function showOnboardingIfNeeded() {
    if (localStorage.getItem(ONBOARDING_KEY)) return;
    localStorage.setItem(ONBOARDING_KEY, "1");

    const tips = [
        "Dica: use Shift para correr e H para cura rapida.",
        "Pressione E perto de recursos e F perto de monstros.",
        "Use M para alternar o mapa tatico e P para pausar.",
        "Teste o fluxo Vertical Slice no painel da esquerda."
    ];

    tips.forEach((tip, index) => {
        setTimeout(() => {
            pushFeed(tip);
        }, 700 + index * 1500);
    });
}

function setMinimapVisible(visible, notify = false) {
    runtime.minimapVisible = visible;
    if (!ui.minimapPanel) return;
    ui.minimapPanel.classList.toggle("hidden", !visible);
    ui.minimapPanel.setAttribute("aria-hidden", visible ? "false" : "true");
    if (notify) pushFeed(`Mapa tatico ${visible ? "ativado" : "oculto"}.`);
}

function togglePause() {
    runtime.paused = !runtime.paused;
    player.speed = PLAYER_BASE_SPEED;
    pressed.e = false;
    pressed.f = false;
    if (ui.pauseBadge) ui.pauseBadge.hidden = !runtime.paused;
    pushFeed(runtime.paused ? "Jogo pausado." : "Jogo retomado.");
}

function useQuickHeal() {
    if (player.life >= 100) {
        pushFeed("Vida ja esta cheia.");
        return;
    }

    const foodCost = getQuickHealCost();
    if (state.resources.food < foodCost) {
        pushFeed(`Alimento insuficiente para cura rapida (${foodCost}).`);
        return;
    }

    state.resources.food -= foodCost;
    player.life = 100;
    pushFeed(`Cura rapida ativada: -${foodCost} alimento.`);
    renderAll();
    saveState();
}

function toggleAutoCollect() {
    runtime.auto.collectEnabled = !runtime.auto.collectEnabled;
    runtime.auto.nextCollectAt = Date.now();
    renderAutomationButtons();
    pushFeed(`Auto-Coleta ${runtime.auto.collectEnabled ? "ativada" : "desativada"}.`);
}

function toggleAutoHunt() {
    runtime.auto.huntEnabled = !runtime.auto.huntEnabled;
    runtime.auto.nextHuntAt = Date.now();
    renderAutomationButtons();
    pushFeed(`Auto-Caca ${runtime.auto.huntEnabled ? "ativada" : "desativada"}.`);
}

function returnToVillage() {
    player.x = 1200;
    player.y = 1000;
    player.life = Math.min(100, player.life + 10);
    pushFeed("Retorno para vila central concluido.");
}

function regenerateEnergy(deltaTime) {
    runtime.energyRegenBuffer += ENERGY_REGEN_PER_SECOND * deltaTime;
    if (runtime.energyRegenBuffer < 1) return;

    const gain = Math.floor(runtime.energyRegenBuffer);
    runtime.energyRegenBuffer -= gain;
    state.resources.energy = clamp((state.resources.energy || 0) + gain, 0, 120);
}

function getCurrentBuildTask() {
    return state.buildQueue[0] || null;
}

function refreshBuildQueueState() {
    const task = getCurrentBuildTask();
    if (!task) return;
    if (!task.ready && Date.now() >= task.endAt) task.ready = true;
}

function startVerticalSliceConstruction() {
    if (getCurrentBuildTask()) {
        pushFeed("Ja existe construcao ativa na fila.");
        return;
    }

    const woodCost = 12000;
    const steelCost = 9000;
    if (state.resources.wood < woodCost || state.resources.silver < steelCost) {
        pushFeed("Recursos insuficientes para iniciar construcao.");
        return;
    }

    const targetLevel = (state.buildings?.barracks?.level || 1) + 1;
    state.resources.wood -= woodCost;
    state.resources.silver -= steelCost;
    state.buildQueue.push({
        id: `build_${Date.now()}`,
        type: "barracks",
        startAt: Date.now(),
        endAt: Date.now() + VERTICAL_SLICE_BUILD_MS,
        ready: false,
        targetLevel
    });

    state.verticalSlice.constructionStarted = true;
    pushFeed(`Construcao do Quartel iniciada. ETA ${formatTimer(VERTICAL_SLICE_BUILD_MS)}.`);
    renderAll();
    saveState();
}

function completeVerticalSliceConstruction() {
    const task = getCurrentBuildTask();
    if (!task) {
        pushFeed("Nenhuma construcao ativa.");
        return;
    }

    if (Date.now() < task.endAt) {
        pushFeed(`Construcao em andamento: ${formatTimer(task.endAt - Date.now())}.`);
        return;
    }

    state.buildings.barracks.level = task.targetLevel;
    state.buildQueue.shift();
    state.verticalSlice.constructionCompleted = true;
    pushFeed(`Quartel concluido para Nv.${state.buildings.barracks.level}.`);
    renderAll();
    saveState();
}

function fightVerticalSlicePve() {
    if (!state.verticalSlice.constructionCompleted) {
        pushFeed("Conclua a construcao primeiro.");
        return;
    }

    if (state.resources.energy < VERTICAL_SLICE_ENERGY_COST) {
        pushFeed(`Energia insuficiente (${state.resources.energy}/${VERTICAL_SLICE_ENERGY_COST}).`);
        return;
    }

    state.resources.energy -= VERTICAL_SLICE_ENERGY_COST;
    const hero = getHeroRuntime(state.selectedHeroId);
    const powerFactor = hero.power / 210000;
    const winChance = clamp(0.48 + powerFactor * 0.35, 0.48, 0.87);
    const win = Math.random() < winChance;

    if (!win) {
        player.life = Math.max(0, player.life - 14);
        pushFeed("PvE falhou. Reorganize tropas e tente novamente.");
        renderAll();
        saveState();
        return;
    }

    const goldReward = 5000 + Math.floor(Math.random() * 2400);
    const foodReward = 80 + Math.floor(Math.random() * 40);
    state.resources.gold += goldReward;
    state.resources.food += foodReward;
    addPuzzleReward("bronze", 1);
    state.verticalSlice.pveWon = true;

    pushFeed(`PvE vencido: +${goldReward} ouro, +${foodReward} alimento.`);
    renderAll();
    saveState();
}

function performVerticalSliceHeroUpgrade() {
    if (!state.verticalSlice.pveWon) {
        pushFeed("Derrote o PvE da vertical slice antes.");
        return;
    }
    const before = state.heroes[state.selectedHeroId].level;
    levelUpHero();
    const after = state.heroes[state.selectedHeroId].level;
    if (after === before) {
        pushFeed("Nao foi possivel evoluir o heroi agora.");
    }
}

function claimVerticalSliceReward() {
    const flowDone = state.verticalSlice.constructionCompleted && state.verticalSlice.pveWon && state.verticalSlice.heroUpgraded;
    if (!flowDone) {
        pushFeed("Complete todos os passos da vertical slice.");
        return;
    }
    if (state.verticalSlice.rewardClaimed) {
        pushFeed("Recompensa da vertical slice ja recebida.");
        return;
    }

    state.verticalSlice.rewardClaimed = true;
    state.resources.gems += 120;
    state.genericShards.silver += 2;
    pushFeed("Vertical Slice concluida: +120 gemas e +2 QB prata.");
    renderAll();
    saveState();
}

function getVerticalSliceStatusLine() {
    const totalDone = [
        state.verticalSlice.constructionStarted,
        state.verticalSlice.constructionCompleted,
        state.verticalSlice.pveWon,
        state.verticalSlice.heroUpgraded
    ].filter(Boolean).length;

    const task = getCurrentBuildTask();
    if (!state.verticalSlice.constructionStarted) return "Passo 1/4: iniciar construcao do quartel.";
    if (!state.verticalSlice.constructionCompleted && task) return `Passo 2/4: aguarde a construcao (${formatTimer(task.endAt - Date.now())}).`;
    if (!state.verticalSlice.pveWon) return "Passo 3/4: derrote um inimigo PvE da vertical slice.";
    if (!state.verticalSlice.heroUpgraded) return "Passo 4/4: evolua o heroi selecionado.";
    if (!state.verticalSlice.rewardClaimed) return "Fluxo completo. Reivindique a recompensa final.";
    return `Vertical Slice concluida (${totalDone}/4).`;
}

function renderVerticalSlicePanel() {
    if (!ui.verticalSlicePanel || !ui.verticalSliceStatus || !ui.verticalSliceSteps) return;

    const task = getCurrentBuildTask();
    const steps = [
        { label: "Construcao iniciada", done: state.verticalSlice.constructionStarted },
        { label: "Construcao concluida", done: state.verticalSlice.constructionCompleted },
        { label: "Batalha PvE vencida", done: state.verticalSlice.pveWon },
        { label: "Heroi evoluido", done: state.verticalSlice.heroUpgraded }
    ];

    ui.verticalSliceStatus.textContent = getVerticalSliceStatusLine();
    ui.verticalSliceSteps.innerHTML = steps
        .map((step) => `<div class="slice-step ${step.done ? "done" : ""}">${step.done ? "OK" : "..." } ${step.label}</div>`)
        .join("");

    if (task && !task.ready) {
        ui.sliceCompleteBuildBtn.textContent = `2) Concluir construcao (${formatTimer(task.endAt - Date.now())})`;
    } else {
        ui.sliceCompleteBuildBtn.textContent = "2) Concluir construcao";
    }

    ui.sliceStartBuildBtn.disabled = Boolean(task) || state.verticalSlice.constructionStarted;
    ui.sliceCompleteBuildBtn.disabled = !task || Date.now() < task.endAt;
    ui.sliceFightPveBtn.disabled = !state.verticalSlice.constructionCompleted;
    ui.sliceUpgradeHeroBtn.disabled = !state.verticalSlice.pveWon;
    ui.sliceClaimRewardBtn.disabled = !(
        state.verticalSlice.constructionCompleted &&
        state.verticalSlice.pveWon &&
        state.verticalSlice.heroUpgraded &&
        !state.verticalSlice.rewardClaimed
    );
}

function getAllowedGenericPools(tier) {
    if (tier === "gold") return ["gold"];
    if (tier === "silver") return ["silver", "gold"];
    return ["bronze", "silver", "gold"];
}

function checkHeroUnlocks() {
    while (state.totalPuzzles >= state.nextUnlockAt) {
        const nextHero = heroTemplates
            .filter((hero) => !state.heroes[hero.id].unlocked)
            .sort((a, b) => a.unlockOrder - b.unlockOrder)[0];
        if (!nextHero) break;

        state.heroes[nextHero.id].unlocked = true;
        state.nextUnlockAt += PUZZLES_PER_HERO;
        pushFeed(`Novo heroi desbloqueado: ${nextHero.name}`);
    }
}

function addPuzzleReward(type, amount, heroId = state.selectedHeroId) {
    if (type === "specific") {
        state.heroes[heroId].specificShards += amount;
        pushFeed(`+${amount} QB de arma para ${getHeroTemplate(heroId).name}`);
    } else {
        state.genericShards[type] += amount;
        pushFeed(`+${amount} QB ${tierLabel(type).toLowerCase()}`);
    }
    state.totalPuzzles += amount;
    checkHeroUnlocks();
    renderAll();
    saveState();
}

function setSelectedHero(heroId) {
    if (!state.heroes[heroId]) return;
    state.selectedHeroId = heroId;
    renderAll();
    saveState();
}

function assignHeroToSquad(heroId) {
    const heroState = state.heroes[heroId];
    if (!heroState || !heroState.unlocked) return;

    const slotIndex = state.activeSquadSlot;
    const previousIndex = state.squad.findIndex((slot) => slot === heroId);
    if (previousIndex >= 0 && previousIndex !== slotIndex) {
        state.squad[previousIndex] = state.squad[slotIndex];
    }
    state.squad[slotIndex] = heroId;
    pushFeed(`${getHeroTemplate(heroId).name} no esquadrao ${slotIndex + 1}`);
    renderAll();
    saveState();
}

function upgradeEquipment(slot) {
    const hero = getHeroRuntime(state.selectedHeroId);
    const currentLevel = hero.heroState.equipment[slot];
    const woodCost = 2000 * currentLevel;
    const silverCost = 1700 * currentLevel;
    if (state.resources.wood < woodCost || state.resources.silver < silverCost) {
        pushFeed("Recursos insuficientes para equipamento.");
        return;
    }
    state.resources.wood -= woodCost;
    state.resources.silver -= silverCost;
    hero.heroState.equipment[slot] += 1;
    pushFeed(`Equipamento ${slot} Nv.${hero.heroState.equipment[slot]}`);
    renderAll();
    saveState();
}

function equipInventoryItem(itemId) {
    const item = state.inventory.equipment.find((entry) => entry.id === itemId);
    if (!item || !EQUIPMENT_SLOTS[item.slot]) {
        pushFeed("Equipamento não encontrado no inventário.");
        return;
    }
    const hero = state.heroes[state.selectedHeroId];
    if (!hero?.unlocked) return;
    hero.equippedItems = { ...(hero.equippedItems || {}), [item.slot]: item.id };
    pushFeed(`${item.name} equipado em ${getHeroTemplate(state.selectedHeroId).name}.`);
    renderAll();
    saveState();
}

function createEquipmentItem(monsterLevel) {
    const roll = Math.random();
    let cumulative = 0;
    const rarity = EQUIPMENT_RARITIES.find((entry) => {
        cumulative += entry.weight;
        return roll < cumulative;
    }) || EQUIPMENT_RARITIES[0];
    const slots = Object.keys(EQUIPMENT_SLOTS);
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const baseBonus = Math.max(1, Math.floor((5 + monsterLevel * 0.6) * rarity.multiplier));
    const names = { weapon: "Lâmina", armor: "Couraça", boots: "Grevas" };
    return {
        id: `gear-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        slot,
        rarity: rarity.id,
        rarityLabel: rarity.label,
        name: `${names[slot]} ${rarity.label}`,
        bonus: baseBonus,
        obtainedAt: Date.now()
    };
}

function rollEquipmentDrop(monsterLevel) {
    return Math.random() < EQUIPMENT_DROP_CHANCE ? createEquipmentItem(monsterLevel) : null;
}

function rollChestReward() {
    const roll = Math.random();
    let cumulative = 0;
    return CHEST_REWARD_TABLE.find((entry) => {
        cumulative += entry.weight;
        return roll < cumulative;
    }) || CHEST_REWARD_TABLE[0];
}

function createChip(typeId, level = 1, rarityLabel = "") {
    const definition = CHIP_CATALOG.find((chip) => chip.id === typeId);
    if (!definition) return null;
    return {
        id: `chip-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        typeId,
        name: definition.name,
        role: definition.role,
        level: Math.max(1, Math.min(CHIP_MAX_LEVEL, Math.floor(level))),
        rarityLabel: rarityLabel || definition.rarity,
        obtainedAt: Date.now()
    };
}

function rollModuleChestReward() {
    const roll = Math.random() * 100;
    let cumulative = 0;
    return MODULE_CHEST_ODDS.find((entry) => {
        cumulative += entry.chance;
        return roll < cumulative;
    }) || MODULE_CHEST_ODDS[MODULE_CHEST_ODDS.length - 1];
}

function equipChip(chipId) {
    const chip = state.inventory.chips.find((item) => item.id === chipId);
    const definition = chip && CHIP_CATALOG.find((item) => item.id === chip.typeId);
    if (!chip || !definition) {
        pushFeed("Módulo não encontrado no inventário.");
        return;
    }
    if (window.IWChipLoadouts.PRESETS.some((preset) => window.IWChipLoadouts.isChipInPreset(state.vehicleChipLoadouts, preset, chipId))) {
        pushFeed("Este módulo está salvo em uma configuração de viatura. Remova-o das configurações antes de equipá-lo no herói.");
        return;
    }
    const hero = state.heroes[state.selectedHeroId];
    if (!hero?.unlocked) return;
    // A physical module may only be equipped by one hero at a time.
    Object.values(state.heroes).forEach((candidate) => {
        if (candidate.equippedChips?.[definition.stat] === chip.id) {
            candidate.equippedChips = { ...candidate.equippedChips, [definition.stat]: null };
        }
        for (const stat of ["attackPct", "hpPct"]) {
            if (stat !== definition.stat && candidate.equippedChips?.[stat] === chip.id) {
                candidate.equippedChips = { ...candidate.equippedChips, [stat]: null };
            }
        }
    });
    hero.equippedChips = { ...(hero.equippedChips || {}), [definition.stat]: chip.id };
    pushFeed(`${chip.name} equipado em ${getHeroTemplate(state.selectedHeroId).name} (+${(definition.basePct + (chip.level - 1) * 9.6).toLocaleString("pt-BR")}%).`);
    renderAll();
    saveState();
}

function isChipEquipped(chipId) {
    const equippedByHero = Object.values(state.heroes || {}).some((hero) =>
        Object.values(hero.equippedChips || {}).includes(chipId)
    );
    const savedInVehiclePreset = window.IWChipLoadouts.PRESETS.some((preset) =>
        window.IWChipLoadouts.isChipInPreset(state.vehicleChipLoadouts, preset, chipId)
    );
    return equippedByHero || savedInVehiclePreset;
}

function selectVehicleChipPreset(preset) {
    if (!window.IWChipLoadouts.PRESETS.includes(preset)) return;
    state.activeVehicleChipPreset = preset;
    renderTabContent();
    saveState();
}

function assignVehicleChip(chipId) {
    const chip = state.inventory.chips.find((item) => item.id === chipId);
    if (!chip) {
        pushFeed("Módulo não encontrado no inventário.");
        return;
    }
    const preset = state.activeVehicleChipPreset;
    const current = state.vehicleChipLoadouts[preset];
    const slot = window.IWChipLoadouts.SLOTS.find((candidate) => !current[candidate.id]);
    if (!slot) {
        pushFeed("Esta configuração já tem quatro módulos. Remova um antes de substituir.");
        return;
    }
    const result = window.IWChipLoadouts.assignChip(
        state.vehicleChipLoadouts,
        preset,
        slot.id,
        chipId,
        new Set(state.inventory.chips.map((item) => item.id))
    );
    if (!result.ok) {
        pushFeed(result.reason === "duplicate-in-preset"
            ? "Este módulo já está em outro espaço desta configuração."
            : "Não foi possível equipar o módulo.");
        return;
    }
    Object.values(state.heroes).forEach((hero) => {
        for (const stat of ["attackPct", "hpPct"]) {
            if (hero.equippedChips?.[stat] === chipId) hero.equippedChips[stat] = null;
        }
    });
    state.vehicleChipLoadouts = result.loadouts;
    pushFeed(`${chip.name} instalado na configuração ${preset}, espaço ${slot.label}.`);
    renderAll();
    saveState();
}

function removeVehicleChip(slotId) {
    const result = window.IWChipLoadouts.clearSlot(
        state.vehicleChipLoadouts,
        state.activeVehicleChipPreset,
        slotId,
        new Set(state.inventory.chips.map((item) => item.id))
    );
    if (!result.ok) return;
    state.vehicleChipLoadouts = result.loadouts;
    pushFeed("Módulo removido da configuração de viatura.");
    renderAll();
    saveState();
}

function upgradeChip(chipId) {
    const chip = state.inventory.chips.find((item) => item.id === chipId);
    const definition = chip && CHIP_CATALOG.find((item) => item.id === chip.typeId);
    if (!chip || !definition) {
        pushFeed("Módulo não encontrado no inventário.");
        return;
    }
    if (chip.level >= CHIP_MAX_LEVEL) {
        pushFeed("Este módulo já atingiu o nível máximo.");
        return;
    }
    // Módulos equipados em qualquer herói não podem ser consumidos como cópias.
    const duplicates = state.inventory.chips.filter((item) =>
        item.typeId === chip.typeId && item.id !== chip.id && !isChipEquipped(item.id)
    );
    if (duplicates.length < definition.upgradeCopies) {
        pushFeed(`Evolução exige ${definition.upgradeCopies} cópias adicionais não equipadas. Disponíveis: ${duplicates.length}.`);
        return;
    }
    const consumeIds = new Set(duplicates.slice(0, definition.upgradeCopies).map((item) => item.id));
    state.inventory.chips = state.inventory.chips.filter((item) => !consumeIds.has(item.id));
    chip.level += 1;
    pushFeed(`${chip.name} evoluiu para Nv.${chip.level}. Bônus atual: +${(definition.basePct + (chip.level - 1) * 9.6).toLocaleString("pt-BR")}%.`);
    renderAll();
    saveState();
}

function openInventoryChest(chestId) {
    const chestIndex = state.inventory.chests.findIndex((chest) => chest.id === chestId);
    if (chestIndex < 0) {
        pushFeed("Baú não encontrado no inventário.");
        return;
    }
    const [chest] = state.inventory.chests.splice(chestIndex, 1);
    if (chest.type === "module") {
        const result = rollModuleChestReward();
        if (result.id === "materials") {
            const amount = 20 + Math.floor(Math.random() * 41);
            state.inventory.chipMaterials = (state.inventory.chipMaterials || 0) + amount;
            pushFeed(`Baú de Módulos: +${amount} materiais de módulo.`);
        } else {
            const mapping = {
                legendary: ["assault-module", 5, "Lendário"],
                "blue-a": ["assault-module", 1, "Raro"],
                "blue-b": ["gravity-barrier", 1, "Raro"],
                "blue-c": ["recon-array", 1, "Raro"],
                "blue-d": ["supply-core", 1, "Raro"],
                purple: [[ "assault-module", "gravity-barrier" ][Math.floor(Math.random() * 2)], 2, "Épico"]
            };
            const [typeId, level, rarity] = mapping[result.id];
            const item = createChip(typeId, level, rarity);
            if (item) {
                state.inventory.chips.push(item);
                pushFeed(`Baú de Módulos: ${item.name} Nv.${item.level} (${rarity}).`);
            }
        }
        renderAll();
        saveState();
        return;
    }
    const reward = rollChestReward();
    if (reward.id === "resources") {
        const gold = 250 + Math.floor(Math.random() * 751);
        const silver = 200 + Math.floor(Math.random() * 601);
        const food = 40 + Math.floor(Math.random() * 81);
        state.resources.gold += gold;
        state.resources.silver += silver;
        state.resources.food += food;
        pushFeed(`Baú aberto: +${gold} ouro, +${silver} prata e +${food} alimento.`);
    } else if (reward.id === "shards") {
        const pool = ["bronze", "silver", "gold"][Math.floor(Math.random() * 3)];
        const amount = pool === "bronze" ? 3 : pool === "silver" ? 2 : 1;
        state.genericShards[pool] += amount;
        state.totalPuzzles += amount;
        checkHeroUnlocks();
        pushFeed(`Baú aberto: +${amount} fragmento(s) ${tierLabel(pool).toLowerCase()}.`);
    } else if (reward.id === "moduleChest") {
        const moduleChest = { id: `module-chest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type: "module", name: "Baú de Módulos" };
        state.inventory.chests.push(moduleChest);
        pushFeed("Baú aberto: você encontrou um Baú de Módulos. As probabilidades estão listadas na aba Módulos.");
    } else {
        const item = createEquipmentItem(8);
        state.inventory.equipment.push(item);
        pushFeed(`Baú aberto: ${item.name} (+${item.bonus}).`);
    }
    renderAll();
    saveState();
}

function upgradeSkill(skillIndex) {
    const hero = getHeroRuntime(state.selectedHeroId);
    const currentLevel = hero.heroState.skillLevels[skillIndex];
    if (currentLevel >= 100) {
        pushFeed("Habilidade ja esta no nivel maximo (100).");
        return;
    }
    const silverCost = 1300 * currentLevel;
    const requiredPool = hero.template.tier;
    if (state.resources.silver < silverCost) {
        pushFeed("Prata insuficiente para habilidade.");
        return;
    }
    if (state.genericShards[requiredPool] < 1) {
        pushFeed(`Precisa de 1 QB ${tierLabel(requiredPool)} para evoluir habilidade.`);
        return;
    }
    state.resources.silver -= silverCost;
    state.genericShards[requiredPool] -= 1;
    hero.heroState.skillLevels[skillIndex] += 1;
    pushFeed(`Habilidade ${skillIndex + 1} Nv.${hero.heroState.skillLevels[skillIndex]}`);
    renderAll();
    saveState();
}

function levelUpHero() {
    const hero = getHeroRuntime(state.selectedHeroId);
    const level = hero.heroState.level;
    if (level >= 100) {
        pushFeed("Heroi ja esta no nivel maximo (100).");
        return;
    }
    const foodCost = 120 + level * 25;
    const goldCost = 500 + level * 180;
    if (state.resources.food < foodCost || state.resources.gold < goldCost) {
        pushFeed("Falta alimento ou ouro para evoluir nivel.");
        return;
    }
    state.resources.food -= foodCost;
    state.resources.gold -= goldCost;
    hero.heroState.level += 1;
    if (state.verticalSlice.pveWon && !state.verticalSlice.heroUpgraded) {
        state.verticalSlice.heroUpgraded = true;
    }
    pushFeed(`${hero.template.name} subiu para nivel ${hero.heroState.level}`);
    renderAll();
    saveState();
}

function getHeroStarPromotionCost(heroState) {
    if (heroState.stars >= 5 && heroState.starStep >= 5) return null;
    const tierIndex = clamp(heroState.stars - 1, 0, HERO_STAR_FRAGMENT_COSTS.length - 1);
    const stepIndex = clamp(heroState.starStep || 0, 0, 4);
    return HERO_STAR_FRAGMENT_COSTS[tierIndex][stepIndex];
}

function ascendHero() {
    const hero = getHeroRuntime(state.selectedHeroId);
    const heroState = hero.heroState;
    const needed = getHeroStarPromotionCost(heroState);
    if (needed === null) {
        pushFeed("Herói no máximo de estrelas.");
        return;
    }
    let available = heroState.specificShards;
    const pools = getAllowedGenericPools(hero.template.tier);
    pools.forEach((pool) => {
        available += state.genericShards[pool];
    });
    if (available < needed) {
        pushFeed(`Fragmentos insuficientes: ${available}/${needed}.`);
        return;
    }

    let remaining = needed;
    const fromSpecific = Math.min(heroState.specificShards, remaining);
    heroState.specificShards -= fromSpecific;
    remaining -= fromSpecific;
    for (const pool of pools) {
        if (remaining <= 0) break;
        const used = Math.min(state.genericShards[pool], remaining);
        state.genericShards[pool] -= used;
        remaining -= used;
    }

    if (heroState.stars === 5 && heroState.starStep === 4) {
        heroState.starStep = 5;
    } else {
        heroState.starStep = (heroState.starStep || 0) + 1;
        if (heroState.starStep >= 5) {
            heroState.stars += 1;
            heroState.starStep = 0;
        }
    }
    const progress = heroState.starStep === 5 ? "5/5 · máximo" : `${heroState.starStep}/5 etapas da estrela atual`;
    pushFeed(`${hero.template.name}: ${heroState.stars}★ · ${progress}.`);
    renderAll();
    saveState();
}

async function buyShopItem(heroId, amount, gemCost) {
    if (isActionOnCooldown("buy")) return;
    setActionCooldown("buy");

    const api = getApiClient();
    if (api && api.hasToken && api.hasToken()) {
        try {
            const packId = amount >= 12 ? "parts_x12" : "parts_x5";
            const purchase = await api.purchaseRareParts({ heroId, packId, costGems: gemCost });

            state.resources.gems = purchase.gems;
            state.heroes[heroId].specificShards += purchase.amount;
            addPuzzleReward("gold", 1);
            pushFeed(`Compra validada no servidor: +${purchase.amount} pecas.`);
            renderAll();
            saveState();
            return;
        } catch (error) {
            pushFeed(`Falha compra servidor: ${error.message}`);
            return;
        }
    }

    if (state.resources.gems < gemCost) {
        pushFeed("Gemas insuficientes na loja.");
        return;
    }

    state.resources.gems -= gemCost;
    state.heroes[heroId].specificShards += amount;
    addPuzzleReward("gold", 1);
    pushFeed(`Compra local concluida: +${amount} pecas de ${getHeroTemplate(heroId).name}.`);
    renderAll();
    saveState();
}
function spawnResourceNodes() {
    const kinds = ["gold", "silver", "wood", "food"];
    for (let i = 0; i < 48; i += 1) {
        const kind = kinds[i % kinds.length];
        runtime.resourceNodes.push({
            id: `n${i}`,
            kind,
            x: 360 + Math.random() * (world.width - 720),
            y: 260 + Math.random() * (world.height - 520),
            level: 1,
            available: true,
            respawnAt: 0
        });
    }
}

function spawnMonsters() {
    for (let i = 0; i < 28; i += 1) {
        const level = 1 + Math.floor(Math.random() * 100);
        runtime.monsters.push({
            id: `m${i}`,
            x: 420 + Math.random() * (world.width - 840),
            y: 300 + Math.random() * (world.height - 620),
            level,
            hp: 80 + level * 12,
            alive: true,
            respawnAt: 0
        });
    }
}

function getNearestAvailableNode(maxDistance) {
    let nearest = null;
    let nearestDistance = Infinity;
    runtime.resourceNodes.forEach((node) => {
        if (!node.available) return;
        const dist = distance(node.x, node.y, player.x, player.y);
        if (dist < maxDistance && dist < nearestDistance) {
            nearestDistance = dist;
            nearest = node;
        }
    });
    return nearest;
}

function getNearestMonster(maxDistance) {
    let nearest = null;
    let nearestDistance = Infinity;
    runtime.monsters.forEach((monster) => {
        if (!monster.alive) return;
        const dist = distance(monster.x, monster.y, player.x, player.y);
        if (dist < maxDistance && dist < nearestDistance) {
            nearestDistance = dist;
            nearest = monster;
        }
    });
    return nearest;
}

function collectResourceNode(node) {
    if (isActionOnCooldown("collect")) return;
    const config = resourceKinds[node.kind];
    let gain = config.value;
    if (node.kind === "food") gain = config.value + Math.floor(Math.random() * 90);

    // Curva por tipo de recurso: alimento escala menos e respawna mais devagar.
    const nodeLevelMultiplier = 1 + (node.level - 1) * config.gainPerLevel;
    gain = Math.floor(gain * nodeLevelMultiplier);

    state.resources[node.kind] += gain;
    setActionCooldown("collect");
    node.available = false;
    node.level = Math.min(node.level + 1, config.maxLevel);

    const baseRespawn = config.respawnBaseMs + Math.random() * config.respawnJitterMs;
    const levelPenalty = (node.level - 1) * config.respawnPerLevelMs;
    node.respawnAt = Date.now() + baseRespawn + levelPenalty;

    if (Math.random() < 0.34) addPuzzleReward("bronze", 1);

    pushFeed(`Coletou ${formatCompact(gain)} de ${config.label} (Mina Nv.${node.level}).`);
    renderAll();
    saveState();
}

function fightMonster(monster) {
    if (isActionOnCooldown("fight")) return;
    const hero = getHeroRuntime(state.selectedHeroId);
    const squadPower = getSquadPower();
    const playerCombat = squadPower / 1000 + hero.heroState.level * 55 + hero.skillAverage * 45;
    const monsterPower = monster.level * 120 + monster.hp;
    const win = playerCombat >= monsterPower * (0.65 + Math.random() * 0.7);
    setActionCooldown("fight");

    if (win) {
        monster.alive = false;
        monster.respawnAt = Date.now() + 70000 + Math.random() * 50000;

        const foodGain = 55 + monster.level * 6;
        const goldGain = 300 + monster.level * 70;
        const silverGain = 260 + monster.level * 55;

        state.resources.food += foodGain;
        state.resources.gold += goldGain;
        state.resources.silver += silverGain;
        state.mission.monsters += 1;

        const equipmentDrop = rollEquipmentDrop(monster.level);
        if (equipmentDrop) {
            state.inventory.equipment.push(equipmentDrop);
            pushFeed(`Equipamento encontrado: ${equipmentDrop.name} (+${equipmentDrop.bonus}).`);
        }
        if (Math.random() < CHEST_DROP_CHANCE) {
            state.inventory.chests.push({ id: `chest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type: "explorer", name: "Baú de Explorador", obtainedAt: Date.now() });
            pushFeed("Você encontrou um Baú de Explorador!");
        }

        if (monster.level >= 45 && Math.random() < 0.4) addPuzzleReward("specific", 1, state.selectedHeroId);
        else if (Math.random() < 0.35) addPuzzleReward("silver", 1);

        if (state.mission.monsters >= state.mission.monstersTarget) {
            state.mission.monsters = 0;
            state.mission.monstersTarget += 1;
            state.resources.gems += 15;
            pushFeed("Meta de caca concluida: +15 gemas.");
        }

        pushFeed(`Monstro Nv.${monster.level} derrotado. +${foodGain} alimento.`);
    } else {
        player.life = Math.max(0, player.life - (8 + monster.level * 0.18));
        pushFeed(`Falha contra monstro Nv.${monster.level}. Vida reduzida.`);
    }

    renderAll();
    saveState();
}

function refreshMapRespawns() {
    const now = Date.now();
    runtime.resourceNodes.forEach((node) => {
        if (!node.available && now >= node.respawnAt) node.available = true;
    });
    runtime.monsters.forEach((monster) => {
        if (!monster.alive && now >= monster.respawnAt) {
            monster.alive = true;
            monster.level = 1 + Math.floor(Math.random() * 100);
            monster.hp = 80 + monster.level * 12;
        }
    });
}

function updateSprint(deltaTime) {
    const isMoving = keys.w || keys.a || keys.s || keys.d;
    const sprintPressed = keys.shift && isMoving;
    const canSprint = runtime.sprint.current > runtime.sprint.minToSprint;

    if (sprintPressed && canSprint) {
        player.speed = PLAYER_BASE_SPEED * 1.65;
        runtime.sprint.current -= runtime.sprint.drainPerSecond * deltaTime;
    } else {
        player.speed = PLAYER_BASE_SPEED;
        runtime.sprint.current += runtime.sprint.regenPerSecond * deltaTime;
    }

    runtime.sprint.current = clamp(runtime.sprint.current, 0, runtime.sprint.max);
}

function processAutoActions(currentTimeMs) {
    if (runtime.auto.collectEnabled && currentTimeMs >= runtime.auto.nextCollectAt) {
        const node = getNearestAvailableNode(140);
        if (node) collectResourceNode(node);
        runtime.auto.nextCollectAt = currentTimeMs + AUTO_ACTION_INTERVALS.collect;
    }

    if (runtime.auto.huntEnabled && currentTimeMs >= runtime.auto.nextHuntAt) {
        const monster = getNearestMonster(160);
        if (monster) fightMonster(monster);
        runtime.auto.nextHuntAt = currentTimeMs + AUTO_ACTION_INTERVALS.hunt;
    }
}

function drawResourceNode(node) {
    if (!node.available) return;
    const config = resourceKinds[node.kind];
    const x = node.x - camera.x;
    const y = node.y - camera.y;
    if (x < -40 || y < -40 || x > canvas.width + 40 || y > canvas.height + 40) return;

    ctx.fillStyle = config.color;
    ctx.beginPath();
    ctx.arc(x, y, config.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#00000055";
    ctx.stroke();

    ctx.fillStyle = "#f5f5f5";
    ctx.font = "bold 10px Trebuchet MS";
    ctx.fillText(`Nv${node.level}`, x - 11, y - 20);
}

function drawMonster(monster) {
    if (!monster.alive) return;
    const x = monster.x - camera.x;
    const y = monster.y - camera.y;
    if (x < -40 || y < -40 || x > canvas.width + 40 || y > canvas.height + 40) return;

    ctx.fillStyle = "#6f2323";
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px Trebuchet MS";
    ctx.fillText(`Lv ${monster.level}`, x - 16, y - 21);
}

function renderResources() {
    ui.powerValue.textContent = formatCompact(getSquadPower());
    ui.goldValue.textContent = formatCompact(state.resources.gold);
    ui.silverValue.textContent = formatCompact(state.resources.silver);
    ui.woodValue.textContent = formatCompact(state.resources.wood);
    ui.foodValue.textContent = formatCompact(state.resources.food);
    ui.energyValue.textContent = formatCompact(state.resources.energy);
    ui.gemValue.textContent = formatCompact(state.resources.gems);
    ui.bronzeShardValue.textContent = state.genericShards.bronze;
    ui.silverShardValue.textContent = state.genericShards.silver;
    ui.goldShardValue.textContent = state.genericShards.gold;
}

function renderMission() {
    const remaining = Math.max(0, state.nextUnlockAt - state.totalPuzzles);
    const progress = PUZZLES_PER_HERO - remaining;
    ui.unlockProgressText.textContent = `${Math.max(0, progress)}/${PUZZLES_PER_HERO} para novo heroi`;
    ui.missionText.textContent = `Derrote monstros para alimento. Progresso caca: ${state.mission.monsters}/${state.mission.monstersTarget}`;
}

function renderSquad() {
    ui.squadSlots.innerHTML = state.squad
        .map((heroId, index) => {
            const selectedClass = index === state.activeSquadSlot ? "active" : "";
            if (!heroId) {
                return `<button class="squad-slot ${selectedClass}" data-slot-index="${index}"><span class="emoji">+</span><strong>Vazio</strong></button>`;
            }
            const heroTemplate = getHeroTemplate(heroId);
            return `<button class="squad-slot ${selectedClass}" data-slot-index="${index}"><span class="emoji">${heroTemplate.icon}</span><strong>${heroTemplate.name}</strong></button>`;
        })
        .join("");
}

function renderRoster() {
    ui.heroRoster.innerHTML = heroTemplates
        .map((hero) => {
            const heroState = state.heroes[hero.id];
            const runtimeHero = getHeroRuntime(hero.id);
            const stars = "★".repeat(heroState.stars) + "☆".repeat(5 - heroState.stars);
            const isActive = hero.id === state.selectedHeroId ? "active" : "";
            const lockClass = heroState.unlocked ? "" : "locked";
            const tierClass = `tier-${hero.tier}`;
            const unlockText = heroState.unlocked ? `Poder ${formatCompact(runtimeHero.power)}` : `Bloqueado`;
            const assignButton = heroState.unlocked ? `<button class="assign-btn" data-action="assign-hero" data-hero-id="${hero.id}">Usar</button>` : `<button class="assign-btn" disabled>Bloqueado</button>`;
            return `<article class="hero-card ${tierClass} ${isActive} ${lockClass}" data-hero-id="${hero.id}">
                <div class="top"><span>${hero.icon}</span><small>${unlockText}</small></div>
                <span class="name">${hero.name}</span>
                <span class="weapon">${hero.weapon}</span>
                <div class="stars">${stars}</div>
                <div class="hero-card-footer">${assignButton}</div>
            </article>`;
        })
        .join("");
}

function renderHeroTabs() {
    ui.heroTabsElement.innerHTML = heroTabs
        .map((tab) => {
            const activeClass = tab.id === state.activeHeroTab ? "active" : "";
            return `<button class="hero-tab ${activeClass}" data-tab-id="${tab.id}">${tab.label}</button>`;
        })
        .join("");
}
function renderTabContent() {
    const hero = getHeroRuntime(state.selectedHeroId);
    if (!hero.heroState.unlocked) {
        ui.heroTabContent.innerHTML = "<p>Este heroi ainda esta bloqueado.</p>";
        return;
    }

    if (state.activeHeroTab === "atributos") {
        const foodCost = 120 + hero.heroState.level * 25;
        ui.heroTabContent.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item"><span>ATQ</span><strong>${hero.atk.toLocaleString("pt-BR")}</strong><em>Nv.${hero.heroState.level}</em></div>
                <div class="stat-item"><span>DEF</span><strong>${hero.def.toLocaleString("pt-BR")}</strong><em>${hero.heroState.stars}★</em></div>
                <div class="stat-item"><span>Unidades</span><strong>${hero.troops.toLocaleString("pt-BR")}</strong><em>${tierLabel(hero.template.tier)}</em></div>
            </div>
            <div class="equip-grid">
                ${Object.entries(EQUIPMENT_SLOTS).map(([slot, label]) => {
                    const equippedId = hero.heroState.equippedItems?.[slot];
                    const equipped = state.inventory.equipment.find((item) => item.id === equippedId);
                    const bonusLabel = slot === "weapon" ? "ATQ" : slot === "armor" ? "DEF" : "Unidades";
                    return `<article class="equip-card"><strong>${label}</strong><small>Nível ${hero.heroState.equipment[slot]} · ${equipped ? `${equipped.name} (+${equipped.bonus} ${bonusLabel})` : "Nenhum item equipado"}</small></article>`;
                }).join("")}
            </div>
            <section class="inventory-section"><h3>Baús (${state.inventory.chests.length})</h3>
                ${state.inventory.chests.length ? state.inventory.chests.map((chest) => `<article class="inventory-item"><span><strong>${chest.name || "Baú de Explorador"}</strong><small>Recompensa aleatória · probabilidades publicadas</small></span><button class="inline-action" data-action="open-chest" data-chest-id="${chest.id}">Abrir</button></article>`).join("") : "<p>Baús podem ser encontrados ao derrotar monstros.</p>"}
            </section>
            <section class="inventory-section"><h3>Inventário de equipamentos (${state.inventory.equipment.length})</h3>
                ${state.inventory.equipment.length ? state.inventory.equipment.map((item) => {
                    const isEquipped = hero.heroState.equippedItems?.[item.slot] === item.id;
                    const label = EQUIPMENT_SLOTS[item.slot];
                    const bonusLabel = item.slot === "weapon" ? "ATQ" : item.slot === "armor" ? "DEF" : "Unidades";
                    return `<article class="inventory-item"><span><strong>${item.name}</strong><small>${label} · ${item.rarityLabel} · +${item.bonus} ${bonusLabel}</small></span><button class="inline-action" data-action="equip-item" data-item-id="${item.id}" ${isEquipped ? "disabled" : ""}>${isEquipped ? "Equipado" : "Equipar"}</button></article>`;
                }).join("") : "<p>Derrote monstros para ter a chance de encontrar equipamentos.</p>"}
            </section>
            <button class="inline-action" data-action="level-up-hero">Subir nivel (custo: ${foodCost} alimento)</button>
        `;
        return;
    }

    if (state.activeHeroTab === "modulos") {
        const chips = state.inventory.chips || [];
        const activePreset = state.activeVehicleChipPreset;
        const activeLoadout = state.vehicleChipLoadouts[activePreset];
        const filledVehicleSlots = window.IWChipLoadouts.filledSlotCount(state.vehicleChipLoadouts, activePreset);
        const presetButtons = window.IWChipLoadouts.PRESETS.map((preset) => `<button class="inline-action" data-action="select-chip-preset" data-preset="${preset}" ${preset === activePreset ? "disabled" : ""}>Preset ${preset}${preset === activePreset ? " · ativo" : ""}</button>`).join("");
        const vehicleSlotRows = window.IWChipLoadouts.SLOTS.map((slot) => {
            const chipId = activeLoadout[slot.id];
            const chip = chips.find((item) => item.id === chipId);
            return `<article class="inventory-item"><span><strong>${slot.label}</strong><small>${chip ? `${chip.name} · Nv.${chip.level}` : "Espaço vazio"}</small></span><button class="inline-action" data-action="remove-vehicle-chip" data-slot-id="${slot.id}" ${chip ? "" : "disabled"}>Remover</button></article>`;
        }).join("");
        const oddsRows = MODULE_CHEST_ODDS.map((item) => `<tr><td>${item.label}</td><td>${item.chance.toLocaleString("pt-BR")}%</td></tr>`).join("");
        const chipRows = chips.length ? chips.map((chip) => {
            const definition = CHIP_CATALOG.find((item) => item.id === chip.typeId);
            const equipped = hero.heroState.equippedChips?.[definition?.stat] === chip.id;
            const pct = definition ? definition.basePct + (chip.level - 1) * 9.6 : 0;
            const copies = chips.filter((item) => item.typeId === chip.typeId && item.id !== chip.id && !isChipEquipped(item.id)).length;
            return `<article class="inventory-item"><span><strong>${chip.name} · Nv.${chip.level}</strong><small>${chip.role} · ${chip.rarityLabel} · +${pct.toLocaleString("pt-BR")}% ${definition?.statLabel || ""} · cópias extras: ${copies}</small></span><div><button class="inline-action" data-action="equip-chip" data-chip-id="${chip.id}" ${equipped ? "disabled" : ""}>${equipped ? "Equipado/salvo" : "Equipar no herói"}</button><button class="inline-action" data-action="assign-vehicle-chip" data-chip-id="${chip.id}" ${window.IWChipLoadouts.isChipInPreset(state.vehicleChipLoadouts, activePreset, chip.id) || filledVehicleSlots >= 4 ? "disabled" : ""}>Instalar na viatura</button><button class="inline-action" data-action="upgrade-chip" data-chip-id="${chip.id}" ${chip.level >= CHIP_MAX_LEVEL || copies < (definition?.upgradeCopies || 999) ? "disabled" : ""}>Evoluir (${definition?.upgradeCopies || "—"} cópias)</button></div></article>`;
        }).join("") : "<p>Nenhum módulo no inventário. Encontre um Baú de Módulos em baús de explorador.</p>";
        const moduleChests = state.inventory.chests.filter((chest) => chest.type === "module");
        ui.heroTabContent.innerHTML = `
            <section class="inventory-section"><h3>Configuração de viatura · Preset ${activePreset}</h3><p>Configuração original com quatro espaços. A ressonância ainda não concede bônus até sua regra ser definida e testada.</p><div class="preset-switcher">${presetButtons}</div><p>Espaços ocupados: <strong>${filledVehicleSlots}/4</strong></p>${vehicleSlotRows}</section>
            <section class="inventory-section"><h3>Módulos do herói · ${hero.template.name}</h3><p>ATQ calculado: ${hero.atk.toLocaleString("pt-BR")} · Unidades: ${hero.troops.toLocaleString("pt-BR")}</p>
            <p>Materiais de módulo: <strong>${state.inventory.chipMaterials || 0}</strong></p></section>
            <section class="inventory-section"><h3>Baús de Módulos (${moduleChests.length})</h3>
            ${moduleChests.length ? moduleChests.map((chest) => `<article class="inventory-item"><span><strong>${chest.name}</strong><small>Recompensas e probabilidades transparentes</small></span><button class="inline-action" data-action="open-chest" data-chest-id="${chest.id}">Abrir</button></article>`).join("") : "<p>Abra um baú de explorador para ter chance de encontrar um Baú de Módulos.</p>"}</section>
            <section class="inventory-section"><h3>Inventário de módulos (${chips.length})</h3>${chipRows}</section>
            <section class="inventory-section"><h3>Probabilidades · Baú de Módulos</h3><p>Chances e progressão são valores provisórios do protótipo original Guerra Infinita. As capturas de referência não comprovam o pool completo nem uma fórmula geral de evolução.</p><table class="module-odds"><thead><tr><th>Recompensa</th><th>Chance</th></tr></thead><tbody>${oddsRows}</tbody></table><p>Total: ${MODULE_CHEST_ODDS.reduce((sum, item) => sum + item.chance, 0).toLocaleString("pt-BR")}%</p></section>`;
        return;
    }

    if (state.activeHeroTab === "habilidade") {
        ui.heroTabContent.innerHTML = `<div class="ability-list">${hero.template.skills
            .map((skill, index) => {
                const currentLevel = hero.heroState.skillLevels[index] || 1;
                return `<article class="ability-card"><div class="ability-head"><strong>${skill}</strong><span>Lv.${currentLevel}/100</span></div><p>Efeito escalonado por nivel e raridade.</p><button class="inline-action" data-action="upgrade-skill" data-skill-index="${index}">Evoluir habilidade</button></article>`;
            })
            .join("")}</div>`;
        return;
    }

    const ascensionNeed = getHeroStarPromotionCost(hero.heroState);
    const isMaxStars = ascensionNeed === null;
    const pools = getAllowedGenericPools(hero.template.tier).map((pool) => `${tierLabel(pool)}: ${state.genericShards[pool]}`).join(" | ");
    const starStepLabel = hero.heroState.starStep === 5 ? "5/5 etapas · máximo" : `${hero.heroState.starStep || 0}/5 etapas desta estrela`;
    ui.heroTabContent.innerHTML = `<div class="ascension-box"><p class="star-line">${"★".repeat(hero.heroState.stars)}${"☆".repeat(5 - hero.heroState.stars)}</p><p>Progresso da estrela: <strong>${starStepLabel}</strong></p><p>Fragmentos específicos (${hero.template.weapon}): <strong>${hero.heroState.specificShards}</strong></p><p>Fragmentos universais permitidos: <strong>${pools}</strong></p><p>Necessário para próxima etapa: <strong>${isMaxStars ? "Máximo alcançado" : ascensionNeed + " fragmentos"}</strong></p><button class="ascend-btn" data-action="ascend-hero" ${isMaxStars ? "disabled" : ""}>${isMaxStars ? "Herói no máximo" : "Evoluir estrela"}</button></div>`;
}

function updateHeroDetail() {
    const hero = getHeroRuntime(state.selectedHeroId);
    heroDetail.portrait.innerText = hero.template.icon;
    heroDetail.name.innerText = `${hero.template.name} (${tierLabel(hero.template.tier)})`;
    heroDetail.weapon.innerText = `Arma: ${hero.template.weapon}`;
    heroDetail.stats.innerText = `ATQ ${hero.atk.toLocaleString("pt-BR")} | DEF ${hero.def.toLocaleString("pt-BR")} | Unidades ${hero.troops}`;
    heroDetail.skills.innerHTML = hero.template.skills.map((skill) => `<span class="skill-chip">${skill}</span>`).join("");
}

function renderShop() {
    const rareHeroes = heroTemplates.filter((hero) => hero.tier === "gold");
    ui.shopGrid.innerHTML = rareHeroes
        .map((hero) => {
            const item1 = { amount: 5, cost: 180 };
            const item2 = { amount: 12, cost: 390 };
            return `<article class="shop-card"><h4>${hero.name}</h4><p>${hero.weapon}</p><button data-action="buy-shop" data-hero-id="${hero.id}" data-amount="${item1.amount}" data-cost="${item1.cost}">Comprar ${item1.amount} pecas (${item1.cost} gemas)</button><button data-action="buy-shop" data-hero-id="${hero.id}" data-amount="${item2.amount}" data-cost="${item2.cost}">Comprar ${item2.amount} pecas (${item2.cost} gemas)</button></article>`;
        })
        .join("");
}

function formatTimer(msLeft) {
    const safe = Math.max(0, msLeft);
    const days = Math.floor(safe / (24 * 3600 * 1000));
    const hours = Math.floor((safe % (24 * 3600 * 1000)) / (3600 * 1000));
    const minutes = Math.floor((safe % (3600 * 1000)) / (60 * 1000));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${minutes}m`;
}

function renderTimers() {
    ui.vsTimer.textContent = formatTimer(state.events.vsEndsAt - Date.now());
    ui.bonusTimer.textContent = formatTimer(state.events.bonusEndsAt - Date.now());
}

function getExpeditionDestination(destinationId = state.expedition.destinationId) {
    return EXPEDITION_DESTINATIONS.find((item) => item.id === destinationId) || EXPEDITION_DESTINATIONS[0];
}

function getExpeditionObjective(objectiveId = state.expedition.objectiveId) {
    return EXPEDITION_OBJECTIVES.find((item) => item.id === objectiveId) || EXPEDITION_OBJECTIVES[0];
}

function renderExpeditionOptions() {
    if (!ui.expeditionDestination || !ui.expeditionObjective) return;
    const expedition = state.expedition;
    const destination = getExpeditionDestination();
    const availableObjectives = EXPEDITION_OBJECTIVES.filter((objective) => destination.objectiveIds.includes(objective.id));
    if (!ui.expeditionDestination.options.length) {
        ui.expeditionDestination.innerHTML = EXPEDITION_DESTINATIONS.map((item) => `<option value="${item.id}">${item.label}</option>`).join("");
    }
    ui.expeditionDestination.value = destination.id;
    const objective = availableObjectives.some((item) => item.id === expedition.objectiveId) ? expedition.objectiveId : availableObjectives[0].id;
    if (!availableObjectives.some((item) => item.id === expedition.objectiveId)) expedition.objectiveId = objective;
    ui.expeditionObjective.innerHTML = availableObjectives.map((item) => `<option value="${item.id}">${item.label}</option>`).join("");
    ui.expeditionObjective.value = objective;
    ui.expeditionDestination.disabled = expedition.active;
    ui.expeditionObjective.disabled = expedition.active;
    if (ui.expeditionMapLabel) ui.expeditionMapLabel.textContent = destination.label;
    if (ui.expeditionRewardPreview) {
        ui.expeditionRewardPreview.textContent = `${destination.region} · ${getExpeditionObjective().description} · recompensa base x${(destination.rewardMultiplier * getExpeditionObjective().rewardMultiplier).toFixed(2)}`;
    }
}

function renderExpeditionPanel() {
    if (!ui.expeditionPanel || !ui.expeditionStatus || !ui.startExpeditionBtn || !ui.claimExpeditionBtn) return;
    renderExpeditionOptions();
    const expedition = state.expedition;
    if (expedition.active) {
        const remaining = Math.max(0, expedition.endsAt - Date.now());
        ui.expeditionStatus.textContent = remaining > 0
            ? `${getExpeditionDestination().label} · ${getExpeditionObjective().label} · retorno em ${formatTimer(remaining)}. O progresso é salvo automaticamente.`
            : `${getExpeditionDestination().label} concluída! Objetivo: ${getExpeditionObjective().label}. Resgate para atualizar o saldo.`;
        ui.startExpeditionBtn.disabled = true;
        ui.claimExpeditionBtn.disabled = remaining > 0 || expedition.rewardClaimed || expedition.claimedIds.includes(expedition.id);
        ui.claimExpeditionBtn.textContent = expedition.rewardClaimed || expedition.claimedIds.includes(expedition.id) ? "Recompensa resgatada" : "Resgatar recompensa";
        return;
    }
    ui.expeditionStatus.textContent = expedition.completedCount > 0
        ? `Última expedição concluída. Expedições resgatadas: ${expedition.completedCount}.`
        : "Escolha um destino e objetivo no mapa para preparar sua primeira expedição.";
    ui.startExpeditionBtn.disabled = state.resources.energy < VERTICAL_SLICE_ENERGY_COST;
    ui.claimExpeditionBtn.disabled = true;
    ui.claimExpeditionBtn.textContent = "Resgatar recompensa";
}

async function startExpedition() {
    if (state.expedition.active && !state.expedition.rewardClaimed) {
        pushFeed("Conclua e resgate a expedição atual antes de iniciar outra.");
        return;
    }
    if (state.resources.energy < VERTICAL_SLICE_ENERGY_COST) {
        pushFeed("Energia insuficiente para iniciar a expedição.");
        return;
    }
    const destination = getExpeditionDestination();
    const objective = getExpeditionObjective();
    if (!destination.objectiveIds.includes(objective.id)) {
        pushFeed("Esse objetivo não está disponível nesse destino.");
        return;
    }
    const api = getApiClient();
    let serverExpedition = null;
    if (api && api.hasToken && api.hasToken() && typeof api.startExpeditionV1 === "function") {
        try {
            serverExpedition = await api.startExpeditionV1({ destinationId: destination.id, objectiveId: objective.id });
        } catch (error) {
            pushFeed(`Não foi possível iniciar a expedição no servidor: ${error.message}`);
            return;
        }
    }
    const now = Date.now();
    state.resources.energy = serverExpedition?.resources?.energy ?? (state.resources.energy - VERTICAL_SLICE_ENERGY_COST);
    state.expedition = {
        ...state.expedition,
        id: serverExpedition?.expeditionId || `exp-${now}-${Math.random().toString(36).slice(2, 9)}`,
        destinationId: destination.id,
        objectiveId: objective.id,
        active: true,
        startedAt: serverExpedition?.startedAtMs || now,
        endsAt: serverExpedition?.endsAtMs || now + 60000,
        rewardClaimed: false,
        serverAuthoritative: Boolean(serverExpedition)
    };
    pushFeed(`Expedição iniciada: ${destination.label} — ${objective.label}.`);
    renderAll();
    saveState();
}

async function claimExpeditionReward() {
    const expedition = state.expedition;
    if (!expedition.active || expedition.rewardClaimed || expedition.claimedIds.includes(expedition.id) || !Number.isFinite(expedition.endsAt) || Date.now() < expedition.endsAt) {
        pushFeed("A recompensa da expedição ainda não está disponível ou já foi resgatada.");
        return;
    }
    if (!expedition.id || expedition.claimedIds.includes(expedition.id)) {
        pushFeed("Resgate duplicado bloqueado.");
        return;
    }
    const destination = getExpeditionDestination();
    const objective = getExpeditionObjective();
    let gold;
    let silver;
    let food;
    const api = getApiClient();
    if (expedition.serverAuthoritative && api && typeof api.claimExpeditionV1 === "function") {
        const idempotencyKey = `exp-claim-${expedition.id}`;
        let result;
        try {
            result = await api.claimExpeditionV1({ expeditionId: expedition.id, idempotencyKey });
        } catch (error) {
            pushFeed(`O servidor não confirmou o resgate: ${error.message}. O saldo não foi alterado.`);
            return;
        }
        gold = result.rewards.gold;
        silver = result.rewards.steel;
        food = result.rewards.food;
        state.resources.energy = result.resources.energy;
    } else {
        const multiplier = destination.rewardMultiplier * objective.rewardMultiplier;
        const squadPower = getSquadPower();
        gold = Math.floor((250 + Math.floor(squadPower / 1800)) * multiplier);
        silver = Math.floor((180 + Math.floor(squadPower / 2400)) * multiplier);
        food = Math.floor((35 + Math.floor(squadPower / 12000)) * (objective.id === "gather" ? multiplier * 1.25 : multiplier));
    }
    expedition.claimedIds = [...new Set([...(expedition.claimedIds || []), expedition.id])].slice(-200);
    expedition.serverAuthoritative = false;
    expedition.rewardClaimed = true;
    expedition.active = false;
    expedition.completedCount += 1;
    // The server confirms the expedition reward amount. Apply that reward once to the
    // local economy, which still contains legacy gameplay gains not yet migrated to v1.
    // A retry after a crash starts from the pre-claim local save and receives the same receipt.
    state.resources.gold += gold;
    state.resources.silver += silver;
    state.resources.food += food;
    pushFeed(`Recompensa de ${destination.label}: +${gold} ouro, +${silver} prata e +${food} alimento.`);
    renderAll();
    saveState();
}

function renderAll() {
    renderResources();
    renderMission();
    renderTimers();
    renderSquad();
    renderRoster();
    renderHeroTabs();
    updateHeroDetail();
    renderTabContent();
    renderShop();
    updateStaminaHud();
    updateQuickHealButton();
    updateInteractionHint();
    renderAutomationButtons();
    renderVerticalSlicePanel();
    renderExpeditionPanel();
}

async function pullStateFromBackend() {
    const api = getApiClient();
    if (!api || !api.hasToken || !api.hasToken()) {
        return;
    }

    try {
        const remote = await api.pullState();
        if (!remote || !remote.state || !remote.state.resources) {
            return;
        }

        // A economia principal ainda contém ganhos/gastos legados apenas no cliente.
        // Não sobrescrever esses saldos com zeros de um snapshot remoto parcial; energia
        // da expedição é autoritativa no backend e continua sendo sincronizada.
        state.resources = {
            ...state.resources,
            ...(remote.state.resources || {}),
            gold: state.resources.gold,
            silver: state.resources.silver,
            food: state.resources.food,
            energy: Number.isFinite(remote.state.resources.energy) ? remote.state.resources.energy : state.resources.energy
        };
        state.genericShards = { ...state.genericShards, ...(remote.state.genericShards || {}) };
        state.inventory = {
            equipment: Array.isArray(remote.state.inventory?.equipment) ? remote.state.inventory.equipment.filter((item) => item && typeof item.id === "string" && EQUIPMENT_SLOTS[item.slot] && Number.isFinite(item.bonus) && item.bonus > 0).slice(0, 500) : state.inventory.equipment,
            chests: Array.isArray(remote.state.inventory?.chests) ? remote.state.inventory.chests.slice(0, 100) : state.inventory.chests,
            chips: Array.isArray(state.inventory.chips) ? state.inventory.chips : [],
            chipMaterials: Number.isFinite(state.inventory.chipMaterials) ? state.inventory.chipMaterials : 0
        };
        state.selectedHeroId = remote.state.selectedHeroId || state.selectedHeroId;
        state.activeHeroTab = remote.state.activeHeroTab || state.activeHeroTab;
        state.activeSquadSlot = Number.isFinite(remote.state.activeSquadSlot) ? remote.state.activeSquadSlot : state.activeSquadSlot;
        state.totalPuzzles = Number.isFinite(remote.state.totalPuzzles) ? remote.state.totalPuzzles : state.totalPuzzles;
        state.nextUnlockAt = Number.isFinite(remote.state.nextUnlockAt) ? remote.state.nextUnlockAt : state.nextUnlockAt;
        state.squad = Array.isArray(remote.state.squad) ? remote.state.squad.slice(0, 5) : state.squad;
        state.mission = { ...state.mission, ...(remote.state.mission || {}) };
        state.events = { ...state.events, ...(remote.state.events || {}) };
        state.buildings = { ...state.buildings, ...(remote.state.buildings || {}) };
        state.verticalSlice = { ...state.verticalSlice, ...(remote.state.verticalSlice || {}) };
        if (remote.state.expedition && typeof remote.state.expedition === "object") {
            const localExpedition = state.expedition || {};
            const remoteExpedition = remote.state.expedition;
            state.expedition = {
                ...localExpedition,
                ...remoteExpedition,
                // The backend snapshot can omit client-facing completion metadata while
                // older gameplay state is being migrated. Merge it monotonically so a
                // reload cannot erase a confirmed local receipt/completion.
                claimedIds: [...new Set([
                    ...(Array.isArray(localExpedition.claimedIds) ? localExpedition.claimedIds : []),
                    ...(Array.isArray(remoteExpedition.claimedIds) ? remoteExpedition.claimedIds : [])
                ])].slice(-200),
                completedCount: Math.max(
                    Number.isFinite(localExpedition.completedCount) ? localExpedition.completedCount : 0,
                    Number.isFinite(remoteExpedition.completedCount) ? remoteExpedition.completedCount : 0
                ),
                rewardClaimed: Boolean(localExpedition.rewardClaimed || remoteExpedition.rewardClaimed)
            };
        }
        state.buildQueue = Array.isArray(remote.state.buildQueue) ? remote.state.buildQueue.slice(0, 2) : state.buildQueue;
        state.heroes = { ...state.heroes, ...(remote.state.heroes || {}) };

        if (remote.economy && Number.isFinite(remote.economy.gems)) {
            state.resources.gems = remote.economy.gems;
        }

        renderAll();
        saveState();
        pushFeed("Progresso sincronizado com servidor.");
    } catch (error) {
        pushFeed(`Sync backend indisponivel: ${error.message}`);
    }
}

function bindUiActions() {
    ui.heroRoster.addEventListener("click", (event) => {
        const assignButton = event.target.closest("[data-action='assign-hero']");
        if (assignButton) {
            assignHeroToSquad(assignButton.dataset.heroId);
            return;
        }
        const card = event.target.closest("[data-hero-id]");
        if (card) setSelectedHero(card.dataset.heroId);
    });

    ui.squadSlots.addEventListener("click", (event) => {
        const slot = event.target.closest("[data-slot-index]");
        if (!slot) return;
        state.activeSquadSlot = Number(slot.dataset.slotIndex);
        renderSquad();
        saveState();
    });

    ui.heroTabsElement.addEventListener("click", (event) => {
        const tabButton = event.target.closest("[data-tab-id]");
        if (!tabButton) return;
        state.activeHeroTab = tabButton.dataset.tabId;
        renderHeroTabs();
        renderTabContent();
        saveState();
    });

    ui.heroTabContent.addEventListener("click", (event) => {
        const actionTarget = event.target.closest("[data-action]");
        if (!actionTarget) return;
        const action = actionTarget.dataset.action;
        if (action === "upgrade-equip") upgradeEquipment(actionTarget.dataset.slot);
        if (action === "equip-item") equipInventoryItem(actionTarget.dataset.itemId);
        if (action === "equip-chip") equipChip(actionTarget.dataset.chipId);
        if (action === "assign-vehicle-chip") assignVehicleChip(actionTarget.dataset.chipId);
        if (action === "select-chip-preset") selectVehicleChipPreset(actionTarget.dataset.preset);
        if (action === "remove-vehicle-chip") removeVehicleChip(actionTarget.dataset.slotId);
        if (action === "upgrade-chip") upgradeChip(actionTarget.dataset.chipId);
        if (action === "open-chest") openInventoryChest(actionTarget.dataset.chestId);
        if (action === "upgrade-skill") upgradeSkill(Number(actionTarget.dataset.skillIndex));
        if (action === "ascend-hero") ascendHero();
        if (action === "level-up-hero") levelUpHero();
    });

    ui.shopGrid.addEventListener("click", (event) => {
        const actionTarget = event.target.closest("[data-action='buy-shop']");
        if (!actionTarget) return;
        void buyShopItem(actionTarget.dataset.heroId, Number(actionTarget.dataset.amount), Number(actionTarget.dataset.cost));
    });

    ui.toggleHeroes.addEventListener("click", () => {
        openHeroPanel();
    });

    ui.closeHeroPanel.addEventListener("click", () => {
        closeHeroPanel();
    });

    ui.openShopBtn.addEventListener("click", () => {
        openShopPanel();
    });

    ui.closeShopBtn.addEventListener("click", () => {
        closeShopPanel();
    });

    if (ui.startExpeditionBtn) ui.startExpeditionBtn.addEventListener("click", startExpedition);
    if (ui.claimExpeditionBtn) ui.claimExpeditionBtn.addEventListener("click", claimExpeditionReward);
    if (ui.expeditionDestination) ui.expeditionDestination.addEventListener("change", () => {
        if (state.expedition.active) return;
        state.expedition.destinationId = EXPEDITION_DESTINATIONS.some((item) => item.id === ui.expeditionDestination.value) ? ui.expeditionDestination.value : "grey-forest";
        const destination = getExpeditionDestination();
        if (!destination.objectiveIds.includes(state.expedition.objectiveId)) state.expedition.objectiveId = destination.objectiveIds[0];
        renderAll();
        saveState();
    });
    if (ui.expeditionObjective) ui.expeditionObjective.addEventListener("change", () => {
        if (state.expedition.active) return;
        const destination = getExpeditionDestination();
        state.expedition.objectiveId = destination.objectiveIds.includes(ui.expeditionObjective.value) ? ui.expeditionObjective.value : destination.objectiveIds[0];
        renderAll();
        saveState();
    });

    ui.saveSquadBtn.addEventListener("click", () => {
        saveState();
        pushFeed("Esquadrao salvo.");
    });

    if (ui.quickHealBtn) {
        ui.quickHealBtn.addEventListener("click", () => {
            useQuickHeal();
        });
    }

    if (ui.toggleAutoCollectBtn) {
        ui.toggleAutoCollectBtn.addEventListener("click", () => {
            toggleAutoCollect();
        });
    }

    if (ui.toggleAutoHuntBtn) {
        ui.toggleAutoHuntBtn.addEventListener("click", () => {
            toggleAutoHunt();
        });
    }

    if (ui.returnVillageBtn) {
        ui.returnVillageBtn.addEventListener("click", () => {
            returnToVillage();
        });
    }

    if (ui.toggleMapBtn) {
        ui.toggleMapBtn.addEventListener("click", () => {
            setMinimapVisible(!runtime.minimapVisible, true);
        });
    }

    if (ui.focusMissionBtn) {
        ui.focusMissionBtn.addEventListener("click", () => {
            pulseMissionCard();
            pushFeed(`Meta atual: ${state.mission.monsters}/${state.mission.monstersTarget} monstros.`);
        });
    }

    if (ui.openHeroesRailBtn) {
        ui.openHeroesRailBtn.addEventListener("click", () => {
            openHeroPanel();
        });
    }

    if (ui.focusPvpBtn) {
        ui.focusPvpBtn.addEventListener("click", () => {
            pushFeed(`Evento VS termina em ${formatTimer(state.events.vsEndsAt - Date.now())}.`);
        });
    }

    if (ui.sliceStartBuildBtn) {
        ui.sliceStartBuildBtn.addEventListener("click", () => {
            startVerticalSliceConstruction();
        });
    }

    if (ui.sliceCompleteBuildBtn) {
        ui.sliceCompleteBuildBtn.addEventListener("click", () => {
            completeVerticalSliceConstruction();
        });
    }

    if (ui.sliceFightPveBtn) {
        ui.sliceFightPveBtn.addEventListener("click", () => {
            fightVerticalSlicePve();
        });
    }

    if (ui.sliceUpgradeHeroBtn) {
        ui.sliceUpgradeHeroBtn.addEventListener("click", () => {
            performVerticalSliceHeroUpgrade();
        });
    }

    if (ui.sliceClaimRewardBtn) {
        ui.sliceClaimRewardBtn.addEventListener("click", () => {
            claimVerticalSliceReward();
        });
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function updateCamera() {
    camera.x = clamp(player.x - canvas.width * 0.5, 0, world.width - canvas.width);
    camera.y = clamp(player.y - canvas.height * 0.55, 0, world.height - canvas.height);
}

function drawTerrain() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#264037");
    grad.addColorStop(1, "#18261f");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#00000024";
    ctx.lineWidth = 1;
    const grid = 72;
    const startX = Math.floor(camera.x / grid) * grid;
    const startY = Math.floor(camera.y / grid) * grid;

    for (let x = startX; x <= camera.x + canvas.width; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x - camera.x, 0);
        ctx.lineTo(x - camera.x, canvas.height);
        ctx.stroke();
    }
    for (let y = startY; y <= camera.y + canvas.height; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y - camera.y);
        ctx.lineTo(canvas.width, y - camera.y);
        ctx.stroke();
    }
}

function drawRoads() {
    const roads = [
        [920, 1120, 1780, 1120],
        [1240, 700, 1240, 1580],
        [980, 900, 1540, 1350],
        [1900, 900, 3100, 1350]
    ];

    roads.forEach((road) => {
        const x1 = road[0] - camera.x;
        const y1 = road[1] - camera.y;
        const x2 = road[2] - camera.x;
        const y2 = road[3] - camera.y;

        ctx.strokeStyle = "#8a7a5a88";
        ctx.lineWidth = 44;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.strokeStyle = "#d1bf9188";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    });
}
function drawBuilding(building) {
    const x = building.x - camera.x;
    const y = building.y - camera.y;
    const glow = ctx.createRadialGradient(x + building.w / 2, y + building.h, 4, x + building.w / 2, y + building.h, 86);
    glow.addColorStop(0, "#f7ca6a66");
    glow.addColorStop(1, "#f7ca6a00");

    ctx.fillStyle = glow;
    ctx.fillRect(x - 40, y + 35, building.w + 80, 100);
    ctx.fillStyle = building.body;
    ctx.fillRect(x, y + 22, building.w, building.h - 20);

    ctx.fillStyle = building.roof;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 28);
    ctx.lineTo(x + building.w / 2, y - 16);
    ctx.lineTo(x + building.w + 8, y + 28);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffe1a8";
    ctx.fillRect(x + building.w * 0.38, y + building.h * 0.55, building.w * 0.24, building.h * 0.22);

    ctx.fillStyle = "#23180f";
    ctx.font = "bold 14px Trebuchet MS";
    ctx.fillText(`Lv.${building.level}`, x + 8, y + building.h + 18);
}

function drawTrees() {
    for (let i = 0; i < 120; i += 1) {
        const tx = (i * 271) % world.width;
        const ty = (i * 193) % world.height;
        const x = tx - camera.x;
        const y = ty - camera.y;
        if (x < -20 || y < -20 || x > canvas.width + 20 || y > canvas.height + 20) continue;

        ctx.fillStyle = "#355a3a";
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#29472e";
        ctx.beginPath();
        ctx.arc(x + 8, y - 6, 10, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawExpeditionDestinations() {
    EXPEDITION_DESTINATIONS.forEach((destination) => {
        const x = destination.x - camera.x;
        const y = destination.y - camera.y;
        if (x < -100 || y < -100 || x > canvas.width + 100 || y > canvas.height + 100) return;
        const selected = destination.id === state.expedition.destinationId;
        ctx.save();
        ctx.globalAlpha = selected ? 1 : 0.72;
        ctx.strokeStyle = selected ? "#f4c56c" : "#9ab0c7";
        ctx.fillStyle = selected ? "#f4c56c" : "#7188a3";
        ctx.lineWidth = selected ? 3 : 2;
        ctx.beginPath();
        ctx.arc(x, y, selected ? 24 : 17, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, selected ? 8 : 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f3f7ff";
        ctx.font = "bold 12px Trebuchet MS";
        ctx.textAlign = "center";
        ctx.fillText(destination.label, x, y - 31);
        ctx.restore();
    });
}

function drawVillage() {
    drawTerrain();
    drawRoads();
    drawTrees();
    drawExpeditionDestinations();
    villageBuildings.forEach(drawBuilding);
    runtime.resourceNodes.forEach(drawResourceNode);
    runtime.monsters.forEach(drawMonster);
}

function drawMinimap() {
    if (!runtime.minimapVisible || !minimapCtx || !ui.minimapCanvas) return;

    const miniW = ui.minimapCanvas.width;
    const miniH = ui.minimapCanvas.height;
    minimapCtx.clearRect(0, 0, miniW, miniH);
    minimapCtx.fillStyle = "#0b1626";
    minimapCtx.fillRect(0, 0, miniW, miniH);

    const scaleX = miniW / world.width;
    const scaleY = miniH / world.height;

    runtime.resourceNodes.forEach((node) => {
        if (!node.available) return;
        const color = resourceKinds[node.kind].color;
        minimapCtx.fillStyle = color;
        minimapCtx.fillRect(node.x * scaleX, node.y * scaleY, 2, 2);
    });

    runtime.monsters.forEach((monster) => {
        if (!monster.alive) return;
        minimapCtx.fillStyle = "#dc6565";
        minimapCtx.fillRect(monster.x * scaleX, monster.y * scaleY, 2, 2);
    });

    EXPEDITION_DESTINATIONS.forEach((destination) => {
        const selected = destination.id === state.expedition.destinationId;
        minimapCtx.fillStyle = selected ? "#f4c56c" : "#9ab0c7";
        minimapCtx.beginPath();
        minimapCtx.arc(destination.x * scaleX, destination.y * scaleY, selected ? 4 : 2.5, 0, Math.PI * 2);
        minimapCtx.fill();
    });

    minimapCtx.strokeStyle = "#e5c07f";
    minimapCtx.lineWidth = 1;
    minimapCtx.strokeRect(camera.x * scaleX, camera.y * scaleY, canvas.width * scaleX, canvas.height * scaleY);

    minimapCtx.fillStyle = "#79e0ff";
    minimapCtx.beginPath();
    minimapCtx.arc(player.x * scaleX, player.y * scaleY, 2.4, 0, Math.PI * 2);
    minimapCtx.fill();
}

function processInteractions() {
    if (pressed.e) {
        const node = getNearestAvailableNode(85);
        if (node) collectResourceNode(node);
    }

    if (pressed.f) {
        const monster = getNearestMonster(95);
        if (monster) fightMonster(monster);
    }

    pressed.e = false;
    pressed.f = false;
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const firstPress = !keys[key];
    if (firstPress) pressed[key] = true;
    keys[key] = true;

    if (!firstPress) return;

    if (key === "escape") {
        const closedAnyPanel = closeTransientPanels();
        if (!closedAnyPanel && runtime.paused) togglePause();
        return;
    }

    if (key === "m") setMinimapVisible(!runtime.minimapVisible, true);
    if (key === "h") useQuickHeal();
    if (key === "p") togglePause();
});
window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

setInterval(() => {
    renderTimers();
    renderVerticalSlicePanel();
    renderExpeditionPanel();
}, 1000);

function gameLoop(currentTime) {
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.05);
    lastTime = currentTime;

    if (!runtime.paused) {
        updateSprint(deltaTime);
        regenerateEnergy(deltaTime);
        refreshBuildQueueState();
        player.move(keys, deltaTime, world.width, world.height);
        refreshMapRespawns();
        processInteractions();
        processAutoActions(Date.now());
    }

    updateCamera();

    drawVillage();
    player.draw(ctx, camera.x, camera.y);
    updateHUD(player, selectedElement.name);
    updateStaminaHud();
    updateInteractionHint();
    drawMinimap();

    gameLoopRequestId = requestAnimationFrame(gameLoop);
}

async function bootstrapGame() {
    setLoadingProgress(6, "Lendo progresso local...");
    await waitFrame();

    spawnResourceNodes();
    setLoadingProgress(26, "Mapeando fontes de recursos...");
    await waitFrame();

    spawnMonsters();
    setLoadingProgress(44, "Posicionando monstros...");
    await waitFrame();

    bindUiActions();
    setLoadingProgress(62, "Conectando controles...");
    await waitFrame();

    resizeCanvas();
    setMinimapVisible(true);
    renderAll();
    setLoadingProgress(80, "Montando interface de combate...");

    saveState();
    setLoadingProgress(92, "Sincronizando progresso...");
    await pullStateFromBackend();

    renderAll();
    setLoadingProgress(100, "Arena pronta.");
    await new Promise((resolve) => setTimeout(resolve, 220));
    hideLoadingScreen();
    showOnboardingIfNeeded();

    if (!gameLoopRequestId) {
        lastTime = performance.now();
        gameLoopRequestId = requestAnimationFrame(gameLoop);
    }
}

void bootstrapGame();
