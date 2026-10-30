# Dark War: Survival — empirical Lua 5.5 to Lua 5.4 opcode crosswalk

**Date:** 2026-10-30  
**Scope:** Static comparison of preserved Lua 5.4 and Lua 5.5 module pairs. This is a research crosswalk, not a production disassembler or runtime validation.

## Finding

The game's Lua 5.5 chunk variant does not use the stock Lua 5.5 opcode-name numbering as-is. A stable empirical crosswalk was recovered by aligning corresponding Lua 5.4 and Lua 5.5 functions from the same modules.

The crosswalk maps **100 distinct Lua 5.5 opcode IDs** to Lua 5.4 opcode IDs/names. Every observed Lua 5.5 ID mapped to one Lua 5.4 ID with **100% purity** across the aligned corpus; no conflicting target was observed.

This is consistent with a game-specific opcode numbering table, remapping, or instruction-set fork. It does not, by itself, prove a custom virtual machine.

## Method

1. Parsed the preserved 66 raw modules: 33 Lua 5.4 and 33 Lua 5.5.
2. Matched module variants by module name and function index.
3. Kept only function pairs with identical `lineDefined`, `lastLineDefined`, and `instructionCount`.
4. Compared the opcode ID at each same instruction position.
5. Built a Lua 5.5 ID → Lua 5.4 ID crosswalk and measured per-ID consistency.
6. Performed a deterministic holdout validation using 20 of 30 unique module keys for training and 10 module keys for testing.
7. Validated A-register bounds using the mapped Lua 5.4 opcode semantics and each function's `maxStackSize`.

## Full aligned corpus

| Metric | Result |
|---|---:|
| Unique module keys with paired variants | 30 |
| Aligned function pairs | 910 |
| Aligned instruction positions | 25,920 |
| Positions with identical numeric opcode ID in both versions | 211 (0.814%) |
| Distinct Lua 5.5 IDs mapped | 100 |
| IDs with more than one target mapping | 0 |
| Per-ID mapping purity | 100% |

The low same-number rate (0.814%) and the stable crosswalk show that the two versions use substantially different opcode numbering.

## Holdout validation

| Metric | Result |
|---|---:|
| Training module keys | 20 |
| Holdout module keys | 10 |
| Training aligned functions | 634 |
| Training instruction positions | 15,783 |
| Holdout aligned functions | 276 |
| Holdout instruction positions | 10,137 |
| Holdout positions covered by IDs seen in training | 10,128 (99.91%) |
| Correct mapped positions | 10,128 |
| Incorrect mapped positions | 0 |
| Rare IDs not seen in training | 7, 59, 91, 101, 112 (9 positions total) |

The mapping achieved **100% accuracy on every holdout position whose Lua 5.5 ID appeared in training**. The nine uncovered positions are rare IDs; they were mapped consistently when the full corpus was used.

## A-register semantic check

The mapped opcode names were used to determine whether operand A is a register for each instruction. Instructions whose mapped opcode does not use A were excluded. The remaining A values were checked against each function's `maxStackSize`.

| Corpus / interpretation | Checked | Out of range | Rate |
|---|---:|---:|---:|
| Lua 5.4, stock opcode names | 31,246 | 7 | 0.0220% |
| Lua 5.5, empirical crosswalk to Lua 5.4 names | 31,286 | 7 | 0.0224% |

In both corpora, all seven out-of-range cases were associated with the mapped `RETURN` opcode. This near-identical result is a strong independent consistency check for the crosswalk's A-operand semantics.

## Example mappings

| Lua 5.5 ID | Stock Lua 5.5 name | Empirical Lua 5.4 name | Aligned occurrences |
|---:|---|---|---:|
| 5 | LOADFALSE | CALL | 2,852 |
| 43 | BXOR | JMP | 2,378 |
| 103 | outside stock table | GETFIELD | 1,443 |
| 109 | outside stock table | SETFIELD | 1,310 |
| 110 | outside stock table | SELF | 1,262 |
| 123 | outside stock table | GETFIELD | 1,234 |
| 125 | outside stock table | GETTABUP | 1,170 |
| 120 | outside stock table | MOVE | 875 |
| 40 | IDIV | RETURN0 | 799 |
| 98 | outside stock table | GETTABUP | 684 |
| 80 | VARARG | TEST | 666 |
| 116 | outside stock table | CLOSURE | 658 |

Several Lua 5.5 IDs map to the same Lua 5.4 opcode name (for example, IDs 103 and 123 both map to `GETFIELD`). Therefore, this is not a simple one-to-one permutation. It may include specialized aliases or distinct instruction variants. The complete 100-row mapping, occurrence counts, module coverage, holdout evidence, and confidence tier are in the companion CSV.

## Interpretation boundary

**Supported:**

- The stock Lua 5.5 opcode-name table does not describe the observed game's 5.5 opcode IDs correctly.
- A deterministic empirical mapping from 100 observed Lua 5.5 IDs to Lua 5.4 opcode IDs/names was recovered from paired functions.
- The mapping generalizes to a held-out module set with zero mismatches for all IDs seen in training.
- A-register bounds under the crosswalk match the Lua 5.4 baseline almost exactly.

**Not yet proven:**

- That every mapped opcode is semantically identical to its Lua 5.4 counterpart in all operand formats and runtime cases.
- The precise semantics of every alias/specialized ID.
- B/C/k operand rules, jump offsets, constant indices, upvalue references, and control-flow validity.
- Runtime behavior or `GetTableData` callsites.

## Validation ledger

- **PASS** — Structural parse of the 66 preserved raw modules (66/66).
- **PASS** — 910 aligned function pairs and 25,920 aligned instruction positions extracted.
- **PASS** — 100 observed Lua 5.5 IDs each have one stable Lua 5.4 target in the full aligned corpus; zero conflicts.
- **PASS** — Holdout: 10,128/10,128 mapped positions correct; 9 positions uncovered because five rare IDs did not appear in training.
- **PASS** — A-register bounds under the empirical crosswalk: 7/31,286 out of range (0.0224%), matching the Lua 5.4 baseline of 7/31,246 (0.0220%); all cases map to `RETURN`.
- **NOT RUN** — Full B/C/k operand validation, jump-target validation, constant/upvalue reference validation, semantic disassembly, runtime behavior, and confirmed `GetTableData` callsites.

## Artifacts

- Crosswalk CSV: `validation-reports/LUA_OPCODE_CROSSWALK_55_TO_54_2026-10-30.csv`.
- Function alignment evidence: `validation-reports/LUA_OPCODE_INVENTORY_RAW_MODULES_2026-10-30-functions.csv` (local research artifact; contains per-function opcode sequences and raw instruction words).
- Module summary: `validation-reports/LUA_OPCODE_MODULE_SUMMARY_2026-10-30.csv`.
- Stable parser `tools/parse-lua-chunks.js` remains unchanged. All crosswalk instrumentation lives in the separate experimental script.

## Next safe steps

1. Validate B/C/k operands for each mapped opcode using the corresponding Lua 5.4 instruction format, with explicit handling for aliases.
2. Validate signed/unsigned jump offsets and all control-flow targets.
3. Validate constant-pool, upvalue, and prototype references.
4. Only after those checks, build a separate Lua 5.5 disassembler driven by the empirical opcode map.
5. Use the validated disassembler to locate actual `GetTableData` callsites and connect them to DataTable names.

No game modification, runtime injection, account manipulation, merge, deployment, or external release was performed.

[executed on device: WIN-RPC1DR79TVC (a1fb0fea-9200-442c-8e10-e849494b85b1)]