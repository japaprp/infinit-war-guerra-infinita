import assert from "node:assert/strict";
import test from "node:test";
import { clearFirebaseCertificateCacheForTests, verifyFirebaseIdToken } from "../src/services/firebaseTokenService.js";

test("Firebase verifier rejects a missing project ID", async () => {
    await assert.rejects(() => verifyFirebaseIdToken("a.b.c", ""), /FIREBASE_PROJECT_ID is required/);
});

test("Firebase verifier rejects malformed tokens before network access", async () => {
    await assert.rejects(
        () => verifyFirebaseIdToken("not-a-jwt", "infinit-war-test", {
            fetchImpl: async () => { throw new Error("network should not be called"); }
        }),
        /Malformed Firebase ID token/
    );
});

test("Firebase verifier rejects tokens with the wrong project audience", async () => {
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const token = [
        encode({ alg: "RS256", kid: "test-key" }),
        encode({
            aud: "another-project",
            iss: "https://securetoken.google.com/another-project",
            sub: "someone",
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000),
            auth_time: Math.floor(Date.now() / 1000)
        }),
        "signature"
    ].join(".");
    await assert.rejects(
        () => verifyFirebaseIdToken(token, "infinit-war-test", {
            fetchImpl: async () => { throw new Error("network should not be called"); }
        }),
        /project does not match/
    );
});

test("Firebase verifier rejects expired tokens", async () => {
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const token = [
        encode({ alg: "RS256", kid: "test-key" }),
        encode({
            aud: "infinit-war-test",
            iss: "https://securetoken.google.com/infinit-war-test",
            sub: "someone",
            exp: 1,
            iat: 0,
            auth_time: 0
        }),
        "signature"
    ].join(".");
    await assert.rejects(
        () => verifyFirebaseIdToken(token, "infinit-war-test", {
            now: 2_000,
            fetchImpl: async () => { throw new Error("network should not be called"); }
        }),
        /expired/
    );
});

test("certificate cache can be reset between tests", () => {
    clearFirebaseCertificateCacheForTests();
    assert.ok(true);
});

test("Firebase verifier rejects issue times in the future", async () => {
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const now = 10_000;
    const token = [
        encode({ alg: "RS256", kid: "test-key" }),
        encode({
            aud: "infinit-war-test",
            iss: "https://securetoken.google.com/infinit-war-test",
            sub: "someone",
            exp: 20,
            iat: 20,
            auth_time: 10
        }),
        "signature"
    ].join(".");
    await assert.rejects(
        () => verifyFirebaseIdToken(token, "infinit-war-test", {
            now,
            fetchImpl: async () => { throw new Error("network should not be called"); }
        }),
        /issue time is invalid/
    );
});

test("Firebase verifier rejects implausibly long token lifetimes", async () => {
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const now = 10_000_000;
    const token = [
        encode({ alg: "RS256", kid: "test-key" }),
        encode({
            aud: "infinit-war-test",
            iss: "https://securetoken.google.com/infinit-war-test",
            sub: "someone",
            exp: Math.floor(now / 1000) + 7200,
            iat: Math.floor(now / 1000),
            auth_time: Math.floor(now / 1000)
        }),
        "signature"
    ].join(".");
    await assert.rejects(
        () => verifyFirebaseIdToken(token, "infinit-war-test", {
            now,
            fetchImpl: async () => { throw new Error("network should not be called"); }
        }),
        /issue time is invalid/
    );
});

import { sign } from "node:crypto";
import { firebaseTestCertificate, firebaseTestPrivateKey } from "./fixtures/firebase-test-keys.js";

function createSignedFirebaseToken({ projectId = "infinit-war-test", uid = "verified-user", nowSeconds = Math.floor(Date.now() / 1000) } = {}) {
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const header = encode({ alg: "RS256", kid: "test-key" });
    const payload = encode({
        aud: projectId,
        iss: `https://securetoken.google.com/${projectId}`,
        sub: uid,
        exp: nowSeconds + 3600,
        iat: nowSeconds,
        auth_time: nowSeconds - 30,
        email: "verified@example.test",
        name: "Verified Test User",
        firebase: { sign_in_provider: "google.com" }
    });
    const signingInput = `${header}.${payload}`;
    const signature = sign("RSA-SHA256", Buffer.from(signingInput), firebaseTestPrivateKey).toString("base64url");
    return `${signingInput}.${signature}`;
}

function mockCertificateFetch() {
    return async () => ({
        ok: true,
        headers: { get: () => "public, max-age=3600" },
        json: async () => ({ "test-key": firebaseTestCertificate })
    });
}

test("Firebase verifier accepts a correctly signed token and trusts only its claims", async () => {
    clearFirebaseCertificateCacheForTests();
    const now = Date.now();
    const token = createSignedFirebaseToken({ nowSeconds: Math.floor(now / 1000) });
    const identity = await verifyFirebaseIdToken(token, "infinit-war-test", {
        now,
        fetchImpl: mockCertificateFetch()
    });
    assert.equal(identity.uid, "verified-user");
    assert.equal(identity.provider, "google.com");
    assert.equal(identity.email, "verified@example.test");
    assert.equal(identity.displayName, "Verified Test User");
    clearFirebaseCertificateCacheForTests();
});

test("Firebase verifier rejects an invalid signature even when claims match", async () => {
    clearFirebaseCertificateCacheForTests();
    const token = createSignedFirebaseToken();
    const parts = token.split(".");
    parts[2] = Buffer.alloc(256, 0).toString("base64url");
    await assert.rejects(
        () => verifyFirebaseIdToken(parts.join("."), "infinit-war-test", {
            fetchImpl: mockCertificateFetch()
        }),
        /signature is invalid/
    );
    clearFirebaseCertificateCacheForTests();
});
