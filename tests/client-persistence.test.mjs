import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { chromium } from "playwright";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
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
        let page = await context.newPage();
        const pageErrors = [];
        page.on("pageerror", error => pageErrors.push(error.message));

        await page.goto(`${baseUrl}/game.html`, { waitUntil: "load" });
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
        assert.ok(startupDiagnostics.buttonExists, `expedition UI missing: ${JSON.stringify({ startupDiagnostics, pageErrors })}`);
        assert.ok(startupDiagnostics.buttonRect?.width > 0 && startupDiagnostics.buttonRect?.height > 0,
            `expedition UI not visible: ${JSON.stringify({ startupDiagnostics, pageErrors })}`);
        await page.waitForFunction(() => {
            const button = document.querySelector("#startExpeditionBtn");
            return button && !button.disabled;
        }, null, { timeout: 15000 });

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
        await page.waitForFunction(() => document.querySelector("#loadingScreen")?.classList.contains("is-hidden"), null, { timeout: 15000 });

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
        await page.waitForFunction(() => document.querySelector("#loadingScreen")?.classList.contains("is-hidden"), { timeout: 15000 });
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
