(() => {
    const AUTH_SESSION_KEY = "iwar_auth_session";
    const LEGACY_AUTH_SESSION_KEY = "gde_auth_session";
    const nicknameInput = document.getElementById("nickname");
    const emailInput = document.getElementById("authEmail");
    const passwordInput = document.getElementById("authPassword");
    const emailAuthForm = document.getElementById("emailAuthForm");
    const startButton = document.getElementById("startGameBtn");
    const loginButton = document.getElementById("emailLoginBtn");

    // The visible email/password controls are also wired into the real Firebase auth form.
    // Reuse the existing auth.js handlers rather than maintaining a second auth implementation.
    if (emailAuthForm && emailInput && passwordInput) {
        emailAuthForm.addEventListener("submit", (event) => {
            event.preventDefault();
            loginButton?.click();
        });
    }

    startButton?.addEventListener("click", () => {
        let session = null;
        try {
            const raw = localStorage.getItem(AUTH_SESSION_KEY) || localStorage.getItem(LEGACY_AUTH_SESSION_KEY);
            session = raw ? JSON.parse(raw) : null;
        } catch {
            session = null;
        }

        if (!session || !session.uid) {
            const status = document.getElementById("authStatus");
            if (status) status.textContent = "Entre com e-mail ou Google antes de continuar.";
            emailInput?.focus();
            return;
        }

        if (session.provider === "password" && session.emailVerified !== true) {
            const status = document.getElementById("authStatus");
            if (status) status.textContent = "Confirme seu e-mail antes de continuar.";
            return;
        }

        const typedNick = (nicknameInput?.value || "").trim();
        const sourceNick = typedNick || session.displayName || (session.email || "").split("@")[0] || "Comandante";
        const safeNick = sourceNick.replace(/[^a-zA-Z0-9_\- À-ÿ]/g, "").slice(0, 16) || "Comandante";
        localStorage.setItem("playerNick", safeNick);
        localStorage.setItem("playerEmail", session.email || "");
        localStorage.setItem("playerElement", "Comandante");
        window.location.href = "game.html";
    });
})();
