# HeroUtils — time gate and merge-item gate (2026-10-31)

## Scope and validation

Static paired analysis of Lua 5.4 and Lua 5.5 functions 151, 152, 169 and 170. The paired decoder compared line ranges, instruction counts, constant fingerprints, constant values, opcode mapping by aligned PC, semantically used A/B/C/k operands and JMP targets; reserved k-bit differences on opcodes that do not consume k are recorded separately.

- **PASS** — all four functions preserve line ranges, instruction counts and constants.
- **PASS** — aligned opcode mappings have no conflicts; all semantically used operands and jump destinations match across versions. The only k-bit differences are on SELF, where k is not an operand; Lua 5.5 lopcodes.h defines SELF as A/B/C with the constant key K[C]. The raw Lua 5.5 opcode IDs are mapped by paired PC within these target functions; this is a target-specific paired mapping, not a claim that the generic Lua 5.4 opcode table recognizes every Lua 5.5 ID.
- **NOT RUN** — live client execution; this is static bytecode evidence only.

## 1. Time gate in GetHeroTemplateList

The callback chooses the row field using hero_start_time: switch true selects start_time_new; if that field is absent/falsy, it falls back to start_time; switch false selects start_time.

The selected string is split by |. Its first component is a numeric type; the remaining payload is interpreted as follows.

| Type | Payload | Inclusion condition |
|---|---|---|
| 1 | day | curDay >= targetDay |
| 2 | week;weekday | curWeek > targetWeek OR (curWeek == targetWeek AND curWeekDay >= targetWeekday) |
| 3 | season;seasonDay | season >= targetSeason AND seasonDay >= targetSeasonDay |
| 4 | seasonStage;seasonStageDay | seasonStage >= targetStage AND seasonStageDay >= targetStageDay |

Types 2–4 parse two numeric values independently. Failed tonumber paths substitute zero before comparison. Type 1 parses one value and likewise substitutes zero if conversion fails. An empty split result or unsupported type bypasses the time comparisons. The exact behavior of string.split when its input itself is nil was not runtime-tested.

Type 2 is lexicographic. Types 3 and 4 are two independent lower-bound checks, not lexicographic comparisons.

## 2. Merge-item helpers

Root function 1 publishes two methods into HeroUtils using dynamic SETTABLE: PC 538 loads GetHeroMergeItem and PC 539 assigns closure R171 (function 151); PC 540 loads IsHeroMergeItemEnough and PC 541 assigns closure R172 (function 152).

### GetHeroMergeItem — function 151

Lines 2062–2077. It reads the A/B-selected field from the hero table. CheckSwitch(hero_merge_b) true selects hero_merge_b; false selects hero_merge. It queries GetTableData(GetHeroXmlName(), heroKey, selectedField). The field is split by pipe. Exactly two parts are converted with tonumber and returned as itemId and requiredCount; otherwise it returns nil and zero.

### IsHeroMergeItemEnough — function 152

Lines 2079–2086. It calls the global GetHeroMergeItem(heroKey), reads owned quantity through DataCenter.ItemData:GetItemCount(itemId), and returns requiredCount <= ownedCount. This helper is independent; GetHeroTemplateList does not call it.

## 3. Actual merge-item gate in GetHeroTemplateList

The callback (function 170, PCs 120–132) calls HeroUtils.GetHeroMergeItem(heroKey), then checks the returned item ID. If truthy, it queries the owned quantity. When quantity is zero, the callback returns before table.insert(list, heroKey); when quantity is positive, it continues to the later season/A-B checks. The second return value requiredCount is not used by this callback.

The comparison at PC 130 is EQI(ownedCount, 0, k=0). Lua VM semantics are: if cond differs from k, skip the next instruction; otherwise execute the following JMP. Therefore zero count skips the JMP and reaches RETURN0 at PC 132; positive count executes the JMP to PC 133 and continues. The callback's static rule is: **exclude a hero row if its configured merge item has zero owned quantity; any positive quantity passes this gate**. It does not require the full requiredCount. Do not confuse this with IsHeroMergeItemEnough, which checks whether ownedCount meets requiredCount.

## 4. DataCenter bootstrap

The manager root calls BaseClass(HeroLevelUpTemplateManager); the class factory invocation is confirmed. The exported module inventory contains 30 distinct class/manager names using BaseClass, but no BaseClass definition, central DataCenter asset, or explicit assignment of this manager into DataCenter. A search of the local analysis core and APK audit folder found no local global-metadata.dat, libil2cpp.so, GameAssembly.dll or Assembly-CSharp.dll. The 2,082,044,905-byte APK exists only as a OneDrive cloud placeholder; it was not rehydrated. The central loader/registration mechanism therefore remains **BLOCKED** pending access to the APK/native metadata or another bootstrap source. Runtime registration remains **NOT RUN**.

## 5. Memory and DataTables

Last measured free RAM: **763.0 MB**; required threshold: **875 MB** (112 MB short). One AssetRipper instance remains active. Extraction of heroes_levelup base and Lua 5.5, and physical comparison of aps_new_heroes, remain **BLOCKED / NOT RUN**. No bundle was loaded or exported.

## VM branch semantics

The polarity of TEST and comparison branches was checked against the official Lua 5.4 and Lua 5.5 virtual-machine implementations: docondjump skips the next instruction when cond differs from k; otherwise it executes the following JMP. This resolves the zero-versus-positive merge-item branch without relying on intuition. Sources: https://www.lua.org/source/5.4/lvm.c.html and https://www.lua.org/source/5.5/lvm.c.html.

## Evidence

Machine-readable evidence: hero-utils-time-and-merge-gates-paired-2026-10-31.json in the evidence directory. The evidence JSON contains raw instruction words, raw opcode IDs, constant values, per-PC opcode mapping, operand comparisons and jump targets for functions 151, 152, 169 and 170.

No original was modified. No merge, deploy or external publication occurred.
