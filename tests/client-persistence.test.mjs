import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { chromium } from "playwright";

const root = resolve(fileURLToPath(new URL("../game.html", import.meta.url)), "..");
const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml"
};

function createStaticServer() {
    return createServer(async (req, res) => {
        try {
            const url = new URL(req.url || "/", "http://127.0.0.1");
            if (url.pathname.endsWith(".html")) process.stdout.write(`browser-test request: ${url.pathname}\\n`);
            const pathname = decodeURIComponent(url.pathname === "/" ? "/game.html" : url.pathname);
            const filePath = resolve(root, "." + pathname);
            if (filePath !== root && !filePath.startsWith(root + sep)) {
                res.writeHead(403).end("Forbidden");
                return;
            }
            const body = await readFile(filePath);
            res.writeHead(200, { "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream" });
            res.end(body);
        } catch {
            res.writeHead(404).end("Not found");
        }
    });
}

async function readSavedState(page) {
    return page.evaluate(() => {
        const raw = localStorage.getItem("iwar_village_state_v1");
        if (!raw) return null;
        return JSON.parse(raw).payload;
    });
}

test("cliente mantém expedição, temporizador e saldos após fechar/reabrir", { timeout: 100_000 }, async () => {
    const server = createStaticServer();
    await new Promise((resolveListen, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolveListen);
    });
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    let browser;

    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        // game.html requires a nickname and a local auth-session identity before bootstrapping.
        await context.addInitScript(() => {
            localStorage.setItem("playerNick", "Browser Test");
            localStorage.setItem("playerElement", "fire");
            localStorage.setItem("iwar_auth_session", JSON.stringify({ uid: "browser-test-user" }));
        });
        let page = await context.newPage();
        const pageErrors = [];
        page.on("pageerror", error => pageErrors.push(error.message));

        const initialResponse = await page.goto(`${baseUrl}/game.html`, { waitUntil: "load" });
        await page.waitForTimeout(1200);
        const startupDiagnostics = await page.evaluate(() => {
            const button = document.querySelector("#startExpeditionBtn");
            const style = button ? getComputedStyle(button) : null;
            const rect = button?.getBoundingClientRect();
            return {
                title: document.title,
                readyState: document.readyState,
                bodyClass: document.body.className,
                buttonExists: Boolean(button),
                buttonDisabled: button?.disabled,
                buttonDisplay: style?.display,
                buttonVisibility: style?.visibility,
                buttonRect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
                loadingScreenExists: Boolean(document.querySelector("#loadingScreen")),
                scripts: [...document.scripts].map(script => ({ src: script.src, loaded: Boolean(script.src) }))
            };
        });
        assert.ok(startupDiagnostics.buttonExists, `expedition UI missing: ${JSON.stringify({ responseStatus: initialResponse?.status(), finalUrl: page.url(), startupDiagnostics, pageErrors })}`);
        assert.ok(startupDiagnostics.buttonRect?.width > 0 && startupDiagnostics.buttonRect?.height > 0,
            `expedition UI not visible: ${JSON.stringify({ startupDiagnostics, pageErrors })}`);
        await page.waitForFunction(() => {
            const button = document.querySelector("#startExpeditionBtn");
            return button && !button.disabled;
        }, null, { timeout: 15000 });

        await page.waitForFunction(() => document.querySelector("#expeditionDestination")?.options.length > 0, null, { timeout: 5000 }).catch(async error => {
            const diagnostics = await page.evaluate(() => ({
                loadingText: document.querySelector("#loadingStatusText")?.innerText,
                scripts: [...document.scripts].map(script => ({ src: script.src, loaded: !script.src || [...performance.getEntriesByType("resource")].some(entry => entry.name.endsWith(script.src)) })),
                destinationHtml: document.querySelector("#expeditionDestination")?.innerHTML
            }));
            throw new Error("Expedition options were not initialized: " + JSON.stringify({ diagnostics, pageErrors }) + "; " + error.message);
        });
        await page.locator("#expeditionDestination").selectOption("old-ruins");
        await page.locator("#expeditionObjective").selectOption("hunt");
        await page.locator("#startExpeditionBtn").click();

        const started = await readSavedState(page);
        assert.ok(started?.expedition?.active, "a expedição deve ser salva como ativa");
        assert.equal(started.expedition.destinationId, "old-ruins");
        assert.equal(started.expedition.objectiveId, "hunt");
        assert.ok(started.expedition.endsAt > Date.now(), "o temporizador salvo deve estar no futuro");
        const expeditionId = started.expedition.id;
        const endsAt = started.expedition.endsAt;
        const beforeClaim = { ...started.resources };

        // Simulate closing the game window and reopening it in the same persistent browser profile.
        await page.close();
        page = await context.newPage();
        page.on("pageerror", error => pageErrors.push(error.message));
        await page.goto(`${baseUrl}/game.html`, { waitUntil: "load" });
        await page.waitForFunction(() => (!document.querySelector("#loadingScreen") || document.querySelector("#loadingScreen").classList.contains("is-hidden")), null, { timeout: 15000 });

        const reopened = await readSavedState(page);
        assert.equal(reopened.expedition.id, expeditionId, "o ID da expedição deve sobreviver à reabertura");
        assert.equal(reopened.expedition.active, true, "a expedição deve continuar ativa");
        assert.equal(reopened.expedition.destinationId, "old-ruins");
        assert.equal(reopened.expedition.objectiveId, "hunt");
        assert.equal(reopened.expedition.endsAt, endsAt, "o fim do temporizador não deve ser reiniciado ao reabrir");
        assert.match(await page.locator("#expeditionStatus").innerText(), /Ruínas Antigas/);

        // Wait for the real 60-second game timer, then claim through the visible UI.
        await page.waitForTimeout(Math.max(0, endsAt - Date.now()) + 1200);
        await page.waitForFunction(() => {
            const button = document.querySelector("#claimExpeditionBtn");
            return button && !button.disabled;
        }, null, { timeout: 5000 });
        await page.locator("#claimExpeditionBtn").click();

        const afterClaim = await readSavedState(page);
        assert.equal(afterClaim.expedition.active, false, "a expedição deve ser encerrada após o resgate");
        assert.equal(afterClaim.expedition.rewardClaimed, true);
        assert.ok(afterClaim.expedition.claimedIds.includes(expeditionId), "o ID resgatado deve ser persistido");
        assert.ok(afterClaim.expedition.completedCount >= 1);
        assert.ok(afterClaim.resources.gold > beforeClaim.gold, "o saldo de ouro deve aumentar após o resgate");
        assert.ok(afterClaim.resources.silver > beforeClaim.silver, "o saldo de prata deve aumentar após o resgate");
        assert.ok(afterClaim.resources.food > beforeClaim.food, "o saldo de alimento deve aumentar após o resgate");

        const balancesAfterClaim = {
            gold: afterClaim.resources.gold,
            silver: afterClaim.resources.silver,
            food: afterClaim.resources.food
        };

        await page.close();
        page = await context.newPage();
        page.on("pageerror", error => pageErrors.push(error.message));
        await page.goto(`${baseUrl}/game.html`, { waitUntil: "load" });
        await page.waitForFunction(() => (!document.querySelector("#loadingScreen") || document.querySelector("#loadingScreen").classList.contains("is-hidden")), null, { timeout: 15000 });
        const reopenedAfterClaim = await readSavedState(page);

        assert.deepEqual({
            gold: reopenedAfterClaim.resources.gold,
            silver: reopenedAfterClaim.resources.silver,
            food: reopenedAfterClaim.resources.food
        }, balancesAfterClaim, "os saldos devem permanecer idênticos após nova reabertura");
        assert.equal(reopenedAfterClaim.expedition.completedCount, afterClaim.expedition.completedCount);
        assert.ok(reopenedAfterClaim.expedition.claimedIds.includes(expeditionId));
        assert.match(await page.locator("#claimExpeditionBtn").innerText(), /Resgatar recompensa/);
        assert.deepEqual(pageErrors, [], "o cliente não deve gerar exceções JavaScript durante o fluxo");
        await context.close();
    } finally {
        if (browser) await browser.close();
        await new Promise(resolveClose => server.close(resolveClose));
    }
});


test("vehicle chip presets persist and only the active preset affects combat", { timeout: 150_000 }, async () => {
    const server = createStaticServer();
    await new Promise((resolveListen, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolveListen);
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    let browser;
    let context;
    const pageErrors = [];

    try {
        browser = await chromium.launch({ headless: true });
        context = await browser.newContext();
        await context.addInitScript(() => {
            localStorage.setItem("playerNick", "Chip Preset Test");
            localStorage.setItem("playerElement", "fire");
            localStorage.setItem("iwar_auth_session", JSON.stringify({ uid: "chip-preset-test-user" }));
        });
        let page = await context.newPage();
        page.on("pageerror", error => pageErrors.push(error.message));
        await page.goto(`${baseUrl}/game.html`, { waitUntil: "load" });
        await page.waitForFunction(() => !document.querySelector("#loadingScreen")
            || document.querySelector("#loadingScreen").classList.contains("is-hidden"), null, { timeout: 15000 });
        await page.waitForFunction(() => Boolean(localStorage.getItem("iwar_village_state_v1")), null, { timeout: 5000 });

        const payload = await readSavedState(page);
        assert.ok(payload, "the initial local save must exist");
        payload.inventory.chips = [
            { id: "chip-attack-a", typeId: "assault-module", level: 1, name: "Módulo de Assalto", role: "Guerreiro", rarityLabel: "Épico" },
            { id: "chip-hp-b", typeId: "gravity-barrier", level: 2, name: "Barreira Gravitacional", role: "Guerreiro", rarityLabel: "Épico" },
            { id: "chip-attack-c", typeId: "recon-array", level: 1, name: "Matriz de Reconhecimento", role: "Batedor", rarityLabel: "Raro" },
            { id: "chip-hp-d", typeId: "supply-core", level: 1, name: "Núcleo de Suprimentos", role: "Suporte", rarityLabel: "Raro" }
        ];
        payload.vehicleChipLoadouts = {
            I: { assault: "chip-attack-a", vanguard: "chip-hp-b", suppression: "chip-attack-c", gravity: "chip-hp-d" },
            II: { assault: "chip-attack-c", vanguard: "chip-attack-c", suppression: null, gravity: null },
            III: { assault: null, vanguard: null, suppression: null, gravity: null },
            IV: { assault: null, vanguard: null, suppression: null, gravity: null }
        };
        payload.activeVehicleChipPreset = "I";
        await page.evaluate((nextPayload) => {
            const key = "iwar_village_state_v1";
            const envelope = JSON.parse(localStorage.getItem(key));
            const raw = JSON.stringify(nextPayload);
            let hash = 2166136261;
            for (let i = 0; i < raw.length; i += 1) {
                hash ^= raw.charCodeAt(i);
                hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
            }
            envelope.payload = nextPayload;
            envelope.checksum = (hash >>> 0).toString(16);
            localStorage.setItem(key, JSON.stringify(envelope));
        }, payload);

        await page.reload({ waitUntil: "load" });
        await page.waitForFunction(() => !document.querySelector("#loadingScreen")
            || document.querySelector("#loadingScreen").classList.contains("is-hidden"), null, { timeout: 15000 });
        await page.locator('button[data-tab-id="modulos"]').click();

        const stateI = await readSavedState(page);
        assert.equal(stateI.activeVehicleChipPreset, "I");
        assert.equal(stateI.inventory.chips.length, 4);
        assert.equal(stateI.vehicleChipLoadouts.I.suppression, "chip-attack-c");
        assert.equal(stateI.vehicleChipLoadouts.II.vanguard, null, "duplicate references in one preset must be normalized");
        const resonanceSection = page.locator('[data-resonance-ready="true"]');
        assert.equal(await resonanceSection.getAttribute("data-resonance-active"), "false");
        assert.match(await resonanceSection.innerText(), /sem bônus até a regra original ser definida e validada/i);

        const readCalculatedAttack = async () => page.locator("#heroTabContent").evaluate((element) => {
            const match = element.innerText.match(/ATQ calculado:\s*([\d.]+)/);
            if (!match) throw new Error("Calculated ATK label was not rendered");
            return Number(match[1].replace(/\./g, ""));
        });
        const attackPresetI = await readCalculatedAttack();
        await page.locator('button[data-action="select-chip-preset"][data-preset="II"]').click();
        const stateII = await readSavedState(page);
        assert.equal(stateII.activeVehicleChipPreset, "II");
        assert.equal(stateII.vehicleChipLoadouts.II.assault, "chip-attack-c");
        assert.equal(await page.locator('[data-resonance-ready="false"]').count(), 1);
        const attackPresetII = await readCalculatedAttack();
        assert.ok(attackPresetI > attackPresetII, "switching the active preset must change combat ATK");

        await page.close();
        page = await context.newPage();
        page.on("pageerror", error => pageErrors.push(error.message));
        await page.goto(`${baseUrl}/game.html`, { waitUntil: "load" });
        await page.waitForFunction(() => !document.querySelector("#loadingScreen")
            || document.querySelector("#loadingScreen").classList.contains("is-hidden"), null, { timeout: 15000 });
        await page.locator('button[data-tab-id="modulos"]').click();

        const reopened = await readSavedState(page);
        assert.equal(reopened.activeVehicleChipPreset, "II", "the selected preset must survive a full browser reload");
        assert.equal(reopened.vehicleChipLoadouts.I.assault, "chip-attack-a");
        assert.equal(reopened.vehicleChipLoadouts.II.assault, "chip-attack-c");
        assert.equal(await readCalculatedAttack(), attackPresetII, "combat stats must use the saved active preset after reload");
        assert.deepEqual(pageErrors, [], "the chip preset UI must not throw JavaScript errors");
    } finally {
        if (browser) await browser.close();
        await new Promise(resolveClose => server.close(resolveClose));
    }
});
