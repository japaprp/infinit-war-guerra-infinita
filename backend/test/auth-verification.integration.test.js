import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";

const env = {
    NODE_ENV: "test",
    JWT_SECRET: "integration_jwt_secret",
    RECEIPT_SECRET: "integration_receipt_secret",
    FIREBASE_PROJECT_ID: "infinit-war-test",
    CORS_ORIGINS: "",
};

function makeUnverifiedPasswordToken() {
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    const header = encode({ alg: "RS256", kid: "deliberately-not-a-real-key" });
    const payload = encode({
        aud: env.FIREBASE_PROJECT_ID,
        iss: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
        sub: "unverified-test-user",
        exp: now + 3600,
        iat: now,
        auth_time: now - 10,
        email: "unverified@example.test",
        email_verified: false,
        firebase: { sign_in_provider: "password" }
    });
    return `${header}.${payload}.not-a-real-signature`;
}

async function withServer(run) {
    const app = createApp(env, { repositoryMode: "json" });
    const server = await new Promise((resolve) => {
        const instance = app.listen(0, () => resolve(instance));
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    try {
        await run(baseUrl);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
}

async function post(baseUrl, route, body) {
    const response = await fetch(`${baseUrl}${route}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
    });
    return { status: response.status, body: await response.json() };
}

test("legacy auth endpoint rejects unverified email/password tokens before creating a session", async () => {
    await withServer(async (baseUrl) => {
        const result = await post(baseUrl, "/auth/session", {
            provider: "password",
            idToken: makeUnverifiedPasswordToken()
        });
        assert.equal(result.status, 401);
        assert.equal(result.body.error, "A valid Firebase ID token is required");
    });
});

test("v1 auth endpoint rejects unverified email/password tokens before creating a session", async () => {
    await withServer(async (baseUrl) => {
        const result = await post(baseUrl, "/v1/auth/login", {
            provider: "password",
            idToken: makeUnverifiedPasswordToken()
        });
        assert.equal(result.status, 401);
        assert.equal(result.body.code, "UNAUTHENTICATED");
    });
});
