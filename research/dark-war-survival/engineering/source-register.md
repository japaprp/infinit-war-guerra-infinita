# Dark War: Survival — Source and Manifest Register

**Checkpoint:** 2026-10-30  
**Purpose:** identify the authoritative role of each local source file and its GitHub counterpart. The source collection remains preserved locally; this register prevents duplicate or superseded extracts from being treated as independent evidence.

## Canonical source groups

| Group | Local source | Grain / size | Role | GitHub status |
|---|---|---:|---|---|
| Split APK inventory | `DARKWAR_SPLIT_APK_BUNDLE_INDEX_2026-10-30.csv` | 4,656 AssetBundle entries | Installed-package presence and uncompressed size | Uploaded |
| Datatable map | `DARKWAR_DATATABLE_ASSET_BUNDLE_MAP_2026-10-30.csv` | 1,064 asset-index records | Table-to-bundle mapping; 938 .bytes records | Uploaded |
| Gameplay system trace | `DARKWAR_SYSTEM_BUNDLE_TRACE_2026-10-30.md` | 324 gameplay-relevant mappings | Human-readable selected datatable trace | Summarized in coverage/findings; original detailed report remains local |
| Lua module trace | `DARKWAR_LUA_MODULE_BUNDLE_TRACE_2026-10-30.csv/.md` | 66 module records; 30 bundles | Lua module-to-bundle mapping | CSV uploaded; report summarized |
| APK/cache union | `DARKWAR_INSTALLED_PACKAGE_BUNDLE_COVERAGE_V2_2026-10-30.csv/.md` | 1,473 rows in CSV | Canonical source-availability crosswalk for selected datatable, Lua and gameres sets | CSV uploaded; report summarized |
| Gamerares category coverage | `DARKWAR_GAMERES_BUNDLE_COVERAGE_2026-10-30.csv/.md` | 1,392 CSV rows | Category/source availability; includes one UNMAPPED placeholder and 1,391 actual bundles | CSV uploaded; report summarized |
| Gamerares detailed asset map | `DARKWAR_GAMERES_GAMEPLAY_ASSET_BUNDLE_MAP_2026-10-30.csv/.md` | 24,558 asset rows; 4,814,955 bytes | Fine-grained asset path to bundle map | Mirrored as four CSV parts; summary and limitations published |
| Complete data/Lua integrity | `DARKWAR_COMPLETE_BUNDLE_HASH_MANIFEST_2026-10-30.csv` | 82 payload records | Canonical SHA-256 and size evidence for 52 datatable + 30 Lua bundles | Uploaded |
| Initial staging integrity | `DARKWAR_COLLECTION_HASH_MANIFEST_2026-10-30.csv` | 78 payload records | Historical first-pass staging inventory | Uploaded; historical only, not canonical complete set |
| Hero model integrity | `DARKWAR_HERO_MODEL_ASSET_MANIFEST_2026-10-30.csv` | 114 payload records | Selected APK-packaged hero model bundle integrity | Uploaded |
| Hero model directory map | `DARKWAR_HERO_MODEL_DIRECTORY_MAP_2026-10-30.csv/.md` | 396 directory rows; 76 candidate folders | Folder structure, set and season tags | CSV uploaded; report summarized |
| Map/season integrity | `DARKWAR_MAP_SEASON_ASSET_MANIFEST_2026-10-30.csv` | 54 payload records | Selected map/season bundle integrity | Uploaded |

## GitHub data layout

- `data/manifests/` — uploaded source CSVs (derived metadata only; no bundle payloads).
- `engineering/` — reconciled findings, coverage, source register and handoff.
- `../index.md` and `../data-dictionary.md` — earlier screenshot-derived reference catalog.

## Which file controls which question?

1. **Does a selected bundle exist in either source?** Use the V2 APK/cache coverage CSV.
2. **Which datatable asset maps to which bundle?** Use the datatable asset map; use the 324-row system trace for the selected gameplay subset.
3. **Which Lua module maps to which bundle?** Use the Lua module trace.
4. **Did the selected extracted payload match expected size and SHA-256?** Use the complete integrity manifest (82), hero manifest (114), or map/season manifest (54), depending on collection.
5. **What is the category-level gameres availability?** Use the gameres coverage CSV/report, with the duplicate/category caveats in [crosswalk findings](crosswalk-findings-2026-10-30.md).
6. **What exact gameres asset path was indexed?** The full 24,558-row local map remains the detailed source; the GitHub report records its row count, parser limits and category-level reconciliation.

## Historical versus canonical

- The 78-row initial collection manifest records a first staging pass. It is not a replacement for the later 82-row complete datatable/Lua manifest.
- `GameplaySystems_2026-10-30`, `All_Datatable_Cached_2026-10-30`, `APK_Packaged_Datatable_2026-10-30`, `GameplayLogic_Cached_2026-10-30`, `APK_Packaged_Lua_2026-10-30`, and `APK_Packaged_Hero_Map_Season_2026-10-30` are staging/source folders. Prefer the complete named working sets from the collection index.
- The older installed-package coverage report is superseded by V2 for APK/cache reconciliation. Keep it as historical context; do not delete it.

## Public-data boundary

Only metadata CSVs and derived summaries are published. APKs, Unity bundles, models, textures, audio, account/session data, tokens, private configuration and local absolute paths are not included.
