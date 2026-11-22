# HeroDataManager — consumo do seletor dinâmico de tabela de heróis

**Status:** PASS — quatro traces (duas funções × duas versões) confirmam o consumo do nome de tabela retornado por `HeroUtils.GetHeroXmlName()`.

## Escopo e fonte

Foram analisados os módulos já presentes no inventário de funções Lua:
- `HeroDataManager`, Lua 5.4, função 43 (linhas 609–620) e função 46 (linhas 638–666).
- `HeroDataManager`, Lua 5.5, as mesmas funções e linhas.

Não houve nova extração de bundle. Os nomes de opcode Lua 5.5 foram resolvidos pelo crosswalk empírico previamente validado, usando somente mapeamentos HIGH sem erros nem IDs não vistos no holdout.

## Fluxo comprovado

| Versão | Função | Chamada do seletor | Chamada GetTableData |
|---|---:|---:|---:|
| Lua 5.4 | 43 | PC 19 | PC 22 |
| Lua 5.4 | 46 | PC 38 | PC 41 |
| Lua 5.5 | 43 | PC 19 | PC 22 |
| Lua 5.5 | 46 | PC 38 | PC 41 |

Em todos os quatro casos:
1. O código obtém `HeroUtils.GetHeroXmlName` por `GETFIELD`.
2. A instrução imediatamente seguinte é `CALL` no mesmo registrador, com `B=1`: zero argumentos explícitos e um valor de retorno.
3. O nome da tabela retornado é usado como primeiro argumento da chamada subsequente a `GetTableData`.
4. A chamada a `GetTableData` usa três argumentos explícitos: **nome de tabela**, **heroId** e **camp**.

Isso comprova que a seleção `NewHeroes` / `NewHeroesB` é consumida em caminhos reais de leitura de dados do herói. Não é apenas uma função auxiliar definida e sem uso nos módulos indexados.

## Interpretação funcional limitada

- A escolha do nome da tabela é feita em `HeroUtils.GetHeroXmlName()`.
- `HeroDataManager` usa o nome retornado para buscar dados associados a um `heroId` e ao campo/categoria `camp`.
- O valor do switch `ABtest_aps_new_heroes` em produção continua desconhecido.
- Este trace não determina o conteúdo das linhas de `NewHeroes` ou `NewHeroesB`; é necessário localizar e validar os DataTables originais para comparar os registros.

## Evidência e reprodução

- [Analyzer de consumidores](../tools/analyze-herodata-manager-table-consumers.js)
- [Evidência JSON](./evidence/herodata-manager-dynamic-hero-table-consumers-2026-10-31.json)

Nenhuma regra de gameplay, configuração remota ou arquivo original foi alterado.
