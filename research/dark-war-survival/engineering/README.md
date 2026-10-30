# Dark War: Survival — Engineering Evidence Index

**Purpose:** maintain a reproducible, read-only technical reference study. **Reference date:** 2026-10-30.

## Start here
1. [Manifest and report crosswalk](crosswalk-findings-2026-10-30.md) — reconciled dataset grains, counts, discrepancies and canonical join strategy.
2. [Source and manifest register](source-register.md) — tells you which source controls each question and which files are historical.
3. [Metadata manifests README](../data/manifests/README.md) — links to the mirrored CSV files.
4. [Direct S21 package/cache audit](phone-audit-2026-10-30.md) — current installed split APK inventory, 311 cached bundles, SHA-256 and version-marker reconciliation.
5. [Verified engineering handoff](handoff-2026-10-30.md) — last verified state, safety gate and next tasks.

## Project boundary
- Dark War: Survival is the reference subject only.
- Guerra Infinita is a separate, original game project. Use high-level observations only; do not transfer proprietary code, art, names, account data, credentials, or copied balance tables.
- This directory is research documentation, not an implementation specification unless a finding is revalidated and rewritten as an original design.

## Evidence documents
- [Consolidated technical findings](findings-2026-10-30.md) — architecture, client-side system inventory, version markers, limits.
- [Bundle coverage and reconciliation](coverage-2026-10-30.md) — APK/cache union, integrity status, unmapped records.
- [Direct S21 package/cache audit](phone-audit-2026-10-30.md) — fresh read-only check against the currently installed five APK splits and external cache.
- [Visual evidence catalog](../index.md) — screenshot-derived observations.
- [Data dictionary](../data-dictionary.md) — structured observations.
- [Chips and resonance notes](../../docs/sistemas/chips_ressonancia.md) — early original-game design notes; values remain reported observations unless independently validated.

## Canonical source rules
- Use APK/cache coverage V2 for selected bundle source availability.
- Use the complete 82-row hash manifest for targeted datatable/Lua integrity; use the separate 114-row hero and 54-row map/season manifests for those payload sets.
- Use the datatable asset map and Lua module trace for table/module-to-bundle relationships.
- Treat the 78-row initial collection manifest and old staging folders as historical first-pass evidence.
- The 24,558-row detailed gameres asset map is mirrored in four CSV parts; the source remains unchanged locally.
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
- 1,391 selected gameres bundles available in APK/cache union.
- 370 selected gameres asset rows remain unmapped by the current parser.
- Hero category and gameres coverage count differences are RESOLVED: the extra row is the `UNMAPPED` placeholder, not a real bundle.
- AssetRipper import remains BLOCKED by the low-memory safety gate.
