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
- Historical first-pass status: 370 selected asset rows were initially unmapped by the range parser. This was resolved later by DQ-08 using the direct AssetIndex -> BundleId join; zero remain unmapped in corrected local V2.

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

Status: **PARTIALLY RESOLVED**. The four index headers all read `#30491.250.670`. Each adjacent `.version` marker matches its index's actual byte length, CRC32 and `[Version]` integer (4/4 PASS). The separate CheckVersion/package value `1.250.669;1629` remains a different source and its relationship to the resource build header is still BLOCKED; a post-install resource update is plausible but unconfirmed.

### DQ-04 — Initial staging vs complete manifest
- Initial staging manifest: 78 records.
- Complete data/Lua manifest: 82 records.
- They refer to different collection stages and selected sets. They are not contradictory counts.
- Status: **PASS — explained by grain/scope**. Keep the 78-row manifest historical.

### DQ-05 — Split APK archive entry count
- The engineering log records 4,670 total ZIP entries for an earlier ZIP listing.
- The later split APK bundle index contains 4,656 AssetBundle entries.
- These counts refer to different grains (all ZIP entries versus AssetBundle entries); do not report them as conflicting counts.

### DQ-06 — Detailed gameres asset map mirror (RESOLVED)
- The source CSV contains 24,558 data rows and is approximately 4.8 MB.
- It is now mirrored as four CSV parts under `data/manifests/`, each with the same header. Part 1 contains 7,999 data rows; Parts 2 and 3 contain 8,000 each; Part 4 contains 559. Total: 24,558 data rows.
- No asset payloads were included. The original local CSV was not modified.
- Status: **PASS — all four part files were created and GitHub returned a blob SHA for each. Part 4 content was fetched back; Parts 1–3 are above the connector's content-return threshold and return blob metadata with an empty body. Full row-level reassembly/hash comparison is NOT RUN.**

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

1. Obtain a trusted full Lua 5.4.9 and Lua 5.5.1 parser/disassembler path; validate complete chunk loading on the six representative samples before semantic analysis.
2. Wait for the established AssetRipper RAM gate, then export one small relevant DataTable bundle at a time.
3. Reconcile actual decompiled GetTableData callsites with the DataTable asset map; keep direct printable tokens, candidates and confirmed callsites as separate evidence levels.
4. Extract conclusions about construction costs/upgrades, hero stats/skills, equipment bonuses, seasons and events only from parsed table payloads and confirmed module links.


## 7. DQ-07 — Direct S21 package/cache audit (2026-10-30)

- The currently installed five APK splits were inspected read-only on the Galaxy S21.
- The install-time pack contains 4,670 ZIP entries; 4,664 paths are under assets/AssetBundles. Of those, 4,656 are .bundle payloads and 8 are index/control files. The canonical 4,656-row split APK CSV counts payloads only; the full 4,664-path local listing matches the phone exactly.
- Across all five split APKs: 5,801 ZIP entries and 5,785 unique path strings.
- The external cache contains 319 files: 311 bundles (161 gameres, 46 datatable, 104 Lua), four index files and four version markers. All 319 files were SHA-256 hashed.
- Phone and local SHA-256 values match for all four index files; all four version marker contents match.
- Comparing cache bundle names with the 4,656 package bundle payload names gives 0 exact filename matches, 291 candidate logical-name matches after diagnostic removal of the trailing 32-hex suffix, and 20 cache-only candidate logical names. Do not treat normalized names as canonical keys or as proof of identical payloads.
- The 20 cache-only names are consistent with assets available in the runtime cache but absent from the package's bundle-name set; their source is not proven.
- This audit has a broader scope than the selected 1,391-gameres union above. Keep exact bundle-name joins for canonical analysis and retain the normalized-name comparison only as a diagnostic.
- Status: **PASS** for package/cache inventory and index/marker hash comparison; **BLOCKED** for CheckVersion/index-header release alignment; **NOT RUN** for extracting every installed payload.
- Full details: [Direct S21 package/cache audit](phone-audit-2026-10-30.md). The sanitized 319-row manifest is [PHONE_ASSETBUNDLE_SHA256_2026-10-30.csv](../data/manifests/PHONE_ASSETBUNDLE_SHA256_2026-10-30.csv).


## DQ-08 — Gamerares parser repair and union refresh (2026-10-30)

- The 370 previously UNMAPPED rows were traced to pipe-separated asset-index expressions in [Bundles], for example 536|537. All 370 asset IDs resolve through the direct [Assets] AssetIndex -> BundleId relation and all 370 expressions validate.
- 24,188 existing mappings match the direct index join; 370 were recovered; 0 missing references and 0 mismatches.
- The corrected detailed map has 24,558 rows and 0 UNMAPPED rows in the local V2 output. The 370-row repair patch is mirrored by AssetIndex; the original four-part map remains immutable.
- Corrected gameres coverage V2 has 1,576 distinct bundles: 1,518 APK-only, 58 cache-only, 0 both, 0 missing.
- The refreshed multi-catalog union V3 has 1,658 rows: 52 datatable, 30 lua-gameplay, 1,576 gameres-selected; 1,552 APK-only, 106 cache-only, 0 both, 0 missing.
- 34/34 selected datatable/Lua payloads present in the APK have matching package sizes; no size differences.
- The older 1,391-bundle selected-gameres union and 1,392-row category CSV are retained as V1 historical artifacts, not the current source of truth.
- Canonical artifacts: [union V3](../data/manifests/DARKWAR_INSTALLED_PACKAGE_BUNDLE_COVERAGE_V3_2026-10-30.csv), [gameres coverage V2](../data/manifests/DARKWAR_GAMERES_BUNDLE_COVERAGE_V2_2026-10-30.csv), [repair patch](../data/manifests/DARKWAR_GAMERES_UNMAPPED_REPAIR_2026-10-30.csv), [parser validation](gameres-parser-fix-2026-10-30.md).
- Status: **PASS** — parser repair and source coverage refresh. Version marker namespace alignment remains **BLOCKED**.


## DQ-09 — Resource index marker integrity (2026-10-30)

- All four index headers are #30491.250.670.
- Each subsystem .version file stores subsystem version, index byte size and CRC32. Independent size/CRC32 checks pass for gameres (5,164,473 / 105024197), datatable (39,085 / 4029693006), lua (2,396,329 / 1497796709), and download (271 / 3124353645).
- Phone/local index SHA-256 comparisons pass 4/4.
- Index file timestamps are 2026-10-30 10:55; .version files 10:56. CheckVersion.txt is timestamped 2026-10-29 22:00; package lastUpdateTime is 2026-10-29 19:18:55.
- Status: **PASS** for subsystem marker integrity. **BLOCKED** only for the semantic relationship between client package/CheckVersion 1.250.669;1629 and resource index header #30491.250.670. A post-install resource update is plausible but not proven.


## 8. DQ-10 — Targeted Lua binary export (2026-10-30)

- All 30 unique bundles in the existing Lua module crosswalk were imported/exported one at a time through AssetRipper.
- Final reconciled output: 19,090 files / 77,063,517 bytes, comprising 12,370 TextAsset `.bytes` files (65,672,743 bytes) and 6,720 JSON sidecars.
- All 12,370 TextAsset files have per-file SHA-256 records. The metadata manifest is mirrored in 13 CSV parts; the original binary payloads remain local.
- Original source bundle SHA-256 matches the canonical 82-row data/Lua integrity manifest for 30/30 bundles.
- Two header families were observed: 6,185 records with `03-54-00-19-93...` and 6,185 with `A8-55-00-19-93...`. These are header-family labels only; exact Lua version and custom bytecode transformation remain NOT RUN.
- One UI bundle had a late-arriving export file: the first measurement recorded 617 files, final tree contained 618. The final reconciliation records the delta and passes.
- The cumulative AssetRipper log contains 3,172 warning lines from 52 distinct asset names repeated 61 times. The log is cumulative and cannot be attributed solely to this run; zero warning names matched exported `.bytes` basenames.
- Status: **PASS** for 30/30 targeted bundle exports, final directory reconciliation and source-bundle SHA-256. **NOT RUN** for semantic decompilation, exact Lua version identification, full APK extraction and runtime validation.
- Evidence: [Lua binary export report](lua-binary-export-2026-10-30.md), [manifest parts index](../data/manifests/lua-binary/README.md), [per-bundle summary](../data/manifests/lua-binary/DARKWAR_LUA_BINARY_EXPORT_SUMMARY_2026-10-30.csv), [reconciliation](../data/manifests/lua-binary/DARKWAR_LUA_BINARY_EXPORT_RECONCILIATION_2026-10-30.csv), and [warning summary](../data/manifests/lua-binary/DARKWAR_ASSETRIPPER_EXPORT_WARNINGS_2026-10-30.csv).


## 9. DQ-11 — Lua bytecode format validation (2026-10-30)

- All 12,370 raw AssetRipper TextAsset `.bytes` files from the 30 targeted Lua bundles were checked with a binary-safe Node.js validator.
- PASS: 6,185 files match the official Lua 5.4 chunk-header structure (`version byte 0x54`); 6,185 match the official Lua 5.5 structure (`version byte 0x55`).
- Both families begin with the Lua signature `1B 4C 75 61`, format byte 0 and LUAC_DATA sentinel. The additional byte at offset 4 is `0x03` for Lua 5.4 and `0xA8` for Lua 5.5; its application-specific meaning is NOT DETERMINED.
- PASS: version-specific size fields and numeric sentinels match the official Lua 5.4.9 and 5.5.1 header definitions for all 12,370 files. Zero invalid, zero empty and zero non-Lua files.
- PASS: six representative files (HeroDataManager, HeroEquipManager and HeroLevelUpTemplateManager, base and 55 variants) pass independently.
- Full chunk body/prototype/instruction validation, semantic disassembly and decompilation remain NOT RUN. Header compatibility is not a claim that all code bodies were successfully interpreted.
- Evidence: [Lua format and crosswalk report](lua-format-and-crosswalk-2026-10-30.md), [corpus summary](../data/manifests/DARKWAR_LUA_HEADER_CORPUS_VALIDATION_2026-10-30.csv), [six samples](../data/manifests/DARKWAR_LUA_HEADER_SAMPLE_VALIDATION_2026-10-30.csv).

## 10. DQ-12 — Lua/DataTable crosswalk and system inventory (2026-10-30)

- The crosswalk contains 66 Lua module records across 30 bundles.
- PASS at token-evidence level: 34 exact printable ASCII table-token reference rows across 8 modules and 12 table names.
- Candidate-only evidence: 14 rows across HeroLevelUpTemplateManager (2 MEDIUM), OffSeasonManager and SeasonGroupManager (12 LOW total).
- Crosswalk V2 record statuses: 20 direct-token matches, 36 with no direct table token in the text projection and 10 semantic links blocked pending full bytecode decompilation.
- Exact printable tokens were obtained from AssetRipper Text projection, not a byte-preserving parser. They do not prove a runtime callsite or selected variant.
- The canonical DataTable map has 1,064 asset-index records / 938 `.bytes` table records / 60 bundle names. Indexed families include building (22 records), heroes (56), equipment (20), seasons (44), activities (42) and events (14). These are index-name counts including base/55 variants, not gameplay table row counts.
- DataTable payload export remains BLOCKED at this checkpoint: free RAM was ~488 MB, below the prior AssetRipper startup gate of ~875–975 MB. No DataTable import was attempted.
- Evidence: [Lua format and crosswalk report](lua-format-and-crosswalk-2026-10-30.md), [module crosswalk V2](../data/manifests/DARKWAR_LUA_DATATABLE_MODULE_CROSSWALK_V2_2026-10-30.csv), [direct references](../data/manifests/DARKWAR_LUA_DATATABLE_DIRECT_REFERENCES_2026-10-30.csv), [candidate references](../data/manifests/DARKWAR_LUA_DATATABLE_CANDIDATE_REFERENCES_2026-10-30.csv).
