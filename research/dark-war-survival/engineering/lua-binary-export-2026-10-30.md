# Dark War: Survival — Lua bundle binary export

Date: 2026-10-30

Scope: all 30 unique bundles in the existing Lua module crosswalk. This is a targeted crosswalk export, not a full APK extraction.

## Verified results

- Unique Lua bundles in crosswalk: 30
- Bundle export operations: 30/30
- Final exported files after per-bundle tree reconciliation: 19,090
- Final export size: 77,063,517 bytes
- TextAsset .bytes files: 12,370
- TextAsset .bytes size: 65,672,743 bytes
- JSON sidecar files: 6,720
- Header family LUA_MAGIC_03_54: 6,185
- Header family LUA_MAGIC_A8_55: 6,185
- Original source bundle SHA-256: 30/30 match the canonical 82-row data/Lua integrity manifest

## Header interpretation

All inventoried .bytes files begin with the 1B-4C-75-61 Lua magic prefix. Two header families were observed: 03-54-00-19-93... and A8-55-00-19-93.... These are recorded as header families only. Exact Lua version, custom packing/obfuscation semantics, and decompiler compatibility remain NOT RUN. Do not label these files as confirmed standard Lua 5.3 bytecode until a compatible parser validates the chunk structure.

## Export warnings

- The cumulative AssetRipper log contains 3,172 Failed to export warning lines, representing 52 distinct asset names repeated 61 times each.
- This log is cumulative; the 3,172 lines cannot be attributed exclusively to the current 30-bundle export run.
- Warning names were compared with all exported .bytes basenames: zero direct matches.
- The warnings include Unity engine/UI resources and are not automatically proof that Lua TextAssets are missing. See the warning CSV for grouped names and occurrences.

## GitHub mirror

- PASS: the 12,370-row per-file metadata manifest was mirrored in 13 CSV parts under research/dark-war-survival/data/manifests/lua-binary/.
- PASS: per-bundle summary, final tree reconciliation, warning summary, manifest index and this engineering report were published on branch research/dark-war-survival-captures.
- No APK, original Unity bundle, extracted binary payload, model, texture, audio, account/session data, token or private configuration was uploaded.
- No merge, deploy, default-branch update or deletion was performed.

## Validation status

- PASS: all 30/30 unique crosswalk bundles have an EXPORTED result.
- PASS: final tree counts and byte sizes reconciled for all 30 bundle directories.
- PASS: original source bundle SHA-256 matches 30/30 against the canonical integrity manifest.
- PASS: every one of the 12,370 exported .bytes files has a SHA-256 entry in the per-file manifest.
- PASS: all 12,370 files fall into one of the two observed Lua-magic header families.
- PASS: zero cumulative-log warning names matched exported .bytes basenames.
- PASS: all 13 manifest parts and supporting metadata files were created on the research branch; each part's path and header/first data row were fetched back successfully.
- NOT RUN: full remote reassembly and byte-for-byte comparison of all 12,370 mirrored manifest rows against the local source file.
- NOT RUN: decompile/parse all exported bytecode files.
- NOT RUN: establish exact Lua version or custom bytecode transformation.
- NOT RUN: compare all exported TextAssets against a complete APK-wide asset inventory.
- NOT RUN: runtime validation against the live game.
