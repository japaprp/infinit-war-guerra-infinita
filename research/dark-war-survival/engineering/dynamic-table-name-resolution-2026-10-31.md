# Dark War: Survival — Dynamic table-name switches

Date: 2026-10-31  
Project identity: Dark War: Survival is the original game being studied; Guerra Infinita is the planned reconstruction. This is one project and one source of truth.

## Scope and method

Read-only analysis of the installed Android client com.readygo.dark.gp on Galaxy S21 SM-G991B (ADB serial RXCT100JBGV). No runtime injection, account manipulation, game modification, or production service access was performed.

The source modules were exported from the two UIH AssetBundles already present in the local AssetRipper export. Each raw .bytes file was parsed independently with the existing experimental Lua function-fingerprint parser. Lua 5.4 instructions use the stock opcode table; Lua 5.5 instructions use the accepted fingerprint-based 97-ID Lua 5.5-to-5.4 crosswalk. The stable full-chunk parser was not modified.

## Source evidence

| Variant | Bundle | TextAsset path | Bytes | SHA-256 | Parse |
|---|---|---|---:|---|---|
| Lua 5.4 | lua_scripts_ui_uih_657a42ccd0f37f36faefccf3d1ff0bc6.bundle | Assets/Main/LuaTxt/UI/UIHero2/HeroUtils.bytes | 72,838 | 11dc09c87bd052b81efa427ccfd800b5ec41b1d246a5d68f7a42df6dc728c53c | PASS |
| Lua 5.5 | lua_scripts_ui_55_uih_990c4205851bb33a13f8325bbb1b55eb.bundle | Assets/Main/LuaTxt_55/UI/UIHero2/HeroUtils.bytes | 59,822 | d99b88bba24b35e2400ac8f648570d82c4892140941211e19d53c50764aa153b | PASS |

Both variants contain 175 functions. Lua 5.4 contains 6,049 instructions and 1,695 constants; Lua 5.5 contains 6,048 instructions and 1,690 constants. Both root prototypes contain 167 child prototypes. Function assignments in the root prototype identify GetHeroXmlName as child prototype 99 / function 106 and GetLwHeroTableName as child prototype 100 / function 107.

## Confirmed static behavior

### HeroUtils.GetHeroXmlName()

- Function index: 106
- Debug lines: 1529–1536
- Instruction count: 14 in both Lua variants
- Calls _ENV.LuaEntry.DataConfig.CheckSwitch("ABtest_aps_new_heroes").
- The two return expressions are _ENV.TableName.NewHeroesB and _ENV.TableName.NewHeroes.

Conclusion: the client selects between the NewHeroesB and NewHeroes table-name constants using the ABtest_aps_new_heroes switch. This is a statically recovered code path, not a claim about which switch value is active on a live server.

### HeroUtils.GetLwHeroTableName()

- Function index: 107
- Debug lines: 1538–1544
- Instruction count: 16 in both Lua variants
- Calls _ENV.LuaEntry.DataConfig.CheckSwitch("ABtest_lw_hero").
- The two return expressions are _ENV.TableName.LW_Hero_B and _ENV.TableName.LW_Hero.
- The function also contains an additional TEST R0 / jump pair. Its precise guard semantics are not resolved by the current conservative register tracer.

Conclusion: the client contains a switch-controlled selection between LW_Hero_B and LW_Hero; the additional guard remains explicitly unresolved.

### HeroLevelUpTemplateManager.GetTableName()

- Function index: 5
- Debug lines: 18–28
- Instruction count: 20 in both Lua variants
- Lua 5.4 source module SHA-256: 9b1ff70670b820bb4fc3f59cd10adbb8a397ee3e8efab3f1811fc35be9652b42
- Lua 5.5 source module SHA-256: 1e9e37ca404e97d3e387855f1b40eca102eb2ad5d6412b939d46be496f78a72c
- Both module variants parse successfully: 13 functions, 155 instructions, 56 constants per variant.
- The 20-instruction sequence in Lua 5.5 maps instruction-for-instruction to the Lua 5.4 sequence using the accepted opcode crosswalk.

Confirmed behavior:

1. Read self.useTableName.
2. If the field is already non-nil, return the cached value.
3. Otherwise call LuaEntry.DataConfig.CheckSwitch("ABtest_heroes_levelup").
4. If the switch is true, assign TableName.NewHeroesLevelUp_B to self.useTableName; otherwise assign TableName.NewHeroesLevelUp.
5. Return self.useTableName.

This is a lazy table-name cache, not merely a direct selector. The same manager exposes accessors for experience, attack, defense, army count, and breakthrough requirements, which makes this selector relevant to hero progression data.

## Additional original helper bundles recovered

Four utility bundles were copied read-only from /sdcard/Android/data/com.readygo.dark.gp/files/AssetBundles/ into Selected_Bundles/Additional_Helper_Lua_Cache_2026-10-31/.

| Bundle | Bytes | Local SHA-256 | Phone-to-PC hash comparison |
|---|---:|---|---|
| lua_scripts_util_9422a92002413f82ce5978712bb013ad.bundle | 556,442 | 66b11e278cac65104dc211b8109e5a98ee87bcb6138341f8dfd2f882fe5bbef8 | PASS |
| lua_scripts_util_55_b32e6a6b548a2f08eb7ff1ebd93ec297.bundle | 593,566 | 132bfa7337b3920c218f0b7eb8ef3a5f5a1f966ea038741d1062a41e3f1fd532 | PASS |
| lua_scripts_util_d4a89127ecf72d48ba50006c97866de5.bundle | 556,027 | da6dc2b75823f566b8c6e126c8cf318c4b563b92b92c35d4272fd0c46f838060 | PASS |
| lua_scripts_util_55_c87c1e51e40d1d9c81647d0cdb164738.bundle | 593,043 | cdbbb1e824e1a0eb1a5f88bccfebc5df7180fea1bc24836d788ae45936b2b9f6 | PASS |

For the first two utility bundles, the original Lua index maps PveUtil.bytes to bundle IDs 7 and 84 respectively. The bundle-ID map identifies these as the Lua 5.4 lua_scripts_util_9422... and Lua 5.5 lua_scripts_util_55_b32... bundles. The raw bundles are now preserved locally, but their TextAsset exports have not yet been run.

## Validation ledger

- PASS — Galaxy S21 connected; installed package path and original AssetBundles cache read successfully.
- PASS — Lua 5.4 HeroUtils.bytes full structural parse, 1/1.
- PASS — Lua 5.5 HeroUtils.bytes full structural parse, 1/1.
- PASS — Root-prototype closure assignments map both helper names to functions 106 and 107 in both variants.
- PASS — Static instruction traces recover both HeroUtils CheckSwitch calls and both pairs of table-name return expressions.
- PASS — HeroLevelUpTemplateManager Lua 5.4 and 5.5 modules each parse fully, 1/1.
- PASS — HeroLevelUpTemplateManager.GetTableName maps to the same 20-instruction sequence in Lua 5.4 and Lua 5.5.
- PASS — Static disassembly confirms the useTableName override, lazy cache, ABtest_heroes_levelup switch, and NewHeroesLevelUp_B/NewHeroesLevelUp return values.
- PASS — Four utility bundle pulls; each local SHA-256 exactly matches adb shell sha256sum on the phone.
- BLOCKED — Export PveUtil.bytes from the two utility bundles. Current free RAM was approximately 383 MB at the latest check; the previously established AssetRipper safety gate is 875–975 MB. AssetRipper was not started.
- BLOCKED — Resolve the additional TEST R0 guard in GetLwHeroTableName.
- NOT RUN — Runtime switch values, server-selected table variant, dynamic execution/reachability, and semantic validation against live server responses.

## Next safe steps

1. Wait until free RAM reaches the established 875–975 MB gate before opening AssetRipper.
2. Export only the two utility bundles containing PveUtil (base and 55 variants); preserve the original bundles and record hashes before/after export.
3. Parse both PveUtil.bytes files and trace GetArmyXmlName() to the exact TableName return values.
4. Correlate all three resolved selectors with the DataTable asset index and trace their callers.
5. Cross-check all resolved table names against the original DataTable bundle exports; keep dynamic or unresolved values marked as such.

No merge, deployment, publication of game binaries, account action, or external game release was performed.

[executed on device: WIN-RPC1DR79TVC (a1fb0fea-9200-442c-8e10-e849494b85b1)]

[executed on device: WIN-RPC1DR79TVC (a1fb0fea-9200-442c-8e10-e849494b85b1)]

## Retomada — verificação operacional

- PASS — Computador Windows reconectado e consulta de memória concluída.
- BLOCKED — Memória livre medida nesta retomada: 569,780 KB (aproximadamente 556.4 MiB), ainda abaixo da faixa de segurança de 875–975 MB definida para AssetRipper.
- PASS — Busca por arquivo exportado `PveUtil.bytes` em DarkWar_Analysis_Core concluída: nenhum arquivo encontrado. Isso confirma que a exportação ainda não ocorreu; não significa ausência do módulo nos bundles originais.
- NOT RUN — AssetRipper permanece fechado. Nenhum bundle original foi alterado nesta retomada.

Próxima ação segura: aguardar a memória livre atingir pelo menos 875 MB; então exportar somente os dois bundles utilitários previamente identificados como contendo PveUtil e validar hashes antes/depois.
