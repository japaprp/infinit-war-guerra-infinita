# Lua binary export manifest — 2026-10-30

This directory mirrors derived metadata only. No APK, Unity AssetBundle, extracted Lua payload, model, texture, audio, account/session data, token or private configuration is included.

## Coverage

- 12,370 extracted TextAsset .bytes records from all 30 unique bundles in the existing Lua module crosswalk.
- Each record includes bundle name, relative TextAsset path, byte length, SHA-256, first 16 bytes, observed header family, and explicit NOT_DETERMINED / NOT_RUN fields for Lua version and decompiler validation.
- Two header families validated against official chunk-header sentinels: Lua 5.4 (6,185 records; prefix byte 0x03) and Lua 5.5 (6,185 records; prefix byte 0xA8).
- The prefix byte's application-specific meaning remains NOT DETERMINED. Full chunk structural parsing PASS: 12,370/12,370 files. Instruction opcode decoding and semantic decompilation remain NOT RUN.
- Lua 5.5 parsing requires a one-byte alignment offset bias corresponding to the observed prefix byte; the implementation-level reason for this prefix remains NOT DETERMINED.

## CSV parts

Each part repeats the same header. Part 01 contains 999 data rows; Parts 02–12 contain 1,000 data rows each; Part 13 contains 371 data rows. Total: 12,370 data rows. All 13 parts were fetched in full: 12,370 data rows total, expected per-part counts, identical headers and 30 bundle-name keys. Byte-for-byte comparison against the local 12,370-row source manifest remains NOT RUN.

- [Part 01](DARKWAR_LUA_BINARY_EXPORT_MANIFEST_PART_01_OF_13_2026-10-30.csv)
- [Part 02](DARKWAR_LUA_BINARY_EXPORT_MANIFEST_PART_02_OF_13_2026-10-30.csv)
- [Part 03](DARKWAR_LUA_BINARY_EXPORT_MANIFEST_PART_03_OF_13_2026-10-30.csv)
- [Part 04](DARKWAR_LUA_BINARY_EXPORT_MANIFEST_PART_04_OF_13_2026-10-30.csv)
- [Part 05](DARKWAR_LUA_BINARY_EXPORT_MANIFEST_PART_05_OF_13_2026-10-30.csv)
- [Part 06](DARKWAR_LUA_BINARY_EXPORT_MANIFEST_PART_06_OF_13_2026-10-30.csv)
- [Part 07](DARKWAR_LUA_BINARY_EXPORT_MANIFEST_PART_07_OF_13_2026-10-30.csv)
- [Part 08](DARKWAR_LUA_BINARY_EXPORT_MANIFEST_PART_08_OF_13_2026-10-30.csv)
- [Part 09](DARKWAR_LUA_BINARY_EXPORT_MANIFEST_PART_09_OF_13_2026-10-30.csv)
- [Part 10](DARKWAR_LUA_BINARY_EXPORT_MANIFEST_PART_10_OF_13_2026-10-30.csv)
- [Part 11](DARKWAR_LUA_BINARY_EXPORT_MANIFEST_PART_11_OF_13_2026-10-30.csv)
- [Part 12](DARKWAR_LUA_BINARY_EXPORT_MANIFEST_PART_12_OF_13_2026-10-30.csv)
- [Part 13](DARKWAR_LUA_BINARY_EXPORT_MANIFEST_PART_13_OF_13_2026-10-30.csv)

## Supporting evidence

- [Per-bundle export summary](DARKWAR_LUA_BINARY_EXPORT_SUMMARY_2026-10-30.csv) — final file counts, TextAsset counts, header-family counts and aggregate TextAsset-set SHA-256.
- [Export reconciliation](DARKWAR_LUA_BINARY_EXPORT_RECONCILIATION_2026-10-30.csv) — initial versus final file/byte counts.
- [AssetRipper warning summary](DARKWAR_ASSETRIPPER_EXPORT_WARNINGS_2026-10-30.csv) — cumulative-log warning names and occurrence counts.
- [Header-family correlation](DARKWAR_LUA_BINARY_HEADER_FAMILY_CORRELATION_2026-10-30.csv) — per-bundle variant/header relationship.
- [Full-corpus header validation](../DARKWAR_LUA_HEADER_CORPUS_VALIDATION_2026-10-30.csv) — 12,370/12,370 header checks PASS.
- [Six-sample header validation](../DARKWAR_LUA_HEADER_SAMPLE_VALIDATION_2026-10-30.csv) — three modules per version family.
- [Full-chunk parse summary](../DARKWAR_LUA_FULL_CHUNK_PARSE_SUMMARY_2026-10-30.csv) — 12,370/12,370 structural parse PASS and aggregate function/instruction/constant counts.
- [Per-bundle parse summary](../DARKWAR_LUA_FULL_CHUNK_PARSE_BY_BUNDLE_2026-10-30.csv) — 30 bundle-level parse counts.
- [Six full-chunk samples](../DARKWAR_LUA_FULL_CHUNK_SAMPLE_VALIDATION_2026-10-30.csv) — prototype, code, constant, upvalue and debug-structure results.
- [Binary constant/DataTable matches](../DARKWAR_LUA_BINARY_CONSTANT_DATATABLE_MATCHES_V2_2026-10-30.csv) — 883 normalized constant-to-index-name matches, with same-module GetTableData evidence flag.
- [Binary match summary](../DARKWAR_LUA_BINARY_CONSTANT_DATATABLE_SUMMARY_2026-10-30.csv) — category-level counts and evidence boundary.
- [Structural parser source](../../tools/parse-lua-chunks.js) — portable Node.js parser for Lua 5.4/5.5 chunk structure.
- [Engineering report](../../engineering/lua-binary-export-2026-10-30.md) — method, scope, evidence and validation ledger.

## Interpretation boundary

The export confirms that AssetRipper produced the listed TextAsset files for the 30 targeted bundles and that the original source bundles match the canonical SHA-256 manifest 30/30. It does not prove that the entire installed APK was extracted, that every runtime asset was captured, or that the bytecode has been semantically decompiled.
