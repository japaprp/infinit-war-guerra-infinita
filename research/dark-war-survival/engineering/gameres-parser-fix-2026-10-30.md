# Gamerares parser correction — 2026-10-30

## Root cause

The 370 UNMAPPED rows in the 24,558-row selected gameres asset map were not missing from the index. The parser failed to resolve bundle asset-index expressions that use the pipe delimiter, for example 536|537, 5138|5139 and 16626|16627.

The gameres index contains a direct relation in its [Assets] section: AssetIndex, directory/name, BundleId. The [Bundles] section then resolves BundleId to BundleName and includes an asset-index expression. The corrected parser now uses the direct AssetIndex -> BundleId relation as the authoritative join and validates the [Bundles] expression, including pipe-separated values and numeric ranges.

## Validation

| Check | Result | Status |
|---|---:|---|
| Original asset-map rows | 24,558 | PASS |
| Existing mapped names confirmed against direct index join | 24,188 / 24,188 | PASS |
| Previously UNMAPPED rows recovered | 370 / 370 | PASS |
| Distinct bundles represented after repair | 1,576 | PASS |
| Recovered asset-index expressions validated | 370 / 370 | PASS |
| Missing asset/bundle references | 0 | PASS |
| Existing bundle-name mismatches | 0 | PASS |
| Package/index size mismatches | 0 | PASS |
| Repaired map V2 remaining UNMAPPED | 0 | PASS |

The 370 repaired rows resolve to 185 distinct bundles. Of those, 184 are present in the installed APK bundle manifest and one is present by exact filename in the current S21 cache. None are unavailable from both sources.

## Corrected coverage V2

| Metric | Count |
|---|---:|
| Distinct bundles | 1,576 |
| APK only | 1,518 |
| S21 cache only | 58 |
| Both sources by exact filename | 0 |
| Neither source | 0 |

| Category | Distinct bundles |
|---|---:|
| Building | 397 |
| CombatUI | 233 |
| Equipment | 120 |
| Hero | 422 |
| MapTerrain | 49 |
| Season | 248 |
| World | 108 |

The one newly recovered cache-only bundle is gameres_main_dir_prefabs_building_a_skin_snowman_d71ed52b78115ba6808c82bcda8e6944.bundle. Its index size is 11,489 bytes and the S21 filesystem reports 11,489 bytes.

## Artifacts

- parse-gameres-index.ps1 — reproducible PowerShell parser and validator.
- DARKWAR_GAMERES_UNMAPPED_REPAIR_2026-10-30.csv — 370-row patch keyed by AssetIndex, including corrected BundleId/BundleName and validation evidence.
- DARKWAR_GAMERES_BUNDLE_COVERAGE_V2_2026-10-30.csv — 1,576-row corrected source-availability coverage.
- The full corrected 24,558-row map V2 was generated locally and has zero UNMAPPED rows. The original four-part GitHub map remains immutable; apply the repair patch by AssetIndex or rerun the parser to reconstruct V2.

## Interpretation and limits

This fixes a parser/association defect, not a missing-payload problem. Exact filenames remain the canonical APK/cache join key. Normalized hash-suffix matching remains diagnostic only. No proprietary APK or AssetBundle payload was uploaded.
