(() => {
    const BASE_URL = window.IWAR_API_BASE_URL || window.GDE_API_BASE_URL || "http://localhost:4000";
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

    const request = async (method, path, body, tokenOverride) => {
        const token = tokenOverride || getToken();
        const headers = {
            "Content-Type": "application/json"
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

    const exchangeAuthSession = async (session) => {
        if (!session || !session.uid || !session.provider) {
            return null;
        }

        const result = await request("POST", "/auth/session", {
            provider: session.provider,
            providerUid: session.uid,
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
    const listHeroesV1 = async () => request("GET", "/v1/heroes");
    const levelUpHeroV1 = async (heroId, levels = 1) => request("POST", `/v1/heroes/${heroId}/level-up`, { levels });
    const listBuildingsV1 = async () => request("GET", "/v1/buildings");
    const startBuildV1 = async ({ buildingType, slotCode, targetLevel }) =>
        request("POST", "/v1/buildings/start", { buildingType, slotCode, targetLevel });
    const completeBuildV1 = async (taskId) => request("POST", "/v1/buildings/complete", { taskId });
    const queryTilesV1 = async ({ x, y, radius }) => request("GET", `/v1/world/tiles?x=${x}&y=${y}&radius=${radius}`);
    const purchaseSkuV1 = async ({ sku, quantity = 1, idempotencyKey }) =>
        request("POST", "/v1/shop/purchase", { sku, quantity, idempotencyKey });

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
        listHeroesV1,
        levelUpHeroV1,
        listBuildingsV1,
        startBuildV1,
        completeBuildV1,
        queryTilesV1,
        purchaseSkuV1
    };

    window.IWARApi = api;
    // Backward compatibility for legacy references.
    window.GDEApi = api;
})();
