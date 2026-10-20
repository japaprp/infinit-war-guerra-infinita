(() => {
    const AUTH_SESSION_KEY = "iwar_auth_session";
    const LEGACY_AUTH_SESSION_KEY = "gde_auth_session";

    const emailInput = document.getElementById("email");
    const nicknameInput = document.getElementById("nickname");
    const startButton = document.getElementById("startGameBtn");
    const googleButton = document.getElementById("googleLoginBtn");
    const message = document.getElementById("entryMessage");

    const setMessage = (text) => {
        if (message) message.textContent = text;
    };

    if (!localStorage.getItem(AUTH_SESSION_KEY)) {
        const legacy = localStorage.getItem(LEGACY_AUTH_SESSION_KEY);
        if (legacy) localStorage.setItem(AUTH_SESSION_KEY, legacy);
    }

    startButton?.addEventListener("click", () => {
        const email = (emailInput?.value || "").trim().toLowerCase();
        if (!emailInput || !emailInput.checkValidity() || !email) {
            emailInput?.setCustomValidity("Digite um e-mail válido.");
            emailInput?.reportValidity();
            emailInput?.focus();
            return;
        }
        emailInput.setCustomValidity("");

        const nick = (nicknameInput?.value || "").trim();
        const safeNick = nick.replace(/[^a-zA-Z0-9_\- À-ÿ]/g, "").slice(0, 16);
        const fallbackNick = email.split("@")[0].replace(/[^a-zA-Z0-9_\- À-ÿ]/g, "").slice(0, 16);
        const finalNick = safeNick || fallbackNick || "Comandante";

        // Prototype-only access: this stores an email locally, it does not authenticate ownership.
        const session = {
            uid: "guest-" + email,
            email,
            displayName: finalNick,
            provider: "email-local",
            linkedAt: Date.now(),
            localOnly: true
        };
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
        localStorage.setItem("playerNick", finalNick);
        localStorage.setItem("playerEmail", email);
        window.location.href = "game.html";
    });

    googleButton?.addEventListener("click", () => {
        setMessage("O login Google ainda precisa ser configurado no Firebase. O botão ficará funcional depois dessa configuração.");
    });
})();