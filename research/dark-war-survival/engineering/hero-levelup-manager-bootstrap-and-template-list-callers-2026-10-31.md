# HeroLevelUpTemplateManager — bootstrap, DataCenter e consumidores de GetHeroTemplateList (2026-10-31)

## 1. O que o módulo faz no próprio root

O protótipo raiz (função 1, linha 0) de `HeroLevelUpTemplateManager`, nas duas versões, contém as constantes:
- `BaseClass`
- `HeroLevelUpTemplateManager`
- `__init`, `__delete`, `Startup`, `GetTableName`, `GetNeedMainLv`
- os sete acessores `GetExp`, `GetAtk`, `GetDef`, `GetArmyNum`, `GetBreakRequire`, `GetBreakRequireRank`, `GetBreakRequireBase`.

O fluxo inicial do root é:
1. obtém `BaseClass` do ambiente;
2. carrega a string `HeroLevelUpTemplateManager`;
3. chama `BaseClass("HeroLevelUpTemplateManager")` para criar a classe;
4. associa closures aos campos/métodos da classe.

Isso confirma a criação da classe e a exportação dos métodos na tabela/classe. Não há no root uma atribuição explícita `DataCenter.HeroLevelUpTemplateManager = ...`, nem uma chamada literal `require("HeroLevelUpTemplateManager")`.

## 2. O que sabemos — e o que não sabemos — sobre o registro

Fatos:
- o asset está no bundle de scripts DataCenter `lua_scripts_datacenter_h_...`;
- os módulos de manager examinados usam o padrão `BaseClass("NomeDoManager")`;
- `GetNeedMainLv` usa o global `DataCenter` para obter `BuildManager.MainLv`;
- a busca literal por `HeroLevelUpTemplateManager` no inventário de constantes, fora do próprio root, retorna zero hits;
- a árvore exportada `tools/lua-modules` não contém um módulo/arquivo de bootstrap identificável chamado `DataCenter`, `BaseClass` ou `LuaEntry`.

Inferência, ainda não prova: um carregador central pode descobrir os módulos DataCenter, instanciar classes BaseClass e publicá-las em `DataCenter` usando o nome da classe. O padrão dos managers é compatível com isso, mas o código do carregador não está no conjunto de módulos exportados.

**Estado:** criação da classe PASS; mecanismo de registro/publicação no DataCenter BLOCKED por falta do módulo bootstrap/loader. Não declarar que o manager foi registrado só porque o root declara a classe.

## 3. Consumidores de GetHeroTemplateList

A busca exata encontrou seis referências no inventário: três funções em Lua 5.4 e as correspondentes três em Lua 5.5. Em todos os casos, o campo acessado é `HeroUtils.GetHeroTemplateList`, chamado sem argumentos explícitos e com um retorno.

| Módulo | Função / linhas | PC Lua 5.4 | PC Lua 5.5 | Contexto |
|---|---|---:|---:|---|
| HeroDataManager | fn30, 393–448 | GETFIELD 57 → CALL 58 | GETFIELD 61 → CALL 62 | usa a lista de templates no fluxo de consulta/gestão de heróis e equipamentos |
| HeroWeaponManager | fn29, 283–296 | GETFIELD 4 → CALL 5 | GETFIELD 4 → CALL 5 | usa a lista no fluxo de elegibilidade/visibilidade de armas |
| UIHeroListCtrl | fn20, 373–440 | GETFIELD 30 → CALL 31 | GETFIELD 30 → CALL 31 | usa a lista para compor a lista de heróis da interface |

A chamada tem `CALL B=1, C=2`: zero argumentos explícitos e um resultado. O receptor é o módulo/tabela `HeroUtils`.

**Correção importante:** `UIHeroListCtrl` não chama `DataCenter.HeroDataManager.GetHeroTemplateList`. Ela chama `HeroUtils.GetHeroTemplateList`; separadamente, também usa `DataCenter.HeroDataManager.GetAllHeroList` e `HeroUtils.GetHeroAttr`. HeroDataManager e HeroWeaponManager também chamam a mesma função de HeroUtils.

## 4. Separação dos sete acessores de evolução

`GetHeroTemplateList` não é um dos sete acessores de `HeroLevelUpTemplateManager`. As seis referências encontradas não chamam:
- `GetExp`
- `GetAtk`
- `GetDef`
- `GetArmyNum`
- `GetBreakRequire`
- `GetBreakRequireRank`
- `GetBreakRequireBase`

A busca literal externa pelos sete nomes continua com zero hits no inventário disponível. Isso não exclui chamadas por alias, referências de função ou acesso dinâmico.

## 5. Limite do conjunto extraído

Não foi encontrado arquivo chamado `HeroUtils.bytes` na árvore atual `tools/lua-modules`, nem um módulo de bootstrap DataCenter/BaseClass/LuaEntry. Portanto:
- consumidores de `HeroUtils.GetHeroTemplateList`: PASS, três callsites em ambas versões;
- implementação interna de `GetHeroTemplateList`: BLOCKED, fonte não extraída/indexada;
- registro efetivo de `HeroLevelUpTemplateManager` em DataCenter: BLOCKED, loader ausente;
- relação direta entre os consumidores de GetHeroTemplateList e os sete acessores: nenhuma demonstrada.

## Próxima coleta necessária

1. Identificar no manifesto os bundles comuns/bootstrap que contêm `BaseClass`, `DataCenter`, `LuaEntry` e `HeroUtils`.
2. Pré-checar hashes/tamanhos e exportar apenas quando a RAM livre atingir 875 MB.
3. Rastrear o carregador que publica classes no DataCenter.
4. Extrair a implementação de HeroUtils e confirmar o conteúdo/ordenação/filtragem da lista de templates.
5. Manter os sete acessores de evolução separados até surgir um callsite comprovado.
