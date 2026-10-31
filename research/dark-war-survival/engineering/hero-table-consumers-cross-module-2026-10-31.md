# Consumo da tabela dinâmica de heróis entre módulos

**Resultado:** PASS — 18 fluxos diretos `GetTableData` confirmados (9 por versão Lua 5.4/5.5), além de um callsite de `GetHeroXmlName` em HeroWeaponManager ainda não associado a uma chamada direta de `GetTableData`.

## 1. Fontes e método

Fonte principal: `validation-reports/DARKWAR_GETTABLEDATA_CALL_ARGUMENTS_2026-10-30.csv`, cruzada com `HERO_SELECTOR_CALLSITES_2026-10-31.json`.

O inventário de argumentos reconstrói o fluxo de registradores até chamadas `GetTableData`, identificando nome de tabela, chave e campo. Os nomes de tabela vêm do retorno de `HeroUtils.GetHeroXmlName()`. Os resultados são estáticos e não revelam os valores reais do servidor.

## 2. Fluxos confirmados em cada versão

| Módulo | Linha-fonte | Chave/ID | Campo consultado |
|---|---:|---|---|
| HeroDataManager | 609 | `heroId` do registro | `camp` |
| HeroDataManager | 638 | elemento de `typeHeroes` | `camp` |
| HeroEquipManager | 252 | registrador R3 | `camp` |
| HeroEquipManager | 377 | registrador R1 | `camp` |
| HeroEquipManager | 390 | registrador R1 | `camp` |
| UIHeroListCtrl | 282 | `tonumber(heroId)` do primeiro registro | `order` |
| UIHeroListCtrl | 282 | `tonumber(heroId)` do segundo registro | `order` |
| UIWorldCupActListPanelCtrl | 12 | `HeroEvolveActivityManager.GetToHeroId()` | `rarity` |
| UIWorldCupActListPanelCtrl | 12 | `HeroEvolveActivityManager.GetToHeroId()` | `desc` |

O mesmo conjunto de nove fluxos foi identificado em Lua 5.4 e Lua 5.5: **18 fluxos no total**.

## 3. Interpretação funcional permitida

- **HeroDataManager:** usa a tabela dinâmica para consultar o campo `camp` por ID de herói e para percorrer `typeHeroes`.
- **HeroEquipManager:** consulta `camp` usando chaves recebidas por seus métodos; isso conecta os sistemas de equipamento à mesma tabela lógica de heróis.
- **UIHeroListCtrl:** consulta `order` para dois IDs de herói presentes em registros/listas.
- **UIWorldCupActListPanelCtrl:** usa o ID de herói de destino da atividade de evolução para consultar `rarity` e `desc`.

Esses fluxos confirmam que a tabela selecionada por `GetHeroXmlName()` não serve apenas ao carregamento básico de heróis: também participa da ordenação de listas, da classificação/descrição de heróis em atividade e de consultas relacionadas a equipamento.

## 4. Lacuna: HeroWeaponManager

O callsite scan encontra uma chamada de `GetHeroXmlName()` em `HeroWeaponManager`, função 6, linha 37, em ambas as versões. Porém, o inventário atual de chamadas `GetTableData` não registra essa função como um consumidor direto da tabela dinâmica.

Não inferir o destino da chamada: o retorno pode alimentar outro helper, ser armazenado ou seguir outro caminho. A função precisa de trace próprio antes de classificarmos o uso.

## 5. Próximas etapas

1. Abrir o trace de `HeroWeaponManager` função 6 para identificar o destino do retorno de `GetHeroXmlName()`.
2. Decodificar os argumentos de `HeroEquipManager` para substituir R1/R3 por significados somente quando os fluxos de entrada permitirem.
3. Exportar e inspecionar os DataTables físicos para validar que as colunas `camp`, `order`, `rarity` e `desc` existem nas variantes base/B.
4. Manter a exportação bloqueada até a RAM livre alcançar 875 MB. Medição nesta rodada: 420,2 MB.

Nenhuma alteração de gameplay, merge, deploy ou exclusão foi realizada.
