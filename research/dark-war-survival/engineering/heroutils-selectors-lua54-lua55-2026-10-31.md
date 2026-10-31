# HeroUtils — seleção de tabelas de heróis (Lua 5.4 × Lua 5.5)

**Status:** PASS — mapeamento público → closure → protótipo e decodificação das três funções nas duas variantes.  
**Escopo:** análise estática de bytecode cliente. Nenhuma configuração de produção ou regra de gameplay foi alterada.

## Fontes e integridade

| Variante | TextAsset | SHA-256 |
|---|---|---|
| Lua 5.4 | `Assets/Main/LuaTxt/UI/UIHero2/HeroUtils.bytes` | `11dc09c87bd052b81efa427ccfd800b5ec41b1d246a5d68f7a42df6dc728c53c` |
| Lua 5.5 | `Assets/Main/LuaTxt_55/UI/UIHero2/HeroUtils.bytes` | `d99b88bba24b35e2400ac8f648570d82c4892140941211e19d53c50764aa153b` |

Os dois arquivos foram copiados de exports já existentes para uma pasta de entrada de análise. Os hashes das cópias coincidem com os hashes registrados anteriormente para os TextAssets.

Parser full-chunk: **2/2 arquivos PASS**, 0 falhas estruturais; 175 funções por versão. Lua 5.4: 6.049 instruções / 1.695 constantes. Lua 5.5: 6.048 instruções / 1.690 constantes.

## Associação dos símbolos públicos

O mapeamento foi feito no protótipo raiz: constante com o nome público → instrução `SETFIELD` → registrador → instrução `CLOSURE` → ordinal do protótipo filho → função por índice/linha-fonte.

| Símbolo | Versão | SETFIELD PC | CLOSURE PC | Child ordinal | Função | Linha |
|---|---|---:|---:|---:|---:|---:|
| `GetHeroXmlName` | 5.4 | 381 | 280 | 99 | 106 | 1529–1536 |
| `GetHeroXmlName` | 5.5 | 381 | 280 | 99 | 106 | 1529–1536 |
| `GetLwHeroTableName` | 5.4 | 382 | 281 | 100 | 107 | 1538–1544 |
| `GetLwHeroTableName` | 5.5 | 382 | 281 | 100 | 107 | 1538–1544 |
| `GetHeroLevelUpXmlName` | 5.4 | 500 | 283 | 102 | 109 | 1554–1560 |
| `GetHeroLevelUpXmlName` | 5.5 | 500 | 283 | 102 | 109 | 1554–1560 |

As três funções têm 1 parâmetro formal, 1 upvalue e 7 constantes; `GetLwHeroTableName` tem 16 instruções e as outras duas têm 14. O chunk não fornece nomes de variáveis locais para esse parâmetro.

### Lua 5.5 — validação dos opcodes

Os IDs não-stock foram resolvidos pelo crosswalk empírico Lua 5.5 → Lua 5.4, usando somente entradas HIGH com zero erros e zero IDs não vistos no holdout. As três funções não têm opcode não mapeado.

No protótipo raiz, as famílias de opcode relevantes incluem CLOSURE IDs `79`, `116` e `117`, e SETFIELD IDs `44` e `109`. Não se deve tratar um único ID como representação universal de cada semântica customizada.

## Regras recuperadas

### `GetHeroXmlName`

Chama `LuaEntry.DataConfig.CheckSwitch("ABtest_aps_new_heroes")`.

- Switch verdadeiro: retorna `TableName.NewHeroesB`.
- Switch falso/nil: retorna `TableName.NewHeroes`.
- O parâmetro formal da função não é lido pelo fluxo desse seletor.

O fluxo é TEST no PC 5 e JMP no PC 6, com destino PC 10. O caminho verdadeiro pula o JMP e retorna a variante B no PC 9.

### `GetHeroLevelUpXmlName`

Chama `LuaEntry.DataConfig.CheckSwitch("ABtest_heroes_levelup")`.

- Switch verdadeiro: retorna `TableName.NewHeroesLevelUp_B`.
- Switch falso/nil: retorna `TableName.NewHeroesLevelUp`.
- O parâmetro formal da função não é lido pelo fluxo desse seletor.

O fluxo é estruturalmente igual ao seletor anterior: TEST PC 5; JMP PC 6 → PC 10; retornos nos PCs 9 e 12. Isso também é consistente com a seleção já observada em `HeroLevelUpTemplateManager.GetTableName()`, que faz cache do nome de tabela.

### `GetLwHeroTableName`

Chama `LuaEntry.DataConfig.CheckSwitch("ABtest_lw_hero")` e possui uma segunda condição sobre o parâmetro formal em R0.

- Se o switch for falso/nil: JMP PC 6 → PC 12; retorna `TableName.LW_Hero`.
- Se o switch for verdadeiro: segue para TEST R0, k=1 no PC 7.
- Se R0 for falso/nil: o TEST pula o JMP PC 8 e retorna `TableName.LW_Hero_B` no PC 11.
- Se R0 for truthy: o JMP PC 8 → PC 12 retorna `TableName.LW_Hero`.

**Regra estática:** `LW_Hero_B` é retornada quando `ABtest_lw_hero` está verdadeiro **e** o único argumento formal R0 é falso/nil. Nos demais casos, retorna `LW_Hero`.

O nome semântico desse argumento e os valores enviados pelos chamadores ainda não foram identificados. Uma busca exata por `GetLwHeroTableName` no inventário disponível de constantes de funções não encontrou callsite; isso não prova ausência de chamadas dinâmicas ou em módulos ainda não indexados.

## Limites e implicações para Guerra Infinita

1. As variantes B e padrão devem continuar representáveis no modelo de dados.
2. Os seletores devem ser regras configuráveis, não uma escolha fixa de produção.
3. A assinatura de `GetLwHeroTableName` precisa preservar o segundo critério (argumento R0); não simplificar para um booleano único.
4. Não inferir quais switches estão ativos no servidor. O bytecode cliente não fornece seus valores remotos.
5. `GetHeroCampXmlName` e `GetABTestTableName` não foram encontrados como símbolos públicos no protótipo raiz deste HeroUtils; podem estar em outros módulos.
6. Nenhuma alteração de gameplay foi feita nesta etapa.

## Artefatos reproduzíveis

- [Script de mapeamento e decodificação](../tools/analyze-heroutils-selectors.js)
- [Evidência JSON compacta](./evidence/heroutils-selector-root-mapping-2026-10-31.json)
