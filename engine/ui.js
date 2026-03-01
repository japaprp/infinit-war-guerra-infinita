function updateHUD(player, elementName) {
    const playerNameElement = document.getElementById("playerName");
    const playerElementElement = document.getElementById("playerElement");
    const lifeFill = document.getElementById("lifeFill");

    playerNameElement.innerText = player.nick;
    playerElementElement.innerText = `Elemento: ${elementName}`;
    lifeFill.style.width = `${Math.max(0, Math.min(100, player.life))}%`;
}
