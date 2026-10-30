# Lua binary export manifest — 2026-10-30

This directory mirrors derived metadata only. No APK, Unity AssetBundle, extracted Lua payload, model, texture, audio, account/session data, token or private configuration is included.

## Coverage

- 12,370 extracted TextAsset .bytes records from all 30 unique bundles in the existing Lua module crosswalk.
- Each record includes bundle name, relative TextAsset path, byte length, SHA-256, first 16 bytes, observed header family, and explicit NOT_DETERMINED / NOT_RUN fields for Lua version and decompiler validation.
- Two header families: LUA_MAGIC_03_54 (6,185 records) and LUA_MAGIC_A8_55 (6,185 records).
- Exact Lua version and custom bytecode transformation are not established. Header-family labels are not proof of a specific Lua release.

## CSV parts

Each part repeats the same header. Part 01 contains 999 data rows; Parts 02–12 contain 1,000 data rows each; Part 13 contains 371 data rows. Total: 12,370 data rows. All 13 paths, headers and first data rows were fetched back successfully. Full remote reassembly and byte-for-byte comparison against the local 12,370-row source manifest remain NOT RUN.

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
- [Engineering report](../../engineering/lua-binary-export-2026-10-30.md) — method, scope, evidence and validation ledger.

## Interpretation boundary

The export confirms that AssetRipper produced the listed TextAsset files for the 30 targeted bundles and that the original source bundles match the canonical SHA-256 manifest 30/30. It does not prove that the entire installed APK was extracted, that every runtime asset was captured, or that the bytecode has been semantically decompiled.
