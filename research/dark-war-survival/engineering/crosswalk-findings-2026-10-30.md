# Dark War: Survival — Manifest and Report Crosswalk

**Checkpoint:** 2026-10-30  
**Method:** reconcile local CSV line counts, report summaries, manifest grains, APK directory inventory, S21 cache inventory and SHA-256 validation summaries. No source payload was modified.

## 1. Unified inventory

| Evidence set | Rows / files | What the count means | Controlling artifact |
|---|---:|---|---|
| Installed split APK AssetBundles | 4,656 | AssetBundle entries in the split APK index; the ZIP archive's total entry count can be larger | Split APK bundle index |
| Datatable index | 1,064 | Asset-index records, including 938 .bytes table records | Datatable asset-to-bundle map |
| Gameplay-relevant datatable trace | 324 | Selected gameplay-relevant mappings, not the entire datatable index | System bundle trace |
| Full datatable bundle catalog | 60 | Distinct bundle records in the full datatable mapping report | Datatable map/report |
| Targeted gameplay datatable set | 52 | Selected bundles reconciled across APK and cache | V2 coverage + complete hash manifest |
| Lua gameplay trace | 66 | Targeted module records mapped to 30 bundles | Lua module trace |
| Targeted gameplay Lua set | 30 | Selected bundles reconciled across APK and cache | V2 coverage + complete hash manifest |
| Selected gameres asset map | 24,558 | Fine-grained asset rows; 3,962 bundle records were parsed in the report | Local detailed gameres map |
| Selected gameres coverage | 1,391 actual bundles | V2 union count after excluding the `UNMAPPED` placeholder row | V2 coverage + gameres coverage CSV |
| Hero model directory map | 396 | Directory records grouped into 76 candidate model folders | Hero directory map |
| Selected hero model payloads | 114 | Extracted bundle payloads with size/hash checks | Hero asset manifest |
| Selected map/season payloads | 54 | Extracted bundle payloads with size/hash checks | Map/season manifest |
| Initial staging manifest | 78 | Historical first-pass staged payload records | Initial collection hash manifest |
| Complete data + Lua manifest | 82 | 52 datatable + 30 Lua payload records | Complete bundle hash manifest |

These are different grains. Do not add them together or compare their row counts as though they represented the same kind of object.

## 2. APK/cache source reconciliation

### Datatable
- Targeted set: 52 bundles.
- APK-only: 28.
- S21-cache-only: 24.
- Present in both: 0.
- Missing from both: 0.
- Size + SHA-256: 52/52 PASS.

The full datatable map covers 1,064 index records and 60 bundle records. The 52-bundle targeted gameplay set is a selected subset, not the entire 60-bundle catalog.

### Lua gameplay
- Targeted set: 30 bundles.
- APK-only: 6.
- S21-cache-only: 24.
- Present in both: 0.
- Missing from both: 0.
- Size + SHA-256: 30/30 PASS.

The module trace contains 66 records mapped to 30 bundles. The trace's note of 22 new local copies is a separate collection-history metric and must not be substituted for the 6 APK-only bundles.

### Gamerares
- Selected distinct bundles: 1,391.
- APK-only: 1,334.
- S21-cache-only: 57.
- Present in both: 0.
- Missing from both within the selected inventory: 0.
- 370 selected asset rows remain unmapped by the current range parser. They are not missing bundles.

Category counts in the consolidated coverage report: Hero 378, Season 190, MapTerrain 42, Building 389, Equipment 99, CombatUI 207, World 87. Categories may overlap; do not sum them to derive the 1,391 total.

## 3. Integrity manifests

| Manifest | Data rows | Validation result |
|---|---:|---|
| Complete datatable + Lua | 82 | 82/82 size and SHA-256 PASS |
| Hero model payloads | 114 | 114/114 size and SHA-256 PASS |
| Map/season payloads | 54 | 54/54 size and SHA-256 PASS |
| Initial staging collection | 78 | Historical first-pass inventory; not the canonical complete-set manifest |

The 76 hero model folders are candidates inferred from directory structure, not a confirmed playable or unlocked hero roster.

Map/season set composition: 42 map-terrain bundles, 8 S5 scene bundles, 3 S7 scene bundles, and one on-demand Ben hero prefab.

## 4. Discrepancies and quality risks

### DQ-01 — Hero category count: 378 actual bundles vs 379 rows (RESOLVED)
- The V2 APK/cache crosswalk contains 378 Hero bundles.
- The category coverage CSV contains 379 Hero rows: 378 actual named bundles plus the literal placeholder `UNMAPPED`.
- Exact-key comparison confirmed that `UNMAPPED` is the only extra value; it is not an installed bundle.
- Status: **PASS — explained by an unmapped asset placeholder**. Use 378 as the actual Hero bundle count and retain the `UNMAPPED` row as parser-quality evidence.

### DQ-02 — Gamerares coverage CSV rows vs actual bundle count (RESOLVED)
- The cleaned category coverage CSV has 1,392 data rows and 1,392 distinct BundleName values.
- Exact set comparison with the 1,391 `gameres-selected` rows in V2 found one additional value: `UNMAPPED`.
- No duplicate bundle-name keys exist in the cleaned category coverage CSV.
- Status: **PASS — one placeholder row explains the one-row difference**. The actual APK/cache union remains 1,391 bundles.

### DQ-03 — Version marker alignment
Observed markers:
- CheckVersion: 1.250.669;1629
- Local index header: #30491.250.670
- gameres.version: 1333,5164473,105024197
- datatable.version: 1631,39085,4029693006
- lua.version: 1760,2396329,1497796709
- download.version: 911,271,3124353645

Status: **BLOCKED / NEEDS RECONCILIATION**. These values have different formats and may represent independent index versions/build markers. Do not infer a same-build guarantee.

### DQ-04 — Initial staging vs complete manifest
- Initial staging manifest: 78 records.
- Complete data/Lua manifest: 82 records.
- They refer to different collection stages and selected sets. They are not contradictory counts.
- Status: **PASS — explained by grain/scope**. Keep the 78-row manifest historical.

### DQ-05 — Split APK archive entry count
- The engineering log records 4,670 total ZIP entries for an earlier ZIP listing.
- The later split APK bundle index contains 4,656 AssetBundle entries.
- These counts refer to different grains (all ZIP entries versus AssetBundle entries); do not report them as conflicting counts.

### DQ-06 — Detailed gameres asset map not yet mirrored to GitHub
- The local detailed CSV contains 24,558 rows and is approximately 4.8 MB.
- The category/source summaries and all other key metadata manifests are mirrored to GitHub. This large granular file remains in controlled local storage for now; no asset payload is involved.
- Status: **NOT RUN** for a public sanitized partition/export. Its summary remains documented here.

## 5. Canonical join strategy

Use normalized bundle name as the cross-source key:
1. Datatable asset map: `BundleName` (bundle-level key derived from each asset row).
2. Lua trace: `BundleName`.
3. Split APK index: exact bundle entry name.
4. V2 coverage: `BundleName` plus `Catalog`.
5. Integrity manifests: `File` or `BundleName`, depending on manifest schema.
6. Hero/map asset manifests: exact bundle name; compare expected byte count and SHA-256.

Keep `Catalog` in the key when joining V2 coverage because different catalogs may have overlapping or similar names. Normalize case and whitespace only; do not strip hash suffixes or alter names.

## 6. Next reconciliation tasks

1. Reconcile version markers and establish which index snapshots belong to the same release/build.
2. Partition/sanitize the 24,558-row gameres map if a GitHub mirror is useful; keep the original unchanged.
3. Continue lightweight, read-only parser work on the 370 unmapped asset rows.
