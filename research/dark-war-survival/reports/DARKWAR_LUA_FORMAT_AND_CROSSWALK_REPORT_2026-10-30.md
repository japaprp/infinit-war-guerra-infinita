# Dark War: Survival — Lua format validation and DataTable crosswalk

**Checkpoint:** 2026-10-30  
**Project identity:** Dark War: Survival is the original game under analysis; Guerra Infinita is the planned name for the completed reconstruction. These names refer to the same project, not separate projects.

## 1. Lua bytecode header identification

The 30 targeted Lua bundles contain 12,370 TextAsset `.bytes` files (65,672,743 bytes total). A binary-safe Node.js validator checked every file directly from the AssetRipper export tree.

| Observed family | Files | Prefix byte at offset 4 | Lua version byte at offset 5 | Result |
|---|---:|---:|---:|---|
| Lua 5.4 header | 6,185 | 0x03 | 0x54 | PASS |
| Lua 5.5 header | 6,185 | 0xA8 | 0x55 | PASS |
| Invalid / zero-byte / non-Lua | 0 | — | — | PASS |

All files begin with the Lua signature `1B 4C 75 61`. The version and official-format fields, LUAC_DATA sentinel and version-specific numeric/header sentinels match the official Lua 5.4.9 and Lua 5.5.1 chunk-header definitions.

- Lua 5.4 checks: instruction size 4, lua_Integer size 8, lua_Number size 8, LUAC_INT 0x5678 and LUAC_NUM 370.5.
- Lua 5.5 checks: int size 4 and value -0x5678, instruction size 4 and value 0x12345678, lua_Integer size 8 and value -0x5678, lua_Number size 8 and value -370.5.
- The extra byte at offset 4 (0x03 or 0xA8) is an observed prefix before the official Lua version byte. Its application-specific meaning is NOT DETERMINED; do not call it an obfuscation key or version field without more evidence.
- Six representative files (HeroDataManager, HeroEquipManager and HeroLevelUpTemplateManager, three per family) passed the same checks.

**Corpus validation:** 12,370/12,370 header checks PASS; 6,185 Lua 5.4 + 6,185 Lua 5.5; zero failures, zero empty files, zero non-Lua signatures.

**Full-chunk parser:** six representative samples (HeroDataManager, HeroEquipManager and HeroLevelUpTemplateManager, three per family) passed first. The corrected structural parser then completed the entire corpus: **12,370/12,370 PASS**, zero failures. It parsed recursive prototype trees, instruction arrays, constants, upvalues, source strings and debug sections, consumed each file exactly to EOF and verified the root closure-upvalue count.

Corpus totals: 179,088 functions; 6,330,931 instructions; 1,825,399 constants; 2,571,205 string occurrences. PASS: all 12,370 parser-input SHA-256 values match the original per-file export manifest exactly (12,370/12,370; zero missing keys or mismatches). The parser does not yet decode instruction opcodes or evaluate runtime behavior, so semantic disassembly and decompilation remain NOT RUN.

**Lua 5.5 alignment finding:** the parser must retain a one-byte alignment offset bias corresponding to the observed prefix byte at offset 4 when aligning instruction and absolute-line-info arrays. Without this bias, the parser misreads the first constant count; with it, all 6,185 Lua 5.5 files parse completely. The prefix's implementation-level meaning remains NOT DETERMINED. The parser also handles Lua 5.5's 64-bit integer constants using BigInt varints.

Official format references:
- Lua 5.4.9: https://www.lua.org/source/5.4/lundump.c.html and https://www.lua.org/source/5.4/lundump.h.html
- Lua 5.5.1: https://www.lua.org/source/5.5/lundump.c.html and https://www.lua.org/source/5.5/lundump.h.html

## 2. Version-marker reconciliation

The four local index files all carry the same build header `#30491.250.670`. Their adjacent `.version` marker triples were checked against the actual index file byte length and CRC32, and against the first integer in each index's `[Version]` section.

| Index | Marker version | Marker size | Actual size | Marker CRC32 | Actual CRC32 | Result |
|---|---:|---:|---:|---:|---:|---|
| gameres | 1333 | 5,164,473 | 5,164,473 | 105024197 | 105024197 | PASS |
| datatable | 1631 | 39,085 | 39,085 | 4029693006 | 4029693006 | PASS |
| lua | 1760 | 2,396,329 | 2,396,329 | 1497796709 | 1497796709 | PASS |
| download | 911 | 271 | 271 | 3124353645 | 3124353645 | PASS |

All four markers match their corresponding index files exactly on version, byte length and CRC32. This proves internal consistency of this four-index snapshot. A separate previously recorded CheckVersion value (`1.250.669;1629`) is not one of these four marker triples; its provenance and relationship to build header `1.250.670` remain unresolved. Do not infer that it is the same version field.

## 3. Lua module ↔ DataTable crosswalk

The existing crosswalk contains 66 Lua module records across 30 bundles.

- 34 exact printable-ASCII token-reference rows across 8 Lua modules and 12 distinct table names. Evidence source: AssetRipper Text projection.
- 14 candidate-reference rows across 3 modules: 2 MEDIUM and 12 LOW confidence.
- Crosswalk V2 record statuses: 20 direct token matches, 36 with no direct table token in the text projection, and 10 semantic links blocked pending bytecode decompilation.

Modules with exact token references and table names:
- Arena3v3Manager → army, score
- ArenaManager → army
- HeroEquipManager → goods
- HeroIntensifyManager → effect, hero_camp_intensify
- HeroWeaponManager → heroes_exclusive_equip
- UIWorldCupActListPanelCtrl → recharge
- WorldBattleBuffManager → effect
- WorldMarchDataManager → desert, lw_train_property, status, trade_post, worldcity

The 12 distinct direct-token table names are: army, desert, effect, goods, hero_camp_intensify, heroes_exclusive_equip, lw_train_property, recharge, score, status, trade_post and worldcity.

Candidate-only modules:
- HeroLevelUpTemplateManager → heroes_levelup (MEDIUM)
- OffSeasonManager → season_activity_panel, season_activity_panel_group (LOW)
- SeasonGroupManager → aps_season, aps_season_group, season_config_group, season_model (LOW)

**Interpretation boundary:** a printable token in the text projection is not proof that the compiled function calls that table at runtime. Candidate references remain candidates. AssetRipper Text API output is a UTF-8 projection and is not byte-preserving; binary parsing above used raw exported TextAsset files.

### Binary constant-pool crosswalk (full structural parser)

- The full parser extracted 26,354 table/API candidate-string rows from the 12,370 parsed chunks.
- Normalizing case and punctuation produced 883 constant-to-index-name matches across 792 module variants and 34 distinct DataTable names.
- 453 of those 883 module/table matches occur in module variants that also contain the `GetTableData` API symbol (380 module variants). This is module-level co-occurrence only, not proof that the table constant is passed to that function.
- System categories: building 83 matches (52 with same-module `GetTableData`); heroes 6 (3); equipment 4 (1); seasons 50 (37); activities 119 (93); world/territory 90 (79). No exact normalized event-table constant match was found in this candidate extraction, although event tables exist in the DataTable index.
- Specific module evidence: `UIBuildUpgradeView` and `UIBuildCreateView` each contain `GetTableData` plus `BUILDING`, `Effect` and `Goods` constants. `HeroEquipManager` contains `GetTableData` plus `GOODS`. `HeroWeaponUtil` and `HeroWeaponManager` contain `heroes_exclusive_equip` evidence. `SeasonDataManager` contains `GetTableData` plus `APS_Season`, `season_dialog`, `season_prew` and `SeasonPrewGroup`. `OffSeasonManager` contains `GetTableData` plus `activityPanel` and `SeasonActivityPanel`.
- `HeroDataManager` and `HeroLevelUpTemplateManager` contain `GetTableData`, but no exact normalized DataTable-name constant match was found for those modules. `HeroLevelUpTemplateManager` still has the MEDIUM candidate `ABtest_heroes_levelup` / `NewHeroesLevelUp` from the earlier text-projection crosswalk.
- Exact function/callsite association still requires opcode decoding; treat all constant-pool matches as candidate evidence, not confirmed runtime links.

## 4. DataTable system inventory

The canonical DataTable asset map contains 1,064 asset-index records, including 938 `.bytes` records across 60 bundle names. The following are counts of indexed asset records and distinct table names selected by name-pattern; they include base and `55` variants and are not counts of gameplay rows or player progression values.

| System family | Indexed asset records | Distinct table names |
|---|---:|---:|
| Building / construction | 22 | 11 |
| Heroes | 56 | 28 |
| Equipment | 20 | 10 |
| Seasons | 44 | 22 |
| Activities | 42 | 21 |
| Events | 14 | 7 |

### Buildings and upgrades — index-level evidence
Indexed tables include `building`, `building_B`, `building_des`, `building_des_B`, `canyon_building`, `dragon_building`, `food_festival_building`, `halloween_building`, `mg_building`, `mg_building_skill` and `season_donate_building`. Lua trace includes `UIBuildUpgradeCtrl`, `SeasonBuildQueueManager` and `SeasonBuildUpgradesManager`. The exact controller-to-table runtime calls and all level/cost/stat formulas remain NOT RUN.

### Heroes — index-level evidence
Indexed tables include `aps_heroes_quality`, `aps_heroes_rank`, `aps_new_heroes`, `hero_preview_skill`, `hero_camp_intensify`, `heroes_exclusive_equip`, `heroes_levelup`, `lw_hero`, `lw_hero_B`, `lw_hero_appearance`, `lw_hero_effect`, `lw_hero_skill`, `lw_hero_skill_effect` and `city_hero_attack_config`. Lua trace includes HeroDataManager, HeroEquipManager, HeroIntensifyManager, HeroLevelUpTemplateManager and HeroWeaponManager. Exact hero rosters, stats, costs, caps and skill breakpoints are NOT RUN.

### Equipment — index-level evidence
Indexed tables include `c_equips`, `ds_equip`, `ds_equip_attribute`, `ds_equip_material`, `ds_equip_promote`, `ds_equip_upgrade`, `car_equip`, `car_equip_set`, `equip_camp_intensify` and `heroes_exclusive_equip`. This indicates multiple equipment data families; it does not prove shared upgrade curves or combat applicability.

### Seasons and events — index-level evidence
Season tables include `aps_season`, `aps_season_group`, `d_season_intro`, `season_activity_panel`, `season_activity_panel_group`, `season_alliance_achieve`, `season_config_group`, `season_donate_building`, `season_model`, `season_reward` and related groups. Event/activity tables include `activity_Blindbox_main`, `activity_barter`, `activity_cyclebox`, `activity_dig`, `activity_jigsaw`, `activity_monster`, `activity_panel`, `activity_pass`, `Adventure_event`, `detect_event`, `land_event`, `people_event` and `pve_event`. These names establish indexed client data domains, not active event schedules or reward mechanics.

## 4A. Additional systems confirmed by the expanded client index/catalog

These are client-side module and DataTable-name inventories. They establish that the client contains these data domains; they do not establish live availability, numeric rules, or server-authoritative behavior.

- **Competitive modes:** separate Arena, Arena 3v3, Champion Battle, World Cup schedule/betting, Strongest Kingdom phase and Wasteland King ranking/level systems. Indexed tables include `strongest_kingdom_phase`, `world_cup_main`, `world_cup_group`, `world_cup_stage`, `world_cup_team`, `wastelandking_level` and `wastelandking_rank`.
- **World map, territory and alliance:** indexed tables include `world_scene`, `worldcity`, `worldcity_color`, `worldcity_season_param`, `world_fortress`, `world_fortress_reward`, `world_alliance_tower`, `monster_refresh`, `world_quest` and `world_restrictions`. Lua modules include WorldTroopManager, WorldRallyLineManager, WorldStrongHoldMapManager, WorldCrossServerMoveCity and WorldDesertBattle.
- **Base progression:** indexed tables include `building`, `building_B`, `building_des`, `building_des_B`, `level_up`, `growth_fund`, `dragon_building`, `canyon_building`, `defence_tower`, `alliance_res_build`, `city_zombie_attack`, `city_zombie_spawn` and `city_soldier`.
- **Science, research and production:** indexed tables include `APS_science`, `aps_science_tab`, `alScience`, `alScienceTab`, `armor_production_upgrade`, `aps_resources`, `aps_gather_resource`, `car_microchip`, `car_microchip_attribute`, `car_microchip_grading` and `car_microchip_promote`.
- **Seasonal progression:** separate modules include SeasonBuildQueueManager, SeasonBuildUpgrades, SeasonCrossServerRankData, SeasonGroup, SeasonManager, SeasonWeek, SeasonPrologue, OffSeasonManager and WorldPointSeasonActManager.
- **March and troop movement:** modules include WorldMarchDataManager, WorldTroopManager, WorldTroopLineManager, WorldRallyLineManager, WorldCrossServerMoveCity, MarchInner and MarchEmoji.
- **PvE and monsters:** indexed families include `APS_monster`, `aps_pve_level_old`, `aps_pve_part_zombie`, `aps_pve_zombie`, `camp_pve`, `camp_pve_type`, `pve_event`, `pve_heroes`, `trial_pve`, `trial_pve_map`, `nightmare_level`, `lw_monster` and `lw_monster_born`.

Exact prerequisites, upgrade costs, research bonuses, hero/equipment formulas, season reset/reward rules, event schedules, march caps and battle calculations remain NOT YET VERIFIED; these require parsed table payloads and confirmed Lua callsites.

## 5. Tooling and resource gate

- The connected Windows device has Node.js but no `lua`, `luac`, Java, GCC, Clang, MSVC `cl`, CMake or Make available on PATH; no local Lua decompiler binary was found in the checked Downloads tree.
- A custom Node.js structural parser based on official Lua 5.4.9/5.5.1 loader definitions passed all 12,370 full chunks. It is not a native Lua runtime and does not decode opcodes. Independent compiler/disassembler validation remains unavailable.
- Free physical RAM at the latest check (2026-10-30): approximately 425 MB. The prior AssetRipper safety gate requires approximately 875–975 MB free before startup, targeting 700–800 MB during import. The current state is below the minimum; no new DataTable AssetRipper import was attempted.
- DataTable bundle payloads have not yet been exported and parsed in this stage. All table names above come from the index map and existing traces.

## 6. Next safe steps

1. Extend operand validation to every mapped B/C/k field and special instruction variant, including open-top and metamethod sequences.
2. Resolve the 137 unmapped instruction positions and rare IDs using additional paired functions or independent byte-level evidence.
3. Build a separate experimental disassembler from the accepted fingerprint crosswalk; keep the stable structural parser unchanged.
4. Use validated disassembly to confirm actual `GetTableData` callsites and associate table constants with the DataTable asset index.
5. Continue with the smallest relevant DataTable exports only when free RAM reaches the established safety gate.

## 7. Safety and publication boundary

Only derived metadata, validation reports and sanitized scripts are suitable for the public research branch. Do not upload APKs, original Unity bundles, extracted binary payloads, models, textures, audio, account/session data, tokens, private configuration or local absolute paths. No merge, deploy, default-branch update or deletion was performed.

## 8. Opcode inventory and fingerprint crosswalk (2026-10-30)

The first empirical Lua 5.5-to-5.4 crosswalk is **RETRACTED** because function identity was inferred from insufficient metadata. Its CSV is explicitly flagged invalid and retained only for audit.

A replacement crosswalk now uses unique function matches based on module, prototype depth, debug range, parameter/stack metadata, instruction and constant counts, ordered constant-pool SHA-256, upvalue count and child-prototype count. This produced 850 unique function pairs across 30 module keys, with zero ambiguous groups. The resulting map covers 97 Lua 5.5 raw IDs with zero conflicts.

A deterministic 20-module training / 10-module holdout achieved 9,877/9,877 correct mapped positions, zero mismatches, and 99.939% coverage (six rare-ID positions unseen). Across the full corpus, 36,393/36,530 Lua 5.5 instructions are mapped. Independent checks passed: selected A/B/C register operands and ranges 33,558/33,558; A-register bounds 22,714/22,714; constants 13,133/13,133; upvalues 3,722/3,722; prototypes 1,085/1,085; test/JMP pairs 3,290/3,290; LFALSESKIP/LOADTRUE 110/110; NEWTABLE/EXTRAARG 597/597; TFORPREP/TFORCALL and TFORCALL/TFORLOOP pairs 279/279 each; and 3,940 jump targets inside function bounds. All 2,522 mapped SELF instructions have k=0 and a C operand inside the constant pool, indicating a fixed constant-key SELF form rather than the generic stock RKC(C) form.

The 38 IDs outside the stock Lua 5.5 opcode-name range remain a useful raw diagnostic, but the accepted empirical crosswalk now maps many of them. The remaining 137 positions are concentrated in only three raw IDs: 22 (68 occurrences), 73 (68) and 59 (1), across 13 modules. Their apparent stock Lua 5.5 names (ADDK, FORLOOP and LE) fail operand sanity checks, so they remain unmapped rather than being assigned guessed semantics. The one-byte Lua 5.5 alignment bias remains required; isolated alternatives failed structural parsing.

Detailed evidence: `DARKWAR_LUA_OPCODE_CROSSWALK_VALIDATION_2026-10-30.md`, `LUA_OPCODE_CROSSWALK_55_TO_54_FINGERPRINT_V1_2026-10-30.csv`, `LUA_OPCODE_FINGERPRINT_CROSSWALK_VALIDATION_2026-10-30.json`, `LUA_REGISTER_OPERAND_VALIDATION_2026-10-30.json`, `LUA55_UNMAPPED_OPCODE_ID_PROFILE_2026-10-30.csv`, and the explicitly retracted `LUA_OPCODE_CROSSWALK_55_TO_54_2026-10-30.csv`.
