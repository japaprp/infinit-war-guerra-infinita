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
