# Dark War: Survival — Lua opcode crosswalk retraction and corrected findings

**Date:** 2026-10-30  
**Status:** Previous empirical crosswalk RETRACTED. The raw evidence is retained for audit; do not use the old mapping to disassemble or interpret game code.

## Project identity

Dark War: Survival is the original game being studied. Guerra Infinita is the planned name for the completed reconstruction of that same project. There is one project and one source of truth; old naming and workspace divisions reflect the earlier lack of access to original game files, not separate products.

## Why the previous crosswalk is invalid

The previous CSV claimed a 100% stable mapping from Lua 5.5 opcode IDs to Lua 5.4 IDs. That conclusion depended on pairing functions by module name, global function index, line range, and instruction count. Those fields do not establish that two functions are the same function or that their instruction positions are semantically aligned.

A direct inspection disproved the pairing assumption. In `ActChampionBattleManager`, function index 1, both variants have line range 0–0 and 157 instructions, but the first 15 opcode IDs differ substantially:

- Lua 5.5 raw IDs: `34,62,1,5,125,121,5,98,88,5,125,121,5,116,116`
- Lua 5.4 raw IDs: `81,11,3,68,11,3,68,11,3,68,11,3,68,79,79`

The function sequences are not positionally equivalent. Therefore, the 910 pairs / 25,920 positions and the earlier holdout accuracy are not valid semantic evidence. The previous 100-ID mapping and all confidence tiers are **RETRACTED**.

## Corrected full-corpus opcode inventory

The preserved structural parser was rerun after adding raw instruction-word capture and additional per-function metadata. It completed successfully:

| Metric | Lua 5.4 | Lua 5.5 |
|---|---:|---:|
| Raw modules | 33 | 33 |
| Functions | 1,118 | 1,118 |
| Instructions | 36,480 | 36,530 |
| Unknown IDs under the official stock opcode table | 0 | 14,862 |
| Distinct out-of-stock IDs | 0 | 38 |

The official Lua 5.4.9 opcode enum has 83 entries (IDs 0–82). The official Lua 5.5.1 opcode enum has 85 entries (IDs 0–84). The Lua 5.5 corpus contains 38 distinct IDs outside that stock range, appearing 14,862 times across 30 of the 33 modules. These are **non-stock opcode IDs** in this corpus; their meanings are not yet established. This alone does not prove a custom VM.

## Operand sanity checks

The A-register bounds check used the official per-opcode A-mode classification, not a blanket assumption that every opcode uses A as a register.

- Lua 5.4: 23,501 A-register operands checked; 0 out of range.
- Lua 5.5, restricted to stock IDs: 14,576 A-register operands checked; 1,191 out of range (8.171%). The out-of-range observations are concentrated in IDs named `BXOR` (1,167) and `IDIV` (24) under the stock Lua 5.5 table.

This discrepancy is a warning that stock Lua 5.5 names/modes cannot yet be applied blindly to the game's 5.5 instruction stream. The 38 non-stock IDs also require independent operand-mode classification.

## Alignment experiments

Two isolated parser experiments were run against the same 66-module corpus:

- Removing the Lua 5.5 one-byte alignment bias caused all 33 Lua 5.5 modules to fail structural parsing; the 33 Lua 5.4 modules still passed.
- Skipping an additional byte after the current Lua 5.5 alignment also caused all 33 Lua 5.5 modules to fail structural parsing.

Both experiments were isolated copies; the stable parser and raw input corpus were not changed. The existing bias remains required for the current structural parse, but this does not resolve the opcode semantics.

A bit-8 scan was also tested. It is not a valid alternative opcode extraction: in the standard instruction layout, bit 8 falls inside the A operand, and the high proportion of values below the stock opcode count is not evidence of opcode IDs.

## Current evidence ledger

- **PASS** — Structural parsing: 66/66 preserved raw modules (33 Lua 5.4, 33 Lua 5.5).
- **PASS** — Lua 5.4 raw opcode IDs: 36,480/36,480 fall within the official stock 0–82 range.
- **PASS** — Lua 5.5 raw opcode inventory and frequency profile generated for all 36,530 instructions.
- **PASS** — Lua 5.5 out-of-stock ID profile: 38 distinct IDs, 14,862 occurrences, 30 modules.
- **PASS** — Lua 5.4 A-register bounds sanity check: 0/23,501 invalid.
- **FAIL** — Previous Lua 5.5 → Lua 5.4 crosswalk as semantic evidence; function identity was not established.
- **FAIL** — Stock Lua 5.5 A-register semantics applied to all recognized stock IDs without resolving 1,191 out-of-range observations.
- **BLOCKED** — Definitive Lua 5.5 opcode mapping and operand modes.
- **NOT RUN** — Full B/C/k field validation, jump-target validation, constant/upvalue/prototype reference validation, semantic disassembly, runtime behavior, and confirmed `GetTableData` callsites.

## Artifacts and handling

- `LUA_OPCODE_CROSSWALK_55_TO_54_2026-10-30.csv`: retained as historical evidence only; invalid for semantic use.
- `LUA55_NONSTOCK_OPCODE_ID_PROFILE_2026-10-30.csv`: current frequency/module/operand profile for non-stock Lua 5.5 IDs.
- `LUA55_NONSTOCK_OPCODE_ADJACENCY_2026-10-30.csv`: preceding/following opcode frequency profile for the 38 non-stock IDs.
- `LUA_OPCODE_INVENTORY_RAW_MODULES_2026-10-30-functions.csv`: per-function metadata, raw opcode IDs, and raw instruction words.
- `LUA_OPCODE_INVENTORY_RAW_MODULES_2026-10-30-files.csv`: per-module parser and opcode summaries.
- Stable structural parser: `tools/parse-lua-chunks.js` remains unchanged.
- Experimental inventory parser: `tools/experiments/parse-lua55-opcode-inventory.js`; it is not a production disassembler.

## Next safe steps

1. Establish true function identity across Lua 5.4/5.5 variants using stronger evidence than function index and line range (for example, normalized constant/string fingerprints and nested-prototype structure).
2. Independently validate the Lua 5.5 instruction encoding and operand layout against byte-level evidence; do not infer semantics from a numeric ID alone.
3. Classify the 38 non-stock IDs by module/function frequency, operand constraints, adjacency patterns, and any repeated bytecode motifs.
4. Only after opcode identity and operand formats are validated, build a separate disassembler and validate jumps, constants, upvalues, and prototype references.
5. Resume DataTable and `GetTableData` callsite correlation only after the disassembly layer is trustworthy.

No game modification, runtime injection, account manipulation, merge, deployment, or external game release was performed.

[executed on device: WIN-RPC1DR79TVC (a1fb0fea-9200-442c-8e10-e849494b85b1)]