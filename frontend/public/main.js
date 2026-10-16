(() => {
    let selectedElement = "fire";
    const AUTH_SESSION_KEY = "iwar_auth_session";
    const LEGACY_AUTH_SESSION_KEY = "gde_auth_session";

    const nicknameInput = document.getElementById("nickname");
    const elementButtons = Array.from(document.querySelectorAll(".element-btn"));
    const startButton = document.getElementById("startGameBtn");

    const migrateLegacySession = () => {
        if (localStorage.getItem(AUTH_SESSION_KEY)) return;
        const legacy = localStorage.getItem(LEGACY_AUTH_SESSION_KEY);
        if (legacy) localStorage.setItem(AUTH_SESSION_KEY, legacy);
    };

    migrateLegacySession();

    const updateElementSelection = (element) => {
        selectedElement = element;
        elementButtons.forEach((button) => {
            const isSelected = button.dataset.element === element;
            button.classList.toggle("is-selected", isSelected);
        });
    };

    elementButtons.forEach((button) => {
        button.addEventListener("click", () => {
            updateElementSelection(button.dataset.element);
        });
    });

    startButton.addEventListener("click", () => {
        const nick = nicknameInput.value.trim();
        let authSession = null;

        try {
            const raw = localStorage.getItem(AUTH_SESSION_KEY);
            authSession = raw ? JSON.parse(raw) : null;
        } catch {
            authSession = null;
        }

        if (!nick) {
            alert("Digite um nickname antes de entrar na arena.");
            nicknameInput.focus();
            return;
        }

        if (!authSession || !authSession.uid) {
            alert("Vincule sua conta Google ou Facebook antes de entrar.");
            return;
        }

        const safeNick = nick.replace(/[^a-zA-Z0-9_\- ]/g, "").slice(0, 16);

        localStorage.setItem("playerNick", safeNick || "Jogador");
        localStorage.setItem("playerElement", selectedElement);

        window.location.href = "game.html";
    });
})();
