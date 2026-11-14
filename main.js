(() => {
    // TEST ONLY: bypass account gating so the local gameplay can be evaluated.
    // Do not merge this branch into production; restore Firebase gating afterwards.
    let selectedElement = "fire";
    const nicknameInput = document.getElementById("nickname");
    const elementButtons = Array.from(document.querySelectorAll(".element-btn"));
    const startButton = document.getElementById("startGameBtn");

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
        if (!nick) {
            alert("Digite um nickname antes de entrar na arena.");
            nicknameInput.focus();
            return;
        }

        const safeNick = nick.replace(/[^a-zA-Z0-9_\- ]/g, "").slice(0, 16);
        localStorage.setItem("playerNick", safeNick || "Jogador");
        localStorage.setItem("playerElement", selectedElement);
        // This bypass is deliberately limited to this isolated test branch.
        window.location.href = "game.html";
    });
})();
