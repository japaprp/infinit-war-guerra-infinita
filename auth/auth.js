(() => {
    const SESSION_KEY = "iwar_auth_session";
    const LEGACY_SESSION_KEY = "gde_auth_session";

    const authStatus = document.getElementById("authStatus");
    const googleLoginBtn = document.getElementById("googleLoginBtn");
    const facebookLoginBtn = document.getElementById("facebookLoginBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    const getApiClient = () => window.IWARApi || window.GDEApi;

    const migrateLegacySession = () => {
        if (localStorage.getItem(SESSION_KEY)) return;
        const legacy = localStorage.getItem(LEGACY_SESSION_KEY);
        if (legacy) localStorage.setItem(SESSION_KEY, legacy);
    };

    const setSession = (session) => {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        window.IWARAuthSession = session;
        // Backward compatibility
        window.GDEAuthSession = session;
    };

    const clearSession = () => {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(LEGACY_SESSION_KEY);
        const api = getApiClient();
        if (api && typeof api.setToken === "function") {
            api.setToken("");
        }
        window.IWARAuthSession = null;
        window.GDEAuthSession = null;
    };

    const renderStatus = (session) => {
        if (!authStatus) return;

        if (!session) {
            authStatus.textContent = "Conta: nao vinculada";
            return;
        }

        const provider = session.provider || "email";
        const email = session.email || "sem-email";
        authStatus.textContent = `Conta: ${provider} (${email})`;
    };

    const syncBackendSession = async (session) => {
        const api = getApiClient();
        if (!api || typeof api.exchangeAuthSession !== "function") {
            return;
        }

        try {
            await api.exchangeAuthSession(session);
        } catch (error) {
            if (authStatus) {
                authStatus.textContent = `Conta: vinculada, backend offline (${error.message})`;
            }
        }
    };

    migrateLegacySession();

    const storedRaw = localStorage.getItem(SESSION_KEY);
    if (storedRaw) {
        try {
            const parsed = JSON.parse(storedRaw);
            window.IWARAuthSession = parsed;
            window.GDEAuthSession = parsed;
            renderStatus(parsed);
        } catch {
            clearSession();
            renderStatus(null);
        }
    } else {
        window.IWARAuthSession = null;
        window.GDEAuthSession = null;
        renderStatus(null);
    }

    const firebaseConfig = window.IWAR_FIREBASE_CONFIG || window.GDE_FIREBASE_CONFIG || {};
    const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);

    if (!isFirebaseConfigured || !window.firebase) {
        if (googleLoginBtn) googleLoginBtn.disabled = true;
        if (facebookLoginBtn) facebookLoginBtn.disabled = true;
        if (authStatus) authStatus.textContent = "Conta: configure auth/firebase-config.js";
        return;
    }

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();

    auth.onAuthStateChanged((user) => {
        if (!user) {
            clearSession();
            renderStatus(null);
            return;
        }

        const providerData = user.providerData && user.providerData[0] ? user.providerData[0] : null;
        const session = {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "",
            provider: providerData ? providerData.providerId : "unknown",
            linkedAt: Date.now()
        };

        setSession(session);
        renderStatus(session);
        syncBackendSession(session);
    });

    const loginWithProvider = async (provider) => {
        try {
            await auth.signInWithPopup(provider);
        } catch (error) {
            alert(`Falha na autenticacao: ${error.message}`);
        }
    };

    googleLoginBtn?.addEventListener("click", () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope("email");
        loginWithProvider(provider);
    });

    facebookLoginBtn?.addEventListener("click", () => {
        const provider = new firebase.auth.FacebookAuthProvider();
        provider.addScope("email");
        loginWithProvider(provider);
    });

    logoutBtn?.addEventListener("click", async () => {
        try {
            await auth.signOut();
        } finally {
            clearSession();
            renderStatus(null);
        }
    });
})();
