# Dark War: Survival — Source and Manifest Register

**Checkpoint:** 2026-10-30  
**Purpose:** identify the authoritative role of each local source file and its GitHub counterpart. The source collection remains preserved locally; this register prevents duplicate or superseded extracts from being treated as independent evidence.

## Canonical source groups

| Group | Local source | Grain / size | Role | GitHub status |
|---|---|---:|---|---|
| Split APK inventory | `DARKWAR_SPLIT_APK_BUNDLE_INDEX_2026-10-30.csv` | 4,656 .bundle payload entries | Installed-package presence and uncompressed size | Uploaded; exact payload count confirmed against current S21 package |
| Datatable map | `DARKWAR_DATATABLE_ASSET_BUNDLE_MAP_2026-10-30.csv` | 1,064 asset-index records | Table-to-bundle mapping; 938 .bytes records | Uploaded |
| Gameplay system trace | `DARKWAR_SYSTEM_BUNDLE_TRACE_2026-10-30.md` | 324 gameplay-relevant mappings | Human-readable selected datatable trace | Summarized in coverage/findings; original detailed report remains local |
| Lua module trace | `DARKWAR_LUA_MODULE_BUNDLE_TRACE_2026-10-30.csv/.md` | 66 module records; 30 bundles | Lua module-to-bundle mapping | CSV uploaded; report summarized |
| Lua binary TextAsset export | `DARKWAR_LUA_BINARY_EXPORT_MANIFEST_2026-10-30.csv` | 12,370 TextAsset `.bytes` records; 30 bundles | Per-file relative path, byte length, SHA-256 and observed header family | Mirrored as 13 metadata CSV parts; original binary payloads remain local |
| APK/cache union V2 | `DARKWAR_INSTALLED_PACKAGE_BUNDLE_COVERAGE_V2_2026-10-30.csv/.md` | 1,473 rows | Historical selected-source crosswalk; superseded by V3 after parser repair | Uploaded; historical only |
| APK/cache union V3 | `DARKWAR_INSTALLED_PACKAGE_BUNDLE_COVERAGE_V3_2026-10-30.csv` | 1,658 rows | Current selected-source crosswalk: 52 datatable + 30 Lua + 1,576 gameres | Uploaded; canonical |
| Gamerares category coverage V1 | `DARKWAR_GAMERES_BUNDLE_COVERAGE_2026-10-30.csv/.md` | 1,392 rows | Historical category/source rollup with one UNMAPPED placeholder | Uploaded; superseded |
| Gamerares category coverage V2 | `DARKWAR_GAMERES_BUNDLE_COVERAGE_V2_2026-10-30.csv` | 1,576 rows | Corrected category/source rollup; no placeholder | Uploaded; canonical |
| Gamerares detailed asset map | `DARKWAR_GAMERES_GAMEPLAY_ASSET_BUNDLE_MAP_2026-10-30.csv/.md` | 24,558 asset rows; 4,814,955 bytes | Original fine-grained asset path to bundle map | Mirrored as four immutable CSV parts; apply the 370-row repair patch for corrected V2 |
| Gamerares UNMAPPED repair patch | `DARKWAR_GAMERES_UNMAPPED_REPAIR_2026-10-30.csv` | 370 rows; 185 bundles | Corrected AssetIndex -> BundleId -> BundleName associations | Uploaded; all 370 PASS |
| Complete data/Lua integrity | `DARKWAR_COMPLETE_BUNDLE_HASH_MANIFEST_2026-10-30.csv` | 82 payload records | Canonical SHA-256 and size evidence for 52 datatable + 30 Lua bundles | Uploaded |
| Initial staging integrity | `DARKWAR_COLLECTION_HASH_MANIFEST_2026-10-30.csv` | 78 payload records | Historical first-pass staging inventory | Uploaded; historical only, not canonical complete set |
| Hero model integrity | `DARKWAR_HERO_MODEL_ASSET_MANIFEST_2026-10-30.csv` | 114 payload records | Selected APK-packaged hero model bundle integrity | Uploaded |
| Hero model directory map | `DARKWAR_HERO_MODEL_DIRECTORY_MAP_2026-10-30.csv/.md` | 396 directory rows; 76 candidate folders | Folder structure, set and season tags | CSV uploaded; report summarized |
| Map/season integrity | `DARKWAR_MAP_SEASON_ASSET_MANIFEST_2026-10-30.csv` | 54 payload records | Selected map/season bundle integrity | Uploaded |
| S21 cache hash inventory | `PHONE_ASSETBUNDLE_SHA256_2026-10-30.csv` | 319 file records (311 bundles + 4 indexes + 4 version markers) | Current phone-cache file names and SHA-256 | Uploaded; derived metadata only |

## GitHub data layout

- `data/manifests/` — uploaded source CSVs (derived metadata only; no bundle payloads).
- `data/manifests/lua-binary/` — 12,370-row Lua TextAsset metadata manifest split into 13 CSV parts, plus per-bundle summary and reconciliation.
- `engineering/` — reconciled findings, coverage, source register, direct S21 audit and handoff.
- `../index.md` and `../data-dictionary.md` — earlier screenshot-derived reference catalog.

## Which file controls which question?

1. **Does a selected bundle exist in either source?** Use the V3 APK/cache coverage CSV.
2. **Which datatable asset maps to which bundle?** Use the datatable asset map; use the 324-row system trace for the selected gameplay subset.
3. **Which Lua module maps to which bundle?** Use the Lua module trace.
4. **Did the selected extracted payload match expected size and SHA-256?** Use the complete integrity manifest (82), hero manifest (114), or map/season manifest (54), depending on collection.
5. **What is the category-level gameres availability?** Use gameres coverage V2 and the duplicate/category caveats in [crosswalk findings](crosswalk-findings-2026-10-30.md).
6. **What exact gameres asset path was indexed?** Use the original 24,558-row map plus the 370-row repair patch, or rerun the parser script to reconstruct the corrected V2 map.
7. **Which Lua TextAssets were exported and integrity-checked?** Use the 13-part Lua binary export manifest; use its per-bundle summary for aggregate counts and TextAsset-set SHA-256. Exact Lua version/decompilation status remains NOT RUN.

## Historical versus canonical

- The 78-row initial collection manifest records a first staging pass. It is not a replacement for the later 82-row complete datatable/Lua manifest.
- `GameplaySystems_2026-10-30`, `All_Datatable_Cached_2026-10-30`, `APK_Packaged_Datatable_2026-10-30`, `GameplayLogic_Cached_2026-10-30`, `APK_Packaged_Lua_2026-10-30`, and `APK_Packaged_Hero_Map_Season_2026-10-30` are staging/source folders. Prefer the complete named working sets from the collection index.
- The older installed-package coverage report is superseded by V2 for APK/cache reconciliation. Keep it as historical context; do not delete it.

## Public-data boundary

Only metadata CSVs and derived summaries are published. APKs, Unity bundles, models, textures, audio, account/session data, tokens, private configuration and local absolute paths are not included.
