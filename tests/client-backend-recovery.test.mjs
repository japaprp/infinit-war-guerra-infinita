import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { chromium } from "playwright";

const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "iwar-browser-backend-"));
const dbPath = path.join(tmpDir, "db.json");
process.env.IWAR_DB_PATH = dbPath;

const { createApp } = await import("../backend/src/app.js");
const { initializeRepository, getRepositoryMode, readDb } = await import("../backend/src/repositories/dbRepository.js");
const { initializeRedis } = await import("../backend/src/services/redisService.js");

const backendEnv = {
    PORT: 0,
    GRPC_PORT: 0,
    JWT_SECRET: "browser_integration_jwt_secret",
    RECEIPT_SECRET: "browser_integration_receipt_secret",
    DATA_DRIVER: "json",
    MYSQL_HOST: "127.0.0.1",
    MYSQL_PORT: 3306,
    MYSQL_DATABASE: "infinitwar",
    MYSQL_USER: "root",
    MYSQL_PASSWORD: "",
    REDIS_ENABLED: false,
    REDIS_URL: "redis://127.0.0.1:6379"
};

async function startBackend() {
    await initializeRepository(backendEnv);
    const redisClient = await initializeRedis(backendEnv);
    const app = createApp(backendEnv, { repositoryMode: getRepositoryMode(), redisClient });
    const server = await new Promise(resolveListen => {
        const instance = app.listen(0, "127.0.0.1", () => resolveListen(instance));
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    return {
        baseUrl,
        stop: async () => {
            await new Promise((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()));
            if (redisClient) await redisClient.quit().catch(() => redisClient.disconnect());
        }
    };
}

async function api(baseUrl, method, routePath, body) {
    const response = await fetch(`${baseUrl}${routePath}`, {
        method,
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
    });
    const payload = await response.json().catch(() => ({}));
    assert.ok(response.ok, `${method} ${routePath} failed: HTTP ${response.status} ${JSON.stringify(payload)}`);
    return payload;
}

const webRoot = resolve(fileURLToPath(new URL("../game.html", import.meta.url)), "..");
const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml"
};

function startStaticServer(backendBaseUrl) {
    const server = createServer(async (req, res) => {
        try {
            const url = new URL(req.url || "/", "http://127.0.0.1");
            // Same-origin test proxy avoids browser CORS/preflight differences while
            // forwarding real authenticated requests to the ephemeral backend.
            if (url.pathname.startsWith("/v1/") || url.pathname.startsWith("/player/") || url.pathname.startsWith("/auth/")) {
                const chunks = [];
                for await (const chunk of req) chunks.push(chunk);
                const requestBody = chunks.length ? Buffer.concat(chunks) : undefined;
                const upstream = await fetch(`${backendBaseUrl}${url.pathname}${url.search}`, {
                    method: req.method,
                    headers: {
                        authorization: req.headers.authorization || "",
                        "content-type": req.headers["content-type"] || "application/json",
                        "x-idempotency-key": req.headers["x-idempotency-key"] || ""
                    },
                    body: requestBody
                });
                const responseBody = Buffer.from(await upstream.arrayBuffer());
                res.writeHead(upstream.status, {
                    "Content-Type": upstream.headers.get("content-type") || "application/json"
                });
                res.end(responseBody);
                return;
            }
            const pathname = decodeURIComponent(url.pathname === "/" ? "/game.html" : url.pathname);
            const filePath = resolve(webRoot, "." + pathname);
            if (filePath !== webRoot && !filePath.startsWith(webRoot + sep)) {
                res.writeHead(403).end("Forbidden");
                return;
            }
            const body = await readFile(filePath);
            res.writeHead(200, { "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream" });
            res.end(body);
        } catch (error) {
            res.writeHead(502, { "Content-Type": "application/json" }).end(JSON.stringify({ error: error.message }));
        }
    });
    return new Promise((resolveListen, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => resolveListen({
            baseUrl: `http://127.0.0.1:${server.address().port}`,
            close: () => new Promise(resolveClose => server.close(resolveClose))
        }));
    });
}

async function readSavedState(page) {
    return page.evaluate(() => {
        const raw = localStorage.getItem("iwar_village_state_v1");
        return raw ? JSON.parse(raw).payload : null;
    });
}

test("cliente autenticado recupera resgate após resposta perdida sem duplicar saldo", { timeout: 150_000 }, async () => {
    await fs.rm(dbPath, { force: true });
    const backend = await startBackend();
    const web = await startStaticServer(backend.baseUrl);
    let browser;
    try {
        const login = await api(backend.baseUrl, "POST", "/v1/auth/login", {
            platform: "guest",
            externalId: "browser-recovery-user"
        });
        assert.ok(login.accessToken, "backend deve emitir token de teste");
        const token = login.accessToken;

        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        await context.addInitScript(({ apiBaseUrl, authToken }) => {
            window.IWAR_API_BASE_URL = apiBaseUrl;
            localStorage.setItem("playerNick", "Backend Recovery Test");
            localStorage.setItem("playerElement", "fire");
            localStorage.setItem("iwar_auth_session", JSON.stringify({ uid: "browser-recovery-user", provider: "guest" }));
            localStorage.setItem("iwar_api_token", authToken);
        }, { apiBaseUrl: web.baseUrl, authToken: token });

        const page = await context.newPage();
        const pageErrors = [];
        page.on("pageerror", error => pageErrors.push(error.message));
        await page.goto(`${web.baseUrl}/game.html`, { waitUntil: "load" });
        await page.waitForFunction(() => {
            const button = document.querySelector("#startExpeditionBtn");
            return button && !button.disabled;
        }, null, { timeout: 20000 });

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
        await page.waitForFunction(() => {
            const raw = localStorage.getItem("iwar_village_state_v1");
            const payload = raw ? JSON.parse(raw).payload : null;
            const feed = document.querySelector("#systemFeed")?.innerText || "";
            return payload?.expedition?.serverAuthoritative === true || feed.includes("Não foi possível iniciar a expedição no servidor");
        }, null, { timeout: 20000 });

        const started = await readSavedState(page);
        assert.equal(started.expedition.serverAuthoritative, true, `expedição deve ter sido iniciada pelo backend; saved=${JSON.stringify(started?.expedition)}; feed=${await page.locator("#systemFeed").innerText()}`);
        assert.equal(started.expedition.destinationId, "old-ruins");
        assert.equal(started.resources.energy, 85);
        const expeditionId = started.expedition.id;
        const endsAt = started.expedition.endsAt;

        // The backend processes the claim, but the browser loses the first response.
        let dropFirstResponse = true;
        let firstProcessedReceipt = null;
        let retryReceipt = null;
        await page.route(`${web.baseUrl}/v1/expeditions/claim`, async route => {
            if (route.request().method() !== "POST") {
                await route.continue();
                return;
            }
            const response = await route.fetch();
            const receiptPayload = await response.json();
            if (dropFirstResponse) {
                dropFirstResponse = false;
                firstProcessedReceipt = receiptPayload;
                await route.abort("failed");
                return;
            }
            retryReceipt = receiptPayload;
            await route.fulfill({ response });
        });

        await page.waitForTimeout(Math.max(0, endsAt - Date.now()) + 1200);
        await page.waitForFunction(() => {
            const button = document.querySelector("#claimExpeditionBtn");
            return button && !button.disabled;
        }, null, { timeout: 10000 });
        await page.locator("#claimExpeditionBtn").click();
        await page.waitForFunction(() => (document.querySelector("#systemFeed")?.innerText || "").includes("O servidor não confirmou o resgate"), null, { timeout: 10000 });

        const afterLostResponse = await readSavedState(page);
        assert.equal(afterLostResponse.expedition.active, true, "sem resposta confirmada, cliente não deve marcar como resgatada");
        assert.equal(afterLostResponse.expedition.serverAuthoritative, true);
        const beforeRetry = {
            gold: afterLostResponse.resources.gold,
            silver: afterLostResponse.resources.silver,
            food: afterLostResponse.resources.food
        };

        await page.locator("#claimExpeditionBtn").click();
        await page.waitForFunction(() => {
            const state = localStorage.getItem("iwar_village_state_v1");
            if (!state) return false;
            const payload = JSON.parse(state).payload;
            return payload.expedition?.rewardClaimed === true && payload.expedition?.active === false;
        }, null, { timeout: 15000 });

        const claimed = await readSavedState(page);
        assert.ok(firstProcessedReceipt, "o backend deve ter processado e produzido o primeiro recibo antes da resposta ser descartada");
        assert.ok(retryReceipt, "a repetição deve recuperar um recibo do backend");
        assert.deepEqual(retryReceipt, firstProcessedReceipt, "a repetição deve devolver exatamente o mesmo recibo produzido no primeiro processamento");
        assert.ok(claimed.expedition.claimedIds.includes(expeditionId));
        assert.equal(claimed.expedition.completedCount, 1);
        assert.ok(claimed.resources.gold > beforeRetry.gold);
        assert.ok(claimed.resources.silver > beforeRetry.silver);
        assert.ok(claimed.resources.food > beforeRetry.food);
        const balances = {
            gold: claimed.resources.gold,
            silver: claimed.resources.silver,
            food: claimed.resources.food,
            energy: claimed.resources.energy
        };

        // A full browser-page restart must not reapply the receipt to the local balances.
        await page.close();
        const reopened = await context.newPage();
        reopened.on("pageerror", error => pageErrors.push(error.message));
        await reopened.goto(`${web.baseUrl}/game.html`, { waitUntil: "load" });
        await reopened.waitForFunction(() => !document.querySelector("#loadingScreen") || document.querySelector("#loadingScreen").classList.contains("is-hidden"), null, { timeout: 20000 });
        const afterReload = await readSavedState(reopened);
        assert.deepEqual({
            gold: afterReload.resources.gold,
            silver: afterReload.resources.silver,
            food: afterReload.resources.food,
            energy: afterReload.resources.energy
        }, balances);
        assert.equal(afterReload.expedition.completedCount, 1);
        assert.ok(afterReload.expedition.claimedIds.includes(expeditionId));

        const db = await readDb();
        const account = db.users["guest:browser-recovery-user"];
        assert.ok(account, "backend account must be persisted");
        assert.equal(account.v1.expedition.claimedIds.filter(id => id === expeditionId).length, 1);
        assert.equal(Object.keys(account.v1.expedition.receipts).length, 1);
        assert.equal(account.v1.resources.energy, 85);
        assert.equal(pageErrors.length, 0, `unexpected browser errors: ${pageErrors.join("; ")}`);
        await context.close();
    } finally {
        if (browser) await browser.close();
        await web.close();
        await backend.stop();
    }
});

test.after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
});
