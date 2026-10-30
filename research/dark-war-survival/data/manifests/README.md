# Dark War: Survival — Mirrored Metadata Manifests

All files in this directory are derived metadata CSVs. No APK, Unity AssetBundle, model, texture, audio, account/session database, token or private configuration is stored here.

## Dataset register
See [dataset register](DARKWAR_MANIFEST_DATASET_REGISTER_2026-10-30.csv) for row counts, grain, canonical role, mirror status and caveats.

## Primary files
- [APK/cache source union V2](DARKWAR_INSTALLED_PACKAGE_BUNDLE_COVERAGE_V2_2026-10-30.csv) — canonical selected bundle availability crosswalk.
- [Complete datatable + Lua integrity manifest](DARKWAR_COMPLETE_BUNDLE_HASH_MANIFEST_2026-10-30.csv) — 82 size/SHA-256 records.
- [Datatable asset map](DARKWAR_DATATABLE_ASSET_BUNDLE_MAP_2026-10-30.csv) — 1,064 asset-index records.
- [Lua module trace](DARKWAR_LUA_MODULE_BUNDLE_TRACE_2026-10-30.csv) — 66 module records.
- [Gamerares category coverage](DARKWAR_GAMERES_BUNDLE_COVERAGE_2026-10-30.csv) — category/source rollup.
- [Hero model payload manifest](DARKWAR_HERO_MODEL_ASSET_MANIFEST_2026-10-30.csv) — 114 bundle payload integrity records.
- [Hero model directory map](DARKWAR_HERO_MODEL_DIRECTORY_MAP_2026-10-30.csv) — 396 directory records / 76 candidate folders.
- [Map/season payload manifest](DARKWAR_MAP_SEASON_ASSET_MANIFEST_2026-10-30.csv) — 54 bundle payload integrity records.
- [Split APK AssetBundle index](DARKWAR_SPLIT_APK_BUNDLE_INDEX_2026-10-30.csv) — 4,656 installed-package AssetBundle entries.

Historical [initial staging hash manifest](DARKWAR_COLLECTION_HASH_MANIFEST_2026-10-30.csv) is preserved but is not the canonical complete-set manifest.

The 24,558-row [detailed gameres asset map](../engineering/crosswalk-findings-2026-10-30.md#dq-06--detailed-gameres-asset-map-not-yet-mirrored-to-github) remains in controlled local storage pending a partitioned/sanitized export.
