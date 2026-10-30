# Dark War: Survival — Direct S21 Package and Cache Audit

**Checkpoint:** 2026-10-30  
**Method:** read-only ADB inspection of the installed package and external AssetBundles cache; ZIP central-directory listing on-device. No 2.08 GB APK was copied or extracted wholesale.

## 1. Device and installed package

- Device: Samsung Galaxy S21, model SM-G991B.
- Package: com.readygo.dark.gp.
- versionName: 1.250.669.
- versionCode: 1629.
- lastUpdateTime: 2026-10-29 19:18:55.
- Installed APK components: base.apk, split_config.arm64_v8a.apk, split_gpdeku.apk, split_gpdeku.config.arm64_v8a.apk, split_install_time_pack.apk.
- The install-time pack is 2,082,044,905 bytes. It was inspected through ZIP metadata only; it was not copied to the PC.

## 2. Installed split APK inventory

The ZIP central directory was enumerated directly on the phone for all five installed APKs. Across all five splits there are 5,801 ZIP entries and 5,785 unique path strings (16 repeated path occurrences in the aggregate). Per-split ZIP entry counts: base.apk 1,109; split_config.arm64_v8a.apk 12; split_gpdeku.apk 4; split_gpdeku.config.arm64_v8a.apk 6; split_install_time_pack.apk 4,670. Top-level path groups across the five ZIPs: assets 4,931; res 617; org 128; META-INF 60; root-level 49; lib 8; kotlin 7; okhttp3 1.

| Component | AssetBundle entries |
|---|---:|
| base.apk | 0 |
| split_config.arm64_v8a.apk | 0 |
| split_gpdeku.apk | 0 |
| split_gpdeku.config.arm64_v8a.apk | 0 |
| split_install_time_pack.apk | 4,656 .bundle payloads + 8 index/control files |
| **Total .bundle payloads** | **4,656** |

The current on-device directory listing contains 4,664 unique paths under assets/AssetBundles: 4,656 files ending in .bundle plus 8 index/control files (gameres, datatable, lua, download and their four .version markers). The local SPLIT_APK_ASSETBUNDLE_LIST_2026-10-30.txt contains all 4,664 paths; exact filename-set comparison returned 0 additions and 0 removals. The local DARKWAR_SPLIT_APK_BUNDLE_INDEX_2026-10-30.csv contains 4,656 rows, correctly counting only .bundle payloads. **PASS — both local inventories match their corresponding on-device grains; the apparent eight-entry difference is the eight index/control files, not missing bundles.**

## 3. S21 external AssetBundles cache

The app's external AssetBundles directory contained 319 files:

- 311 files ending in .bundle.
- 4 index files: gameres, datatable, lua, download.
- 4 version marker files: gameres.version, datatable.version, lua.version, download.version.

The 311 cached bundles divide as follows:

| Family | Bundle files |
|---|---:|
| gameres | 161 |
| datatable | 46 |
| lua | 104 |
| **Total** | **311** |

All 319 files were SHA-256 hashed. The sanitized file-level inventory is mirrored in PHONE_ASSETBUNDLE_SHA256_2026-10-30.csv. It contains filenames, family, file kind, SHA-256 and source label only; it excludes full device paths and account-specific data.

## 4. Cache-to-package name reconciliation

Comparison of the 311 cache bundle names against the 4,664 installed package bundle names produced:

- Exact filename matches: 0.
- Candidate logical-name matches: 291.
- Cache names with no candidate logical-name match in the installed package: 20.

For candidate logical-name matching only, the trailing 32-hex suffix before .bundle was removed from each name. This is a diagnostic normalization, not a canonical join key and not proof that two payloads are byte-identical. All 291 candidate matches have different exact filenames between cache and package. This is consistent with versioned/replaced bundle identifiers, but the precise naming semantics and payload differences still require validation.

The 20 cache-only candidate logical names are:

- gameres_art_buildings_a_build_fanchuanpifu_02.bundle
- gameres_art_buildings_a_build_fanchuanpifu_04.bundle
- gameres_art_buildings_a_build_fanchuanpifu_05.bundle
- gameres_art_dir_effect_animation_ui_uigift.bundle
- gameres_art_dir_effect_prefab_pifu_diaoyuhuodong_01.bundle
- gameres_art_dir_effect_prefab_pifu_diaoyuhuodong_02.bundle
- gameres_art_dir_effect_prefab_pifu_diaoyuhuodong_03.bundle
- gameres_art_dir_effect_prefab_pifu_diaoyuhuodong_04.bundle
- gameres_art_dir_effect_prefab_pifu_diaoyuhuodong_05.bundle
- gameres_art_dir_effect_prefab_ui_uigift.bundle
- gameres_art_dir_spine_biaoqing_socializing_cheers.bundle
- gameres_art_dir_spine_biaoqing_socializing_highfive.bundle
- gameres_art_dir_spine_biaoqing_socializing_moneygun.bundle
- gameres_art_dir_spine_ui_spine_gift_wishingstar.bundle
- gameres_auto_assets__art_models_armor_a_build_chaojibingzhanshichingjing_02a_prefab.bundle
- gameres_auto_assets__art_models_armor_a_build_chaojibingzhanshichingjing_02a_texture.bundle
- gameres_main_dir_prefabs_building_ship_blue.bundle
- gameres_main_dir_prefabs_building_ship_gold.bundle
- gameres_main_dir_prefabs_building_ship_red.bundle
- gameres_main_dir_textureex_uipopuppackagecyberweek2.bundle

These are confirmed present in the phone cache and have no normalized-name candidate in the installed package list. Their origin is not proven; they are classified as cache-only candidates, not automatically as CDN downloads.

## 5. Index and version reconciliation

The four index files on the phone have SHA-256 values identical to the corresponding files in local Index_Metadata:

| Index | SHA-256 comparison |
|---|---|
| gameres | PASS |
| datatable | PASS |
| lua | PASS |
| download | PASS |

Phone and local version marker contents also match exactly:

| Marker | Value |
|---|---|
| gameres.version | 1333,5164473,105024197 |
| datatable.version | 1631,39085,4029693006 |
| lua.version | 1760,2396329,1497796709 |
| download.version | 911,271,3124353645 |

The phone CheckVersion.txt reads 1.250.669;1629. The local gameres index header reads #30491.250.670. The relationship between these differently formatted build markers is still **BLOCKED / NOT RESOLVED**. Matching index hashes prove that the phone and local index snapshots are identical; they do not prove that every marker refers to the same release identifier.

## 6. Local extraction coverage boundary

- Local Selected_Bundles contains 497 bundle files.
- 66 of those selected bundle names have a candidate logical-name match in the current phone cache.
- This is a targeted local working set, not a complete extraction of all installed package assets.
- The 4,664 installed AssetBundle entries have been indexed, not all extracted as payloads.
- The current 311-file cache is only the cache snapshot available at this checkpoint; it is not the complete set of resources the game may download during normal operation.

## 7. Safety and scope

- Read-only inspection only; no game modification, patching, root, bypass, traffic interception or undocumented endpoint probing.
- The 2.08 GB install-time pack was not copied or unpacked wholesale.
- config.db, LocalImages, LocalChatImg, formation model files, cookies, session/account data and private caches were not inspected or uploaded.
- No proprietary APK, bundle, model, texture, audio or other game payload was uploaded to the public repository.
- Only derived inventory, hashes, version markers and reconciliation results are suitable for the public research branch.

## 8. Validation ledger

| Check | Status | Evidence |
|---|---|---|
| ADB connection to S21 | PASS | Device serial RXCT100JBGV in device state |
| Installed package identity/version | PASS | Package manager metadata |
| Five installed APK components enumerated | PASS | pm path + installed package directory |
| All installed APK ZIP AssetBundle entries indexed | PASS | 4,664 directory paths = 4,656 .bundle payloads + 8 controls |
| Prior local APK inventory reconciled | PASS | 4,664 directory paths exact; CSV has 4,656 payload rows; 0 missing |
| Phone cache inventory and SHA-256 | PASS | 319/319 files |
| Four index SHA-256 comparisons | PASS | 4/4 identical to local Index_Metadata |
| Four version marker comparisons | PASS | 4/4 contents identical |
| Cache/package logical-name reconciliation | PASS | 291 candidate matches; 20 cache-only candidates; 0 exact filenames |
| All 4,664 installed payloads extracted locally | NOT RUN | ZIP central directory indexed only |
| All 311 cache bundle payloads copied locally | NOT RUN | Hashes and names captured; no bulk pull |
| Build marker relationship | BLOCKED | CheckVersion and local index header differ |
| Complete extraction of every possible runtime download | NOT RUN | Requires additional normal-operation cache snapshots |

## 9. Next safe steps

1. DONE — 370 UNMAPPED rows repaired; see [parser-fix validation](gameres-parser-fix-2026-10-30.md).
2. Reconcile gameres/datatable/Lua/download markers with CheckVersion and package metadata without assuming they share one version namespace.
3. Cross-reference selected cached Lua/datatable bundles with their current versioned filenames before drawing gameplay conclusions.
4. Investigate the 20 cache-only candidate bundles and 291 version-suffixed logical-name pairs; keep normalized matching diagnostic only.
5. Keep public GitHub limited to derived manifests and reports; retain proprietary payloads in controlled local storage.


## 10. Count-grain clarification

The two counts 4,664 and 4,656 are both correct but refer to different grains:

- 4,664 unique paths under assets/AssetBundles, including the eight index/control files.
- 4,656 actual .bundle payload files, which is the row count in the canonical split APK bundle CSV.
- The ZIP archive itself contains 4,670 entries for split_install_time_pack.apk and 5,801 entries across all five installed APKs.

Do not label 4,664 as the count of .bundle payloads. The canonical bundle-payload count remains 4,656.


## 11. Gamerares parser correction

The 370 UNMAPPED rows were resolved after identifying pipe-separated asset-index expressions. The corrected parser uses the direct [Assets] AssetIndex -> BundleId relation and validates each recovered expression in [Bundles]. Validation: 24,188 existing mappings matched, 370/370 recovered, 0 missing references, 0 mismatches, 1,576 distinct bundles, 0 UNMAPPED in the corrected local V2 map. See [parser-fix validation](gameres-parser-fix-2026-10-30.md).
