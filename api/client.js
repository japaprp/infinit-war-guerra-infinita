(() => {
    const BASE_URL = window.IWAR_API_BASE_URL || window.GDE_API_BASE_URL || "";
    const TOKEN_KEY = "iwar_api_token";
    const LEGACY_TOKEN_KEY = "gde_api_token";

    const migrateLegacyToken = () => {
        if (localStorage.getItem(TOKEN_KEY)) return;
        const legacy = localStorage.getItem(LEGACY_TOKEN_KEY);
        if (legacy) {
            localStorage.setItem(TOKEN_KEY, legacy);
        }
    };

    migrateLegacyToken();

    const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
    const setToken = (token) => {
        if (!token) {
            localStorage.removeItem(TOKEN_KEY);
            return;
        }
        localStorage.setItem(TOKEN_KEY, token);
    };

    const request = async (method, path, body, tokenOverride, extraHeaders = {}) => {
        if (!BASE_URL) {
            throw new Error("Backend API URL is not configured for this hosted environment.");
        }

        const token = tokenOverride || getToken();
        const headers = {
            "Content-Type": "application/json",
            ...extraHeaders
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${BASE_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(payload.error || `HTTP ${response.status}`);
        }

        return payload;
    };

    const exchangeAuthSession = async (session, idToken = "") => {
        if (!session || !session.uid || !session.provider) {
            return null;
        }

        const result = await request("POST", "/auth/session", {
            provider: session.provider,
            providerUid: session.uid,
            idToken,
            email: session.email || "",
            displayName: session.displayName || ""
        });

        if (result.token) {
            setToken(result.token);
        }

        return result;
    };

    const pullState = async () => {
        const token = getToken();
        if (!token) return null;
        return request("GET", "/player/state");
    };

    const pushState = async (state) => {
        const token = getToken();
        if (!token) return null;
        return request("PUT", "/player/state", { state });
    };

    const purchaseRareParts = async ({ heroId, packId, costGems }) => {
        const token = getToken();
        if (!token) throw new Error("No backend token");

        const receipt = await request("POST", "/shop/mock-receipt", { heroId, packId, costGems });
        return request("POST", "/shop/purchase", { receiptId: receipt.receiptId, signature: receipt.signature });
    };

    // Central API stubs (/v1/*) prepared for the production architecture.
    const loginV1 = async ({ provider, idToken }) => request("POST", "/v1/auth/login", { provider, idToken });
    const getPlayerMeV1 = async () => request("GET", "/v1/player/me");
    const syncPlayerV1 = async ({ clientVersion = "0.1.0", stateVersion = 0 }) =>
        request("POST", "/v1/player/sync", { clientVersion, stateVersion });
    const getExpeditionStatusV1 = async () => request("GET", "/v1/expeditions/status");
    const startExpeditionV1 = async ({ destinationId, objectiveId }) =>
        request("POST", "/v1/expeditions/start", { destinationId, objectiveId });
    const claimExpeditionV1 = async ({ expeditionId, idempotencyKey }) =>
        request("POST", "/v1/expeditions/claim", { expeditionId, idempotencyKey }, undefined, { "X-Idempotency-Key": idempotencyKey });
    const listHeroesV1 = async () => request("GET", "/v1/heroes");
    const levelUpHeroV1 = async (heroId, levels = 1) => request("POST", `/v1/heroes/${heroId}/level-up`, { levels });
    const listBuildingsV1 = async () => request("GET", "/v1/buildings");
    const startBuildV1 = async ({ buildingType, slotCode, targetLevel }) =>
        request("POST", "/v1/buildings/start", { buildingType, slotCode, targetLevel });
    const completeBuildV1 = async (taskId) => request("POST", "/v1/buildings/complete", { taskId });
    const queryTilesV1 = async ({ x, y, radius }) => request("GET", `/v1/world/tiles?x=${x}&y=${y}&radius=${radius}`);
    const purchaseSkuV1 = async ({ sku, quantity = 1, idempotencyKey }) =>
        request("POST", "/v1/shop/purchase", { sku, quantity, idempotencyKey });

    const getMapBattleHistoryV1 = async (limit = 20) =>
        request("GET", `/v1/world/battle-history?limit=${encodeURIComponent(limit)}`);
    const startMapHuntV1 = async ({ targetId, heroIds, operationId, troopCount = 0 }) =>
        request("POST", "/v1/world/hunts/start", { targetId, heroIds, operationId, troopCount });
    const resolveMapHuntV1 = async (operationId) =>
        request("POST", `/v1/world/hunts/${encodeURIComponent(operationId)}/resolve`, {});
    const createAllianceRallyV1 = async ({ targetId, heroIds, troopCount, operationId }) =>
        request("POST", "/v1/world/alliance-rallies", { targetId, heroIds, troopCount, operationId });
    const getAllianceRallyV1 = async (operationId) =>
        request("GET", `/v1/world/alliance-rallies/${encodeURIComponent(operationId)}`);
    const joinAllianceRallyV1 = async ({ operationId, heroIds, troopCount }) =>
        request("POST", `/v1/world/alliance-rallies/${encodeURIComponent(operationId)}/join`, { heroIds, troopCount });
    const closeAllianceRallyV1 = async (operationId) =>
        request("POST", `/v1/world/alliance-rallies/${encodeURIComponent(operationId)}/close`, {});
    const dispatchAllianceRallyV1 = async (operationId) =>
        request("POST", `/v1/world/alliance-rallies/${encodeURIComponent(operationId)}/dispatch`, {});
    const resolveAllianceRallyV1 = async (operationId) =>
        request("POST", `/v1/world/alliance-rallies/${encodeURIComponent(operationId)}/resolve`, {});
    const getServerChestsV1 = async () => request("GET", "/v1/inventory/chests");
    const openServerChestV1 = async ({ chestId, idempotencyKey }) =>
        request("POST", `/v1/inventory/chests/${encodeURIComponent(chestId)}/open`, { idempotencyKey }, undefined, { "X-Idempotency-Key": idempotencyKey });
    const getVehicleLoadoutV1 = async () => request("GET", "/v1/vehicle/loadout");
    const setActiveVehiclePresetV1 = async (presetId) =>
        request("POST", "/v1/vehicle/presets/active", { presetId });
    const equipVehicleChipV1 = async ({ chipId, slotId, presetId }) =>
        request("POST", "/v1/vehicle/chips/equip", { chipId, slotId, presetId });
    const removeVehicleChipV1 = async ({ slotId, presetId }) =>
        request("POST", "/v1/vehicle/chips/remove", { slotId, presetId });
    const upgradeVehicleChipV1 = async (chipId) =>
        request("POST", `/v1/vehicle/chips/${encodeURIComponent(chipId)}/upgrade`, {});

    const api = {
        setToken,
        getToken,
        hasToken: () => Boolean(getToken()),
        exchangeAuthSession,
        pullState,
        pushState,
        purchaseRareParts,
        loginV1,
        getPlayerMeV1,
        syncPlayerV1,
        getExpeditionStatusV1,
        startExpeditionV1,
        claimExpeditionV1,
        listHeroesV1,
        levelUpHeroV1,
        listBuildingsV1,
        startBuildV1,
        completeBuildV1,
        queryTilesV1,
        purchaseSkuV1,
        getMapBattleHistoryV1,
        startMapHuntV1,
        resolveMapHuntV1,
        createAllianceRallyV1,
        getAllianceRallyV1,
        joinAllianceRallyV1,
        closeAllianceRallyV1,
        dispatchAllianceRallyV1,
        resolveAllianceRallyV1,
        getServerChestsV1,
        openServerChestV1,
        getVehicleLoadoutV1,
        setActiveVehiclePresetV1,
        equipVehicleChipV1,
        removeVehicleChipV1,
        upgradeVehicleChipV1
    };

    window.IWARApi = api;
    // Backward compatibility for legacy references.
    window.GDEApi = api;
})();
