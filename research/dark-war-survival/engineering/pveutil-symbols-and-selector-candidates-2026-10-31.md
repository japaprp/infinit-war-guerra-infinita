# PveUtil — inventário inicial de símbolos e seletores (2026-10-31)

## Fonte e integridade

Este relatório usa o TextAsset exportado do bundle ID 7:
- `Assets/Main/LuaTxt/Util/PveUtil.bytes`
- 88,707 bytes
- SHA-256: `691089c87fbb6beb6452f88be999e19f118b961f809955c721087071eb2f161a`
- Parser estrutural Lua 5.4: PASS; 139 funções, 8,793 instruções, 1,847 constantes, 44 strings candidatas de nomes de tabelas.

O parser experimental de fingerprints/opcodes também terminou com PASS, 0 arquivos falhos e 0 IDs de opcode desconhecidos para a versão Lua 5.4 analisada.

## Símbolos observados

O protótipo raiz contém, entre outras, a constante string `GetArmyXmlName` (constant index 127). O mesmo módulo contém:
- `GetHeroXmlName`
- `GetHeroLevelUpXmlName`
- `GetLwHeroTableName`
- `GetHeroCampXmlName`
- `GetABTestTableName`
- `GetTableData`
- `GetTableDataLine`

A presença desses nomes confirma que o módulo contém referências a resolutores de nomes de tabelas e a acessores de dados. A relação exata entre cada nome público e o protótipo filho correspondente ainda não foi reconstruída.

## Candidatos a seletores — Lua 5.4

| Function index | Line defined | Instruction count | Constant evidence |
|---:|---:|---:|---|
| 61 | 912 | 79 | `GetABTestTableName`, `TableName` |
| 68 | 1010 | 102 | `GetHeroXmlName`, `GetHeroLevelUpXmlName`, `TableName`, `heroes_levelup_PVE_ABTest`, `aps_heroes_rank_PVE_ABTest` |
| 69 | 1030 | 102 | mesmos nomes de resolver/switch da função 68 |
| 70 | 1050 | 102 | mesmos nomes de resolver/switch da função 68 |
| 106 | 2105 | 359 | `GetHeroLevelUpXmlName`, `GetLwHeroTableName`, `GetHeroCampXmlName`, `ds_equip_attribute_PVE_ABTest`, `ds_equip_promote_PVE_ABTest` |
| 136 | 3163 | 14 | `army_xml_use_b`, `TableName`, `Army_B`, `Army` |

A função 136 é um candidato forte para investigar uma seleção de nome de tabela de Army baseada em `army_xml_use_b`, mas a condição e o retorno ainda não foram disassemblados. Não declarar ainda que o switch retorna `Army_B` quando true nem que essa variante está ativa no jogo.

As funções 68–70 compartilham a mesma contagem de instruções e a mesma sequência de IDs de opcode no CSV. Isso é um sinal de estrutura repetida, não prova de que retornem a mesma tabela.

## Próximas verificações estáticas

1. Decodificar as instruções do protótipo raiz e reconstruir os índices dos protótipos filhos, ligando `GetArmyXmlName` ao seu corpo de função.
2. Disassemblar a função 136 e identificar exatamente como lê `army_xml_use_b`, `TableName.Army_B` e `TableName.Army`.
3. Disassemblar as funções 61, 68–70 e 106 para separar os seletores de herói, level-up, LW e equipamento.
4. Cruzar os nomes retornados com os assets DataTable do índice.
5. Repetir a análise no bundle ID 84 (Lua 5.5) e comparar fingerprints, constantes e instruções.

## Estado

- Extração PveUtil do bundle ID 7: PASS.
- Parser Lua 5.4: PASS.
- Inventário inicial de símbolos: PASS.
- Mapeamento nome público → protótipo filho: NOT RUN.
- Disassembly semântico dos seletores: NOT RUN.
- Bundle ID 84 / Lua 5.5: NOT RUN.
- Variante ativa no servidor: BLOCKED (depende de configuração/runtime remoto que não está contido nesta evidência).

## Limite

Este é um inventário estático do bytecode cliente. Não revela sozinho a configuração ativa no servidor, os valores de AB test em produção, nem os dados remotos retornados pelas tabelas.
