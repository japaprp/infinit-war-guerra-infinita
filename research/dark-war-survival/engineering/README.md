# Dark War: Survival — Engineering Evidence Index

**Purpose:** maintain a reproducible, read-only technical reference study. **Reference date:** 2026-10-30.

## Start here
1. [Manifest and report crosswalk](crosswalk-findings-2026-10-30.md) — reconciled dataset grains, counts, discrepancies and canonical join strategy.
2. [Source and manifest register](source-register.md) — tells you which source controls each question and which files are historical.
3. [Metadata manifests README](../data/manifests/README.md) — links to the mirrored CSV files.
4. [Direct S21 package/cache audit](phone-audit-2026-10-30.md) — current installed split APK inventory, 311 cached bundles, SHA-256 and version-marker reconciliation.
5. [Verified engineering handoff](handoff-2026-10-30.md) — last verified state, safety gate and next tasks.
6. [Lua binary export report](lua-binary-export-2026-10-30.md) — 30/30 targeted Lua bundles exported, per-file SHA-256 manifest and header-family inventory.

## Project boundary
- Dark War: Survival is the reference subject only.
- Guerra Infinita is a separate, original game project. Use high-level observations only; do not transfer proprietary code, art, names, account data, credentials, or copied balance tables.
- This directory is research documentation, not an implementation specification unless a finding is revalidated and rewritten as an original design.

## Evidence documents
- [Consolidated technical findings](findings-2026-10-30.md) — architecture, client-side system inventory, version markers, limits.
- [Lua binary export report](lua-binary-export-2026-10-30.md) — selected 30-bundle AssetRipper export, 12,370 TextAsset hashes, format caveats.
- [Lua format and crosswalk report](lua-format-and-crosswalk-2026-10-30.md) — all 12,370 Lua headers validated as official 5.4/5.5 families, four index markers reconciled, DataTable crosswalk evidence and resource gates.
- [Bundle coverage and reconciliation](coverage-2026-10-30.md) — APK/cache union, integrity status, unmapped records.
- [Direct S21 package/cache audit](phone-audit-2026-10-30.md) — fresh read-only check against the currently installed five APK splits and external cache.
- [Gamerares parser-fix validation](gameres-parser-fix-2026-10-30.md) — root cause and PASS evidence for all 370 repaired UNMAPPED rows.
- [Visual evidence catalog](../index.md) — screenshot-derived observations.
- [Data dictionary](../data-dictionary.md) — structured observations.
- [Chips and resonance notes](../../docs/sistemas/chips_ressonancia.md) — early original-game design notes; values remain reported observations unless independently validated.

## Canonical source rules
- Use APK/cache coverage V3 for selected datatable, Lua and gameres source availability; V2 is historical.
- Use the complete 82-row hash manifest for targeted datatable/Lua integrity; use the separate 114-row hero and 54-row map/season manifests for those payload sets.
- Use the datatable asset map and Lua module trace for table/module-to-bundle relationships; use union V3 and the complete hash manifest for exact source availability.
- Use the [Lua binary export manifest index](../data/manifests/lua-binary/README.md) for the 12,370 extracted TextAsset metadata rows; the per-file binary payloads remain local.
- Treat the 78-row initial collection manifest and old staging folders as historical first-pass evidence.
- The 24,558-row detailed gameres asset map is mirrored in four original CSV parts; apply the 370-row repair patch by AssetIndex or rerun the parser to reconstruct corrected V2.
- Do not add counts across different grains. A CSV row, distinct bundle, directory record, candidate model folder and extracted payload are different units.

## Evidence vocabulary
| Label | Meaning |
|---|---|
| PASS | Check completed and result verified. |
| FAIL | Check ran and failed. |
| BLOCKED | Check could not safely or technically proceed. |
| NOT RUN | No test performed. |
| CONFIRMED IN CLIENT CATALOG | Table/module/asset reference exists in inspected client data. |
| REPORTED BY UI | Value/effect is displayed by the interface; runtime behavior is not proven. |
| NEEDS CONTROLLED TEST | Formula, causal relationship, server rule, or live availability is unverified. |

## Public-repository data hygiene
This repository is public. Do not add original APKs, extracted proprietary bundles, game art/audio, private account/session files, device serials, access tokens, local absolute paths, or screenshots containing identifiable account information. Publish derived descriptions, sanitized inventories, and validation summaries only. Keep local binary evidence in controlled storage.

## Current checkpoint
- 52/52 targeted gameplay datatable bundles reconciled across installed split APK and device cache.
- 30/30 targeted gameplay Lua bundles reconciled across installed split APK and device cache.
- 82/82 data + Lua bundle size/hash checks PASS.
- 114/114 selected hero-model bundle checks PASS (76 candidate folders, not a confirmed playable roster).
- 54/54 selected map/season bundle checks PASS.
- 1,576 selected gameres bundles available in corrected APK/cache union V3.
- The 370 formerly UNMAPPED gameres rows are resolved in V2; zero remain unmapped.
- The V1 `UNMAPPED` placeholder is superseded by the parser repair: 370 rows now resolve to 185 real bundle names; V2 contains 1,576 actual bundles and no placeholder.
- Targeted AssetRipper export: 30/30 Lua crosswalk bundles PASS; 12,370 TextAsset .bytes files inventoried and SHA-256 hashed, 6,720 JSON sidecars; full APK extraction and semantic bytecode decompilation remain NOT RUN.
