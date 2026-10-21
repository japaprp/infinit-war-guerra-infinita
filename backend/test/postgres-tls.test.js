import test from "node:test";
import assert from "node:assert/strict";
import { createPostgresTlsOptions } from "../src/config/postgresTls.js";

test("rejects a missing Supabase CA certificate", () => {
    assert.throws(
        () => createPostgresTlsOptions(""),
        /GAME_SUPABASE_CA_CERT não configurado/
    );
});

test("rejects text that is not a PEM certificate", () => {
    assert.throws(
        () => createPostgresTlsOptions("not-a-certificate"),
        /não contém um certificado PEM válido/
    );
});

test("rejects malformed X.509 certificate data", () => {
    assert.throws(
        () => createPostgresTlsOptions(
            "-----BEGIN CERTIFICATE-----\ninvalid\n-----END CERTIFICATE-----"
        ),
        /não pôde ser validado como certificado X.509/
    );
});
