# Dark War: Survival — Lua opcode investigation (corrected)

**Date:** 2026-10-30  
**Scope:** Read-only analysis of preserved Lua 5.4/5.5 bytecode samples. No game modification, account manipulation, runtime injection, or deployment.

**Follow-up finding:** A later same-day cross-version alignment recovered a stable empirical mapping for 100 observed Lua 5.5 opcode IDs across 910 function pairs and 25,920 instruction positions, with a separate holdout test and A-register validation. See `DARKWAR_LUA_OPCODE_CROSSWALK_VALIDATION_2026-10-30.md` and `LUA_OPCODE_CROSSWALK_55_TO_54_2026-10-30.csv`. This supersedes the earlier unresolved opcode-semantics status below.

## Project identity

Dark War: Survival is the original game under analysis. Guerra Infinita is the planned name for the completed reconstruction. This report belongs to that same study.

## Recovery and input integrity

- Restored `HeroDataManager.bytes` in `tools/assetbundle-wrapper-test/batch-raw/.../HeroDataManager.bytes` from the preserved `raw-modules` export.
- Expected SHA-256 from the existing manifest: `9b05ffb6059f396964256bfed841dd5dbcaf38046b7e7f7040ce5763ada24d7f`.
- Restored SHA-256: identical; size: 15,136 bytes.
- The overwritten JSON output was preserved separately under `recovery-backups/` before restoration.
- A staging copy was parsed separately; no report was written into the raw corpus.

**Recovery status: PASS.** The restored source matches the manifest hash exactly.

## Structural parser revalidation

The stable structural parser passed the restored Lua 5.5 sample:

| Metric | Result |
|---|---:|
| Files | 1/1 PASS |
| Lua version | 5.5 |
| Functions | 59 |
| Instructions | 1,622 |
| Constants | 468 |
| Strings | 859 |
| Structural failures | 0 |

The broader `tools/lua-modules/raw-modules` corpus also passed: **66/66 files**, comprising 33 Lua 5.4 modules and 33 Lua 5.5 modules; zero structural failures. This validates chunk structure only, not instruction semantics.

## Official references

- Lua 5.4.9 opcode names: https://lua.org/source/5.4/lopnames.h.html
- Lua 5.4.9 instruction layout: https://lua.org/source/5.4/lopcodes.h.html
- Lua 5.5.1 opcode names: https://www.lua.org/source/5.5/lopnames.h.html
- Lua 5.5.1 instruction layout: https://lua.org/source/5.5/lopcodes.h.html
- Lua 5.5.1 function metadata/load order: https://lua.org/source/5.5/lundump.c.html

The stock opcode tables contain 83 Lua 5.4 opcodes and 85 Lua 5.5 opcodes. Both official instruction layouts place the 7-bit opcode field at bits 0–6. Lua 5.5 function metadata is loaded as `numparams`, flags, then `maxstacksize`; the experimental A-register bound check uses that order.

## Opcode extraction results

### Lua 5.4

- 33 modules; 36,480 instructions.
- Reading bits 0–6 against the official Lua 5.4.9 opcode table: **36,480/36,480 recognized (100%)**.
- A-register bounds check: 31,246 recognized instructions with A-register semantics checked; 7 out of range (**0.022%**).

**Status:** Strong compatibility with stock Lua 5.4 instruction numbering and layout in this sample corpus.

### Lua 5.5

- 33 modules; 36,530 instructions.
- Reading bits 0–6 against the official Lua 5.5.1 opcode table: **21,668/36,530 recognized (59.316%)**.
- The remaining **14,862** opcode values are all in the range **85–127**, with **38 distinct values**. These are outside the stock Lua 5.5 opcode-name table (IDs 0–84).
- Most frequent non-stock IDs include 103 (2,215), 123 (1,849), 110 (1,824), 109 (1,693), 125 (1,640), 120 (1,146), 98 (998), and 116 (809).
- A-register bounds check on recognized stock-name opcodes: 21,215 checked; 1,198 out of range (**5.647%**). Most of these are associated with candidate opcode ID 43 (`BXOR`): 1,167/3,661 (**31.88%**); `IDIV`: 24/953 (2.52%); `SETLIST`: 7/761 (0.92%).

**Status:** The stock Lua 5.5 opcode mapping does not explain the full instruction corpus. The 38 IDs above 84 are candidates for a game-specific opcode extension, opcode remapping, or another transformation. The A-register anomalies also show that simply assigning stock meanings to every matching ID is not yet safe.

## Rejected false-positive candidate: bits 8–14

An exploratory scan found that bits 8–14 happened to fall inside the stock opcode-name range for 36,502/36,530 instructions (99.923%). This is **not accepted as an opcode mapping**. In the official format, the A-register field begins at bit 7, so bits 8–14 overlap the A-register value. The apparent match is therefore compatible with a false positive caused by interpreting part of operand A as an opcode.

The A-register check further rejects this candidate: 9,735/36,497 checked A values were outside the function's max-stack bound (**26.673%**), compared with 5.647% for the stock bit-0 candidate. Do not use the bits-8–14 result to build a disassembler.

## Interpretation boundary

**Supported findings:**

1. The preserved Lua 5.4 modules match stock Lua 5.4 opcode numbering at bits 0–6.
2. The preserved Lua 5.5 modules do not match the complete stock Lua 5.5 opcode table at bits 0–6.
3. All 14,862 non-matching Lua 5.5 opcode values are within IDs 85–127; 38 distinct values occur.
4. The bits-8–14 result is a rejected false positive, not a recovered opcode offset.

**Not yet proven:** whether Lua 5.5 uses a game-specific extension table, remapped opcode IDs, an instruction transformation, or a mixture of these. No meaning has been assigned to IDs 85–127. No custom virtual machine has been confirmed.

## Validation ledger

- **PASS** — Exact-hash restoration of the overwritten Lua 5.5 sample.
- **PASS** — Structural revalidation of the restored sample (1/1).
- **PASS** — Structural scan of 66 preserved raw modules (66/66).
- **PASS** — Lua 5.4 stock opcode-name inventory at bits 0–6 (36,480/36,480 recognized).
- **FAIL** — Lua 5.5 stock opcode-name inventory at bits 0–6 (14,862/36,530 values outside the stock table).
- **FAIL / REJECTED HYPOTHESIS** — Lua 5.5 bits-8–14 candidate; apparent name coverage is a false positive because it overlaps operand A and fails the A-register bound check more often.
- **BLOCKED** — AssetRipper re-export recovery path; free RAM was approximately 487 MB, below the previously established 875–975 MB safety gate. Exact-hash recovery made re-export unnecessary for this sample.
- **NOT RUN** — Semantic disassembly, operand-format validation for the non-stock IDs, control-flow validation, opcode remapping discovery, and confirmed `GetTableData` callsites.

## Artifacts

- Stable parser: `tools/parse-lua-chunks.js` (not modified by this experiment).
- Experimental inventory parser: `tools/experiments/parse-lua55-opcode-inventory.js` (separate from the stable parser; not production tooling).
- Single-sample structural report: `validation-reports/HERO_DATA_MANAGER_LUA55_STRUCTURAL_REVALIDATION_2026-10-30.json`.
- 66-module inventory: `validation-reports/LUA_OPCODE_INVENTORY_RAW_MODULES_2026-10-30.json` and companion CSV files. The per-file CSV includes bit-0 opcode IDs, exact function/PC locations for the rejected bits-8 hypothesis, and A-register diagnostics.
- Compact module-level comparison: `validation-reports/LUA_OPCODE_MODULE_SUMMARY_2026-10-30.csv`.

## Next safe steps

1. Validate B/C/k operands for each empirically mapped opcode, including IDs that map to the same Lua 5.4 operation name.
2. Validate signed/unsigned jump offsets, branch destinations, constant-pool indices, upvalue references, and prototype references.
3. Resolve the remaining opcode aliases/specialized variants before treating the crosswalk as definitive.
4. Build a separate experimental disassembler only after operand and control-flow checks pass; keep `parse-lua-chunks.js` unchanged.
5. Use the validated disassembler to confirm actual `GetTableData` callsites and connect them to DataTable names.

Publication: both investigation reports, the crosswalk CSV, the compact module summary, and the 66-module inventory summary were committed to `research/dark-war-survival-captures`. No merge, deployment, or external game release was performed.

[executed on device: WIN-RPC1DR79TVC (a1fb0fea-9200-442c-8e10-e849494b85b1)]