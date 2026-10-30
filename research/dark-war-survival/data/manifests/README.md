# Dark War: Survival — Mirrored Metadata Manifests

All files in this directory are derived metadata CSVs. No APK, Unity AssetBundle, model, texture, audio, account/session database, token or private configuration is stored here.

## Dataset register
See [dataset register](DARKWAR_MANIFEST_DATASET_REGISTER_2026-10-30.csv) for row counts, grain, canonical role, mirror status and caveats.

## Primary files
- [APK/cache source union V3](DARKWAR_INSTALLED_PACKAGE_BUNDLE_COVERAGE_V3_2026-10-30.csv) — current 1,658-row selected bundle availability crosswalk (52 datatable + 30 Lua + 1,576 gameres).
- [APK/cache source union V2](DARKWAR_INSTALLED_PACKAGE_BUNDLE_COVERAGE_V2_2026-10-30.csv) — historical 1,473-row crosswalk; superseded.
- [Complete datatable + Lua integrity manifest](DARKWAR_COMPLETE_BUNDLE_HASH_MANIFEST_2026-10-30.csv) — 82 size/SHA-256 records.
- [Datatable asset map](DARKWAR_DATATABLE_ASSET_BUNDLE_MAP_2026-10-30.csv) — 1,064 asset-index records.
- [Lua module trace](DARKWAR_LUA_MODULE_BUNDLE_TRACE_2026-10-30.csv) — 66 module records.
- [Gamerares category coverage V2](DARKWAR_GAMERES_BUNDLE_COVERAGE_V2_2026-10-30.csv) — corrected 1,576-bundle category/source rollup; no UNMAPPED placeholder.
- [Gamerares category coverage V1](DARKWAR_GAMERES_BUNDLE_COVERAGE_2026-10-30.csv) — historical 1,392-row file; superseded.
- [Gamerares UNMAPPED repair patch](DARKWAR_GAMERES_UNMAPPED_REPAIR_2026-10-30.csv) — 370 AssetIndex-keyed corrections resolving 185 bundle names.
- [Hero model payload manifest](DARKWAR_HERO_MODEL_ASSET_MANIFEST_2026-10-30.csv) — 114 bundle payload integrity records.
- [Hero model directory map](DARKWAR_HERO_MODEL_DIRECTORY_MAP_2026-10-30.csv) — 396 directory records / 76 candidate folders.
- [Map/season payload manifest](DARKWAR_MAP_SEASON_ASSET_MANIFEST_2026-10-30.csv) — 54 bundle payload integrity records.
- [Split APK AssetBundle index](DARKWAR_SPLIT_APK_BUNDLE_INDEX_2026-10-30.csv) — 4,656 installed-package .bundle payload entries (8 index/control paths are counted separately in the full ZIP directory inventory).
- [S21 AssetBundles cache SHA-256 manifest](PHONE_ASSETBUNDLE_SHA256_2026-10-30.csv) — 319 files: 311 cached bundles plus four index files and four version markers.
- [Gamerares parser repair validation](../engineering/gameres-parser-fix-2026-10-30.md) — 370/370 repaired UNMAPPED asset rows; 1,576 distinct gameres bundles.
- [Parser script](../tools/parse-gameres-index.ps1) — reproducible direct AssetIndex-to-BundleId parser with pipe/range validation.

Historical [initial staging hash manifest](DARKWAR_COLLECTION_HASH_MANIFEST_2026-10-30.csv) is preserved but is not the canonical complete-set manifest.

The 24,558-row detailed gameres asset map is mirrored in four parseable original CSV parts. Apply the 370-row repair patch by AssetIndex, or rerun [parse-gameres-index.ps1](../tools/parse-gameres-index.ps1), to reconstruct corrected V2. The original map is mirrored in four parseable CSV parts: [Part 1](DARKWAR_GAMERES_GAMEPLAY_ASSET_BUNDLE_MAP_PART_01_OF_04_2026-10-30.csv), [Part 2](DARKWAR_GAMERES_GAMEPLAY_ASSET_BUNDLE_MAP_PART_02_OF_04_2026-10-30.csv), [Part 3](DARKWAR_GAMERES_GAMEPLAY_ASSET_BUNDLE_MAP_PART_03_OF_04_2026-10-30.csv), and [Part 4](DARKWAR_GAMERES_GAMEPLAY_ASSET_BUNDLE_MAP_PART_04_OF_04_2026-10-30.csv). Each part repeats the same header; concatenate only the data rows (skip headers after Part 1) to reconstruct the original row sequence.
