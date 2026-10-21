import { X509Certificate } from "node:crypto";

function normalizeCertificate(value) {
    const input = String(value || "").trim();
    if (!input) {
        throw new Error("GAME_SUPABASE_CA_CERT não configurado.");
    }

    const pem = input.includes("-----BEGIN CERTIFICATE-----")
        ? input
        : Buffer.from(input, "base64").toString("utf8").trim();

    if (!pem.includes("-----BEGIN CERTIFICATE-----") || !pem.includes("-----END CERTIFICATE-----")) {
        throw new Error("GAME_SUPABASE_CA_CERT não contém um certificado PEM válido.");
    }

    let certificate;
    try {
        certificate = new X509Certificate(pem);
    } catch {
        throw new Error("GAME_SUPABASE_CA_CERT não pôde ser validado como certificado X.509.");
    }

    if (!certificate.ca) {
        throw new Error("GAME_SUPABASE_CA_CERT precisa ser um certificado de autoridade certificadora (CA).");
    }

    return certificate.toString();
}

export function createPostgresTlsOptions(caCert) {
    return {
        ca: normalizeCertificate(caCert),
        rejectUnauthorized: true
    };
}
