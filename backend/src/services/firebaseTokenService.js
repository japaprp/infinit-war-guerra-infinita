import { createPublicKey, verify as verifySignature } from "node:crypto";

const CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
let cachedCertificates = null;
let cacheExpiresAt = 0;

function parseMaxAge(cacheControl = "") {
    const match = cacheControl.match(/max-age=(\d+)/i);
    return match ? Math.max(0, Number(match[1])) * 1000 : 60_000;
}

async function getCertificates(fetchImpl = fetch, now = Date.now()) {
    if (cachedCertificates && now < cacheExpiresAt) return cachedCertificates;

    const response = await fetchImpl(CERTS_URL, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Firebase signing certificates are unavailable");
    const certificates = await response.json();
    if (!certificates || typeof certificates !== "object" || Array.isArray(certificates)) {
        throw new Error("Invalid Firebase signing certificate response");
    }

    cachedCertificates = certificates;
    cacheExpiresAt = now + parseMaxAge(response.headers.get("cache-control"));
    return certificates;
}

function decodeSegment(segment) {
    return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
}

export async function verifyFirebaseIdToken(idToken, projectId, options = {}) {
    if (typeof projectId !== "string" || !projectId.trim()) {
        throw new Error("FIREBASE_PROJECT_ID is required to verify Firebase ID tokens");
    }
    if (typeof idToken !== "string" || idToken.length > 16_384) {
        throw new Error("A valid Firebase ID token is required");
    }

    const parts = idToken.split(".");
    if (parts.length !== 3 || parts.some((part) => !part)) {
        throw new Error("Malformed Firebase ID token");
    }

    const header = decodeSegment(parts[0]);
    const claims = decodeSegment(parts[1]);
    if (header.alg !== "RS256" || typeof header.kid !== "string") {
        throw new Error("Unsupported Firebase ID token signing algorithm");
    }

    const nowSeconds = Math.floor((options.now ?? Date.now()) / 1000);
    if (claims.aud !== projectId || claims.iss !== `https://securetoken.google.com/${projectId}`) {
        throw new Error("Firebase ID token project does not match");
    }
    if (typeof claims.sub !== "string" || !claims.sub || claims.sub.length > 128) {
        throw new Error("Firebase ID token subject is invalid");
    }
    if (!Number.isFinite(claims.exp) || claims.exp <= nowSeconds) {
        throw new Error("Firebase ID token is expired");
    }
    if (!Number.isFinite(claims.iat) || claims.iat > nowSeconds + 60 || claims.iat >= claims.exp) {
        throw new Error("Firebase ID token issue time is invalid");
    }
    if (typeof claims.auth_time !== "number" || claims.auth_time > nowSeconds + 60) {
        throw new Error("Firebase ID token authentication time is invalid");
    }

    const certificates = await getCertificates(options.fetchImpl || fetch, options.now ?? Date.now());
    const certificate = certificates[header.kid];
    if (typeof certificate !== "string") throw new Error("Unknown Firebase ID token signing key");

    const publicKey = createPublicKey(certificate);
    const valid = verifySignature(
        "RSA-SHA256",
        Buffer.from(`${parts[0]}.${parts[1]}`),
        publicKey,
        Buffer.from(parts[2], "base64url")
    );
    if (!valid) throw new Error("Firebase ID token signature is invalid");

    return {
        uid: claims.sub,
        provider: typeof claims.firebase?.sign_in_provider === "string" ? claims.firebase.sign_in_provider : "firebase",
        email: typeof claims.email === "string" ? claims.email : "",
        displayName: typeof claims.name === "string" ? claims.name : "",
        claims
    };
}

export function clearFirebaseCertificateCacheForTests() {
    cachedCertificates = null;
    cacheExpiresAt = 0;
}
