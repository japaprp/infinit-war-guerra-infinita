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
- Lua 5.4-compatible headers: 6,185
- Lua 5.5-compatible headers: 6,185
- Original source bundle SHA-256: 30/30 match the canonical 82-row data/Lua integrity manifest

## Confirmed header formats

All 12,370 raw TextAsset .bytes files begin with the Lua signature 1B-4C-75-61. The official version byte is at offset 5, preceded by an additional observed byte at offset 4:

- Family A: prefix 0x03, version byte 0x54, official Lua 5.4 header structure.
- Family B: prefix 0xA8, version byte 0x55, official Lua 5.5 header structure.
- Both families have format byte 0 and the expected LUAC_DATA sentinel.
- All version-specific size fields and numeric sentinels match official Lua 5.4.9 / 5.5.1 chunk-header definitions.
- The extra prefix byte meaning is NOT DETERMINED. Do not assume it is an obfuscation key or a version field.

## Header-family correlation

- PASS: all 30 bundle exports are internally homogeneous by observed header family.
- 15 bundle names without the _55_ tag contain only Lua 5.4 headers (6,185 files total).
- 15 bundle names with the _55_ tag contain only Lua 5.5 headers (6,185 files total).
- Zero bundles contain a mixture of the two observed families.
- This is a filename/header correlation only; it does not prove that _55_ is the game release number.
- Six representative files (HeroDataManager, HeroEquipManager and HeroLevelUpTemplateManager, base and 55 variants) also PASS.
- See DARKWAR_LUA_BINARY_HEADER_FAMILY_CORRELATION_2026-10-30.csv and the full-corpus validation CSV.

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
- PASS: all 12,370 files match the official Lua 5.4 or Lua 5.5 header structure; zero invalid, empty or non-Lua files.
- PASS: six representative sample files (three per family) pass the full header-sentinel check.
- PASS: zero cumulative-log warning names matched exported .bytes basenames.
- PASS: all 13 manifest parts and supporting metadata files were created on the research branch; each part's path and header/first data row were fetched back successfully.
- PASS: all 13 GitHub manifest parts were fetched in full; 12,370 data rows total, expected per-part row counts, identical headers and 30 bundle-name keys.
- NOT RUN: byte-for-byte comparison of the fully fetched remote manifest rows against the local source file.
- PASS: all 12,370 files passed recursive full-chunk structural parsing; 179,088 functions, 6,330,931 instructions, 1,825,399 constants and 2,571,205 string occurrences parsed; zero failures.
- NOT RUN: instruction opcode decoding, semantic disassembly and decompilation.
- NOT RUN: compare all exported TextAssets against a complete APK-wide asset inventory.
- NOT RUN: runtime validation against the live game.

Official header references: Lua 5.4.9 lundump.c / lundump.h; Lua 5.5.1 lundump.c / lundump.h.
