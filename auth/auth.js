(() => {
    const SESSION_KEY = "iwar_auth_session";
    const LEGACY_SESSION_KEY = "gde_auth_session";

    const authStatus = document.getElementById("authStatus");
    const googleLoginBtn = document.getElementById("googleLoginBtn");
    const facebookLoginBtn = document.getElementById("facebookLoginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const emailAuthForm = document.getElementById("emailAuthForm");
    const authEmail = document.getElementById("authEmail");
    const authPassword = document.getElementById("authPassword");
    const emailRegisterBtn = document.getElementById("emailRegisterBtn");
    const resendVerificationBtn = document.getElementById("resendVerificationBtn");
    const refreshVerificationBtn = document.getElementById("refreshVerificationBtn");

    const getApiClient = () => window.IWARApi || window.GDEApi;

    const migrateLegacySession = () => {
        if (localStorage.getItem(SESSION_KEY)) return;
        const legacy = localStorage.getItem(LEGACY_SESSION_KEY);
        if (legacy) localStorage.setItem(SESSION_KEY, legacy);
    };

    const setSession = (session) => {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        window.IWARAuthSession = session;
        window.GDEAuthSession = session;
    };

    const clearSession = () => {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(LEGACY_SESSION_KEY);
        const api = getApiClient();
        if (api && typeof api.setToken === "function") api.setToken("");
        window.IWARAuthSession = null;
        window.GDEAuthSession = null;
    };

    const renderStatus = (session) => {
        if (!authStatus) return;
        if (!session) {
            authStatus.textContent = "Conta: não vinculada";
            return;
        }
        authStatus.textContent = `Conta: ${session.provider || "conta"} (${session.email || "sem e-mail"})`;
    };

    const showVerificationActions = (visible) => {
        if (resendVerificationBtn) resendVerificationBtn.hidden = !visible;
        if (refreshVerificationBtn) refreshVerificationBtn.hidden = !visible;
    };

    const setStatusMessage = (message) => {
        if (authStatus) authStatus.textContent = message;
    };

    const syncBackendSession = async (session, user) => {
        const api = getApiClient();
        if (!api || typeof api.exchangeAuthSession !== "function") return;
        try {
            const idToken = user && typeof user.getIdToken === "function" ? await user.getIdToken() : "";
            await api.exchangeAuthSession(session, idToken);
        } catch (error) {
            setStatusMessage(`Conta autenticada; servidor indisponível (${error.message})`);
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
        [googleLoginBtn, facebookLoginBtn, logoutBtn, emailRegisterBtn, resendVerificationBtn, refreshVerificationBtn].forEach((button) => {
            if (button) button.disabled = true;
        });
        if (emailAuthForm) {
            Array.from(emailAuthForm.elements).forEach((element) => { element.disabled = true; });
        }
        setStatusMessage("Conta: configure auth/firebase-config.js");
        return;
    }

    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    auth.languageCode = "pt-BR";

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            clearSession();
            renderStatus(null);
            showVerificationActions(false);
            return;
        }

        try {
            await user.reload();
            const refreshedUser = auth.currentUser || user;
            const tokenResult = await refreshedUser.getIdTokenResult();
            const signInProvider = tokenResult.claims && tokenResult.claims.firebase
                ? tokenResult.claims.firebase.sign_in_provider
                : "";
            const requiresEmailVerification = signInProvider === "password" && !refreshedUser.emailVerified;

            if (requiresEmailVerification) {
                clearSession();
                showVerificationActions(true);
                setStatusMessage("Confirme seu e-mail para liberar o acesso à arena. Confira também o spam.");
                return;
            }

            showVerificationActions(false);
            const providerData = refreshedUser.providerData && refreshedUser.providerData[0] ? refreshedUser.providerData[0] : null;
            const session = {
                uid: refreshedUser.uid,
                email: refreshedUser.email || "",
                displayName: refreshedUser.displayName || "",
                provider: signInProvider || (providerData ? providerData.providerId : "unknown"),
                emailVerified: Boolean(refreshedUser.emailVerified),
                linkedAt: Date.now()
            };
            setSession(session);
            renderStatus(session);
            await syncBackendSession(session, refreshedUser);
        } catch (error) {
            clearSession();
            showVerificationActions(false);
            setStatusMessage(`Não foi possível validar a conta: ${error.message}`);
        }
    });

    const loginWithProvider = async (provider) => {
        try {
            await auth.signInWithPopup(provider);
        } catch (error) {
            setStatusMessage(`Falha na autenticação: ${error.message}`);
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

    emailAuthForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = authEmail.value.trim();
        const password = authPassword.value;
        if (!email || !password) return;
        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            setStatusMessage(`Não foi possível entrar: ${error.message}`);
        }
    });

    emailRegisterBtn?.addEventListener("click", async () => {
        const email = authEmail.value.trim();
        const password = authPassword.value;
        if (!email || !password) {
            setStatusMessage("Informe o e-mail e a senha para criar a conta.");
            return;
        }
        if (password.length < 6) {
            setStatusMessage("A senha precisa ter pelo menos 6 caracteres.");
            return;
        }
        try {
            const credential = await auth.createUserWithEmailAndPassword(email, password);
            await credential.user.sendEmailVerification();
            showVerificationActions(true);
            setStatusMessage("Conta criada! Enviamos um e-mail de confirmação. Verifique a caixa de entrada e o spam.");
        } catch (error) {
            setStatusMessage(`Não foi possível criar a conta: ${error.message}`);
        }
    });

    resendVerificationBtn?.addEventListener("click", async () => {
        const user = auth.currentUser;
        if (!user) {
            setStatusMessage("Entre com a conta que precisa confirmar o e-mail para reenviar a mensagem.");
            return;
        }
        try {
            await user.sendEmailVerification();
            setStatusMessage("E-mail de confirmação reenviado. Confira a caixa de entrada e o spam.");
        } catch (error) {
            setStatusMessage(`Não foi possível reenviar: ${error.message}`);
        }
    });

    refreshVerificationBtn?.addEventListener("click", async () => {
        const user = auth.currentUser;
        if (!user) {
            setStatusMessage("Entre novamente com a conta que está aguardando confirmação.");
            return;
        }
        try {
            await user.reload();
            const refreshedUser = auth.currentUser || user;
            if (!refreshedUser.emailVerified) {
                setStatusMessage("Ainda não encontramos a confirmação. Abra o link recebido e tente novamente.");
                return;
            }
            await refreshedUser.getIdToken(true);
            window.location.reload();
        } catch (error) {
            setStatusMessage(`Não foi possível conferir a confirmação: ${error.message}`);
        }
    });

    logoutBtn?.addEventListener("click", async () => {
        try {
            await auth.signOut();
        } catch (error) {
            setStatusMessage(`Não foi possível sair: ${error.message}`);
        } finally {
            clearSession();
            renderStatus(null);
            showVerificationActions(false);
        }
    });
})();
