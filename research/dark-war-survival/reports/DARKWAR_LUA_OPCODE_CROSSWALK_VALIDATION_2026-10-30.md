# Dark War: Survival — Lua opcode crosswalk validation (fingerprint V1)

**Date:** 2026-10-30  
**Status:** Fingerprint-based Lua 5.5 → Lua 5.4 empirical crosswalk validated against a held-out module set and independent operand/control-flow invariants. This is a static research decoder foundation, not a runtime-validated VM implementation.

## Project identity

Dark War: Survival is the original game under analysis. Guerra Infinita is the planned name for the completed reconstruction of this same project. There is one project and one source of truth.

## Important correction: the first crosswalk remains retracted

The earlier CSV `LUA_OPCODE_CROSSWALK_55_TO_54_2026-10-30.csv` is **INVALID** and retained only for audit. It paired functions by module name, global function index, line range, and instruction count. A direct example showed those fields did not establish function identity; the paired instruction sequences diverged. That earlier 910-pair / 25,920-position score must not be used.

The new crosswalk below uses a stronger matching criterion and was independently validated.

## Function identity and matching method

A new fingerprint inventory was generated from the 66 preserved raw modules (33 Lua 5.4 and 33 Lua 5.5). For every function, the parser records:

- prototype depth and debug line range;
- parameter/vararg metadata and maximum stack size;
- instruction, constant, upvalue and child-prototype counts;
- SHA-256 fingerprints of the ordered constant pool and string-only constants;
- raw instruction IDs and 32-bit instruction words.

A cross-version pair is accepted only when module key, depth, line range, parameter metadata, maximum stack, instruction count, constant count, full ordered constant fingerprint, upvalue count, and child-prototype count all match, and the match is unique in both versions.

Result: **850 unique function pairs across 30 module keys; zero ambiguous groups**. These pairs contain 19,754 aligned instruction positions.

## Empirical opcode mapping

The mapping compares the raw Lua 5.5 opcode ID at each aligned instruction position with the corresponding Lua 5.4 opcode ID. The resulting table contains **97 distinct Lua 5.5 IDs**, each with exactly one Lua 5.4 target across the full paired corpus: 100% per-ID purity and zero conflicts.

### Held-out validation

A deterministic module split was used: the first 20 sorted module keys for training and the remaining 10 for holdout.

| Metric | Result |
|---|---:|
| Training function pairs | 507 |
| Training instruction positions | 9,871 |
| Distinct Lua 5.5 IDs learned in training | 93 |
| Holdout function pairs | 343 |
| Holdout instruction positions | 9,883 |
| Holdout positions covered by IDs learned in training | 9,877 |
| Correct mapped holdout positions | 9,877 |
| Incorrect mapped holdout positions | 0 |
| Holdout coverage | 99.939% |
| Accuracy on covered holdout positions | 100% |
| Unseen rare IDs in holdout | 7, 91, 101, 112 (6 positions total) |

The six uncovered positions are not counted as correct; they are explicitly recorded as unseen. No holdout mismatch occurred.

## Independent operand and structural validation

The full-corpus crosswalk maps **36,393 of 36,530 Lua 5.5 instructions (99.625%)**. The remaining 137 positions use IDs not represented in the accepted fingerprint-paired mapping and remain unmapped.

The following checks were applied to mapped instructions using Lua 5.4 opcode field semantics:

| Invariant | Checked | Invalid |
|---|---:|---:|
| Selected A/B/C register operands and register ranges | 33,558 | 0 |
| A-register bounds (subset of the row above) | 22,714 | 0 |
| Constant-pool references | 13,133 | 0 |
| Upvalue references | 3,722 | 0 |
| Child-prototype references | 1,085 | 0 |
| Comparison/test instructions followed by JMP | 3,290 | 0 |
| LFALSESKIP followed by LOADTRUE | 110 | 0 |
| NEWTABLE followed by EXTRAARG | 597 | 0 |
| EXTRAARG with valid preceding producer | 597 | 0 |
| TFORPREP target is TFORCALL with same A | 279 | 0 |
| TFORCALL followed by TFORLOOP with same A | 279 | 0 |
| JMP/FORLOOP/FORPREP/TFORLOOP targets inside function | 3,940 | 0 |

No mapped selected register-operand, constant, upvalue, prototype, skip-pair, generic-for sequence, or tested jump-target violation was observed. One useful format invariant emerged: all 2,522 mapped `SELF` instructions have `k=0`, and their C operand is a valid constant-pool index (2,522/2,522), not a register index. This is a game-specific fixed constant-key form; the generic stock `RKC(C)` interpretation must not be applied to these `SELF` variants.

The mapping also explains the earlier apparent opcode anomaly: stock Lua 5.5 names are not a reliable direct label for the game's raw opcode IDs. The new mapping is empirical; the stock Lua 5.5 name column in the CSV is shown only as a reference, not as the game's semantic name.

## Interpretation boundary

**Supported by the evidence:**

- A stable Lua 5.5 raw-ID → Lua 5.4 semantic-opcode mapping was recovered for 97 observed IDs.
- The mapping generalizes to a held-out set with 100% accuracy on all 9,877 covered positions.
- Independent A-register, constant, upvalue, prototype, skip-pair, generic-for, and jump-target checks all pass for the mapped corpus.

**Not yet proven:**

- Runtime equivalence for every opcode and every operand combination.
- Semantics for the 137 currently unmapped instruction positions / rare IDs.
- Full B/C/k validation for every opcode family, including specialized/aliased forms.
- Exact runtime behavior of every control-flow edge, call/return convention, metamethod path, and open-top instruction.
- Confirmed `GetTableData` callsites and table argument identities.

Therefore, this is a **high-confidence static crosswalk**, not yet a complete or runtime-verified disassembler.

## Validation ledger

- **PASS** — Structural parse of 66/66 preserved raw modules.
- **PASS** — 850 unique fingerprint-matched function pairs; zero ambiguous groups.
- **PASS** — 97 mapped Lua 5.5 IDs; zero conflicting targets.
- **PASS** — Holdout: 9,877/9,877 covered positions correct; zero mismatches; six rare-ID positions unseen.
- **PASS** — 22,714 A-register checks; zero invalid.
- **PASS** — 13,133 constant-reference checks; zero invalid.
- **PASS** — 3,722 upvalue-reference checks; zero invalid.
- **PASS** — 1,085 prototype-reference checks; zero invalid.
- **PASS** — 3,290 test-skip/JMP pairs; 110 LFALSESKIP/LOADTRUE pairs; all valid.
- **PASS** — 597 NEWTABLE/EXTRAARG pairs; all valid.
- **PASS** — 279 TFORPREP/TFORCALL/TFORLOOP structures; all valid.
- **PASS** — 3,940 tested jump targets inside function bounds.
- **BLOCKED** — 137 instructions remain unmapped; full semantics of every specialized opcode not yet established.
- **NOT RUN** — Runtime execution, native Lua VM validation, complete B/C/k semantic validation, and confirmed DataTable callsites.

## Artifacts

- `LUA_OPCODE_CROSSWALK_55_TO_54_FINGERPRINT_V1_2026-10-30.csv` — accepted 97-ID mapping with occurrence, module, holdout and operand-validation evidence.
- `LUA_OPCODE_FINGERPRINT_CROSSWALK_VALIDATION_2026-10-30.json` — machine-readable crosswalk, operand and control-flow totals.
- `LUA_REGISTER_OPERAND_VALIDATION_2026-10-30.json` — selected B/C register and range validation, including the fixed constant-key `SELF` finding.
- `LUA_FUNCTION_FINGERPRINT_INVENTORY_2026-10-30-functions.csv` — local derived evidence artifact with per-function fingerprints, metadata and raw instruction sequences; regenerable from the original raw modules with the published parser, not copied to the branch because it is a large generated inventory.
- `LUA_OPCODE_CROSSWALK_55_TO_54_2026-10-30.csv` — earlier invalid mapping, flagged RETRACTED; do not use.
- `LUA55_NONSTOCK_OPCODE_ID_PROFILE_2026-10-30.csv` and `LUA55_NONSTOCK_OPCODE_ADJACENCY_2026-10-30.csv` — earlier raw-ID frequency/adjacency profiles; useful as historical diagnostics only.
- Stable structural parser `tools/parse-lua-chunks.js` remains unchanged. The fingerprint and validation scripts are isolated under `tools/experiments/`.

## Next safe steps

1. Extend operand validation to every mapped B/C/k field and special instruction variant, including open-top and metamethod sequences.
2. Resolve the 137 unmapped positions and rare IDs using additional paired functions or independent byte-level evidence.
3. Build a separate experimental disassembler from the accepted fingerprint crosswalk; keep the structural parser unchanged.
4. Use validated disassembly to confirm actual `GetTableData` callsites and associate table constants with the DataTable asset index.
5. Continue with the smallest relevant DataTable exports only when free RAM reaches the established safety gate.

No game modification, runtime injection, account manipulation, merge, deployment, or external game release was performed.

## Official format references

- Lua 5.4.9 instruction formats and opcode semantics: https://lua.org/source/5.4/lopcodes.h.html and https://lua.org/source/5.4/lvm.c.html
- Lua 5.5.1 instruction formats and opcode semantics: https://lua.org/source/5.5/lopcodes.h.html and https://lua.org/source/5.5/lopcodes.c.html
