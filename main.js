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

    const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    startButton?.addEventListener("click", () => {
        const email = (emailInput?.value || "").trim().toLowerCase();

        // Validate explicitly instead of relying on WebView's native type=email UI.
        // This accepts common domains such as outlook.com, gmail.com and hotmail.com.
        if (!emailInput || !isValidEmail(email)) {
            emailInput?.setCustomValidity("Digite um e-mail válido, como voce@outlook.com.");
            emailInput?.reportValidity();
            emailInput?.focus();
            setMessage("Confira o e-mail digitado. O acesso de teste funciona offline neste dispositivo.");
            return;
        }
        emailInput.setCustomValidity("");

        const nick = (nicknameInput?.value || "").trim();
        // Digits are valid in commander names (e.g. 121212).
        const safeNick = nick.replace(/[^a-zA-Z0-9_\- À-ÿ]/g, "").slice(0, 16);
        const fallbackNick = email.split("@")[0].replace(/[^a-zA-Z0-9_\- À-ÿ]/g, "").slice(0, 16);
        const finalNick = safeNick || fallbackNick || "Comandante";

        // Prototype-only offline access. This is a local test session, not verified authentication.
        const session = {
            uid: "guest-" + email,
            email,
            displayName: finalNick,
            provider: "guest-local",
            linkedAt: Date.now(),
            localOnly: true
        };
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
        localStorage.setItem("playerNick", finalNick);
        localStorage.setItem("playerEmail", email);
        window.location.href = "game.html";
    });

    googleButton?.addEventListener("click", () => {
        setMessage("O login Google ainda depende da configuração do Firebase. Use CONFIRMAR E ENTRAR para testar offline.");
    });
})();