# PveUtil — resolução de GetArmyXmlName e seletor de Army (2026-10-31)

## Conclusão principal

O símbolo público `GetArmyXmlName` está ligado ao protótipo filho ordinal 85 do protótipo raiz, correspondente à função 136 de `PveUtil.bytes` Lua 5.4 (linha-fonte 3163). O corpo chama `LuaEntry.DataConfig.CheckSwitch("army_xml_use_b")` e seleciona entre `TableName.Army_B` e `TableName.Army`.

**A polaridade do seletor Lua 5.4 agora está certificada pelo decoder independente e pela semântica oficial do interpretador Lua 5.4.9:**
- `CheckSwitch("army_xml_use_b") == true` → `TableName.Army_B`.
- `CheckSwitch("army_xml_use_b") == false` → `TableName.Army`.

Isso descreve a lógica do bytecode cliente. Não revela o valor ativo do switch no servidor nem prova qual tabela foi entregue em runtime.

## Associação do símbolo público — Lua 5.4

Arquivo:
- `Assets/Main/LuaTxt/Util/PveUtil.bytes`
- SHA-256: `691089c87fbb6beb6452f88be999e19f118b961f809955c721087071eb2f161a`

Cadeia de associação:
1. A tabela de constantes do protótipo raiz contém `GetArmyXmlName` no índice 127.
2. A instrução `SETFIELD` do protótipo raiz na posição 243 usa a constante 127 e o registrador R94.
3. A instrução `CLOSURE` na posição 162 cria o closure em R94 a partir do protótipo filho ordinal 85.
4. O protótipo filho ordinal 85 corresponde à função nº 136, linha-fonte 3163.

Metadados: função 136, depth 1, linhas 3163–3169, zero parâmetros, 14 instruções, 7 constantes, 1 upvalue e nenhum protótipo filho.

## Constantes e corpo da função

| Índice | Constante |
|---:|---|
| 0 | `LuaEntry` |
| 1 | `DataConfig` |
| 2 | `CheckSwitch` |
| 3 | `army_xml_use_b` |
| 4 | `TableName` |
| 5 | `Army_B` |
| 6 | `Army` |

| PC | Opcode | Operação |
|---:|---|---|
| 0 | GETTABUP | Lê `LuaEntry` |
| 1 | GETFIELD | Acessa `DataConfig` |
| 2 | SELF | Prepara `CheckSwitch` |
| 3 | LOADK | Carrega `army_xml_use_b` |
| 4 | CALL | Executa a chamada |
| 5 | TEST | Testa o resultado em R0 com k=0 |
| 6 | JMP | Deslocamento assinado +3; destino PC 10 |
| 7–9 | GETTABUP, GETFIELD, RETURN1 | Retorna `TableName.Army_B` |
| 10–12 | GETTABUP, GETFIELD, RETURN1 | Retorna `TableName.Army` |
| 13 | RETURN0 | Retorno vazio de encerramento |

Raw instruction words Lua 5.4:
`0000000b;0100000e;02008014;00018103;02030044;00000042;80000138;0400008b;0501008e;000200c8;0400008b;0601008e;000200c8;000100c7`

### Validação independente do fluxo de controle

Foi criado o decoder independente:
`tools/experiments/decode-lua54-control-flow-independent.js`

Ele recebe o CSV de palavras brutas, extrai os campos iABC/iJ diretamente e não importa nem chama os parsers de chunk ou de fingerprint.

Evidência:
- Resultado JSON local: `validation-reports/PVEUTIL_GETARMYXMLNAME_LUA54_INDEPENDENT_JUMP_DECODE_2026-10-31.json`
- Status: `PASS_INDEPENDENT_LUA54_FIELD_AND_CONTROL_FLOW_DECODE`
- PC 6, word `80000138`, formato iJ, sJ=+3, destino PC 10.
- PC 5, word `00000042`, formato iABC, A=0, k=0, skip target PC 7.
- A estrutura dos dois caminhos foi conferida até os respectivos `RETURN1`.

A interpretação de `TEST` foi conferida contra Lua 5.4.9:
- `lvm.c` define `cond = !l_isfalse(R[A])` para `OP_TEST` e `docondjump()` executa o salto seguinte quando `cond == k`; quando são diferentes, pula a instrução seguinte.
- Com k=0, retorno verdadeiro produz `cond=true`, pula o JMP e segue para PC 7 (`Army_B`).
- Retorno falso produz `cond=false`, executa o JMP para PC 10 (`Army`).
- `lopcodes.h` confirma o formato isJ com sJ assinado de 25 bits e a codificação excess-K usada pelo decoder.

Referências de implementação:
- https://www.lua.org/source/5.4/lvm.c.html (macros de salto e caso OP_TEST)
- https://www.lua.org/source/5.4/lopcodes.h.html (layout iABC/isJ e GETARG_sJ)

## Correspondência Lua 5.5

Fonte:
- `Assets/Main/LuaTxt_55/Util/PveUtil.bytes`
- SHA-256: `3ac2041fbf8f4a55f5f59f47c42ca2df9e6c511f72d8e9e47cca2be4d9d9e247`

A função correspondente foi localizada na linha-fonte 3163, função 136, com 14 instruções e as mesmas sete constantes.

Raw words Lua 5.5:
`00000062;01000067;0200002e;00018179;02030005;00000050;8000012b;040000fd;050100fb;00020091;040000be;060100fb;00020091;000100a8`

**Limite:** a polaridade acima foi validada somente para o bytecode Lua 5.4. A variante 5.5 usa layout/opcodes diferentes; seu fluxo de controle ainda exige decoder específico e validação própria. Não transportar a conclusão 5.4 para 5.5 sem esse teste.

## Validações

| Item | Estado |
|---|---|
| Associação `GetArmyXmlName` → protótipo 85 → função 136 (Lua 5.4) | PASS |
| Chave `army_xml_use_b` e nomes `Army_B` / `Army` | PASS |
| Decoder independente do JMP Lua 5.4: PC 6 → PC 10 | PASS |
| Semântica de TEST/JMP confrontada com Lua 5.4.9 oficial | PASS |
| Polaridade Lua 5.4: true → Army_B; false → Army | PASS |
| Correspondência estrutural Lua 5.5 (mesma linha, 14 instruções, 7 constantes) | PASS |
| Decoder semântico do fluxo de controle Lua 5.5 | NOT RUN |
| Valor ativo de `army_xml_use_b` no servidor | BLOCKED — não inferível do bytecode cliente |

## Impacto para Guerra Infinita

- O modelo de dados deve comportar as variantes `Army` e `Army_B`.
- A resolução deve ficar encapsulada em uma regra configurável equivalente a `GetArmyXmlName`.
- A lógica reconstruída pode representar a polaridade do cliente 5.4, mas não deve presumir qual configuração remota está ativa.
- Não expor nomes internos do cliente como API pública; manter identificadores próprios e uma tabela de correspondência documentada.

## Próximas etapas

1. Criar e validar decoder independente para o layout Lua 5.5, começando por funções simples e comparando com o crosswalk já levantado.
2. Aplicar a mesma cadeia de closure/root assignment aos seletores `GetABTestTableName`, `GetHeroXmlName`, `GetHeroLevelUpXmlName`, `GetLwHeroTableName` e `GetHeroCampXmlName`.
3. Validar individualmente a polaridade de cada seletor; não presumir que todos usam o mesmo padrão de branches.
4. Cruzar os nomes com DataTable e assets presentes.
5. Só então traduzir as regras confirmadas para testes e especificações de Guerra Infinita.

## Limites

A análise é estática e baseada em bytecode cliente exportado. Não comprova o valor remoto do switch, a configuração ativa no servidor, nem quais dados foram entregues a uma conta em runtime.
