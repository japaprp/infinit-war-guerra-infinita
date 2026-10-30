# Dark War: Survival — Engineering Evidence Index

**Purpose:** maintain a reproducible, read-only technical reference study. **Reference date:** 2026-10-30.

## Project boundary
- Dark War: Survival is the reference subject only.
- Guerra Infinita is a separate, original game project. Use high-level observations only; do not transfer proprietary code, art, names, account data, credentials, or copied balance tables.
- This directory is research documentation, not an implementation specification unless a finding is revalidated and rewritten as an original design.

## Evidence documents
- [Consolidated technical findings](findings-2026-10-30.md) — architecture, client-side system inventory, version markers, limits.
- [Bundle coverage and reconciliation](coverage-2026-10-30.md) — APK/cache union, integrity status, unmapped records.
- [Engineering handoff](handoff-2026-10-30.md) — verified starting point, resource gate, next safe actions.
- [Visual evidence catalog](../index.md) — screenshot-derived observations.
- [Data dictionary](../data-dictionary.md) — structured observations.
- [Chips and resonance notes](../../docs/sistemas/chips_ressonancia.md) — early original-game design notes; values remain reported observations unless independently validated.

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
- AssetRipper import remains BLOCKED by the low-memory safety gate.
