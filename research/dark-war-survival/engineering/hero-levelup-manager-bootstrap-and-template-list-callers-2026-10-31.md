# HeroUtils.GetHeroTemplateList — implementação e filtros confirmados (2026-10-31)

## 1. Assets e validação do par Lua 5.4/5.5

| Versão | Arquivo de análise | Tamanho | SHA-256 |
|---|---|---:|---|
| Lua 5.4 | `validation-staging/hero-utils-base/HeroUtils.bytes` | 72.838 bytes | `11dc09c87bd052b81efa427ccfd800b5ec41b1d246a5d68f7a42df6dc728c53c` |
| Lua 5.5 | `tools/experiments/heroutils-pair-input/HeroUtils_5_5.bytes` | 59.822 bytes | `d99b88bba24b35e2400ac8f648570d82c4892140941211e19d53c50764aa153b` |

Parser independente do par: **PASS**, 2 arquivos aprovados, 350 funções, 12.097 instruções, 3.385 constantes, 6.075 strings, zero falhas.

## 2. Root → função → closure

O root de `HeroUtils` associa `GetHeroTemplateList` à função 169:
- Lua 5.4: root SETFIELD PC354, `GetHeroTemplateList`, protoIndex 161, childFunctionIndex 169, linhas 2331–2427.
- Lua 5.5: o root tem a constante `GetHeroTemplateList` em K97; a função pareada 169 mantém as linhas 2331–2427 e 111 instruções. A sequência root em PC353–354 corresponde a CLOSURE → SETFIELD no par.
- Função 169: 111 instruções, 26 constantes, 2 upvalues e uma closure filha.
- Função 170: closure callback, linhas 2349–2425, 174 instruções, 27 constantes e 11 upvalues.
- Função 169 e função 170 têm a mesma faixa de linhas e contagem de instruções nas duas versões. A comparação por PC produziu mapeamento unívoco de cada opcode Lua 5.5 observado para o opcode correspondente Lua 5.4 nesses dois alvos.

## 3. Fluxo da função externa (169)

A função:
1. cria a tabela local `list`;
2. calcula valores de tempo/calendário e temporada;
3. consulta `DataConfig.CheckSwitch("hero_start_time")`;
4. chama `GetHeroXmlName()`;
5. chama `LocalController.instance.visitTable(GetHeroXmlName(), callback)`;
6. retorna `list`.

O nome de tabela é dinâmico: o seletor `GetHeroXmlName()` usa `ABtest_aps_new_heroes` para escolher `TableName.NewHeroes` ou `TableName.NewHeroesB` (seletor já validado em análise anterior).

A função externa calcula/captura:
- `curDay` (R7);
- `curWeek` (R8);
- `curWeekDay` (R9);
- `season` (R10);
- `seasonDay` (R11);
- `seasonStage` (R12);
- `seasonStageDay` (R15);
- `functionOn` (R16), resultado de `CheckSwitch("hero_start_time")`;
- `list` (R0), tabela de resultado.

As fontes incluem `LuaEntry.Player.openServerTime`, `UITimeManager` (GetTodayZeroServerTime, GetMondayTime, GetServerTime, GetWeekdayIndex), `SeasonUtil.GetSeason` e `DataCenter.SeasonDataManager` (GetSeasonDurationDay, GetSeasonStage, GetSeasonStageStartTime).

## 4. Closure callback (170) — upvalues comprovados

Os descritores de upvalue e os nomes de debug são idênticos em Lua 5.4 e 5.5:

| Upvalue | Nome | Origem no pai |
|---:|---|---|
| 0 | functionOn | R16 |
| 1 | _ENV | upvalue 0 |
| 2 | curDay | R7 |
| 3 | curWeek | R8 |
| 4 | curWeekDay | R9 |
| 5 | season | R10 |
| 6 | seasonDay | R11 |
| 7 | seasonStage | R12 |
| 8 | seasonStageDay | R15 |
| 9 | HeroUtils | upvalue 1 |
| 10 | list | R0 |

O último descritor é `instack=1, idx=0`: confirma que `list` captura a tabela R0 criada pela função externa. A closure insere a chave recebida do iterador nessa lista. Os campos do registro são lidos do segundo parâmetro.

## 5. Regras de seleção observadas na closure

A closure usa:
- `start_time_new` ou `start_time`, conforme `functionOn` (switch `hero_start_time`);
- `string.split` com delimitadores `|` e `;`, além de `toInt` e `tonumber`, para interpretar as regras temporais;
- `state` e `HeroStateType_NPC` / `HeroStateType_OLD`;
- `GetHeroMergeItem(heroKey)` e `DataCenter.ItemData.GetItemCount(item)`;
- `SeasonUtil.GetSeason()` e o campo `season` do registro;
- `abtest`, `string.IsNullOrEmpty` e `LuaEntry.Player.abTest`;
- `table.insert(list, heroKey)` nos caminhos de inclusão.

**Conclusão sustentada:** `GetHeroTemplateList` não devolve simplesmente todas as linhas da tabela. Ele percorre a tabela NewHeroes/NewHeroesB e monta uma lista de chaves de heróis, condicionada por regras de disponibilidade temporal, estado, item de fusão, temporada e A/B test.

**Limites ainda abertos:** a gramática completa dos campos temporais e os limites/condições exatos do gate de item de fusão exigem validação independente das instruções de comparação e dos contratos de `visitTable`/`GetHeroMergeItem`. Não inferir thresholds numéricos ainda.

## 6. Consumidores identificados

| Módulo | Função | Lua 5.4 PC | Lua 5.5 PC | Uso |
|---|---:|---:|---:|---|
| HeroDataManager | 30 | 58 | 62 | consulta/gestão de heróis e equipamentos |
| HeroWeaponManager | 29 | 5 | 5 | elegibilidade/visibilidade de armas |
| UIHeroListCtrl | 20 | 31 | 31 | lista de heróis da interface |

Todos chamam `HeroUtils.GetHeroTemplateList()` sem argumentos explícitos e recebem um resultado.

## 7. Separação do sistema de evolução

`GetHeroTemplateList` é uma função de `HeroUtils`, não um dos sete acessores de `HeroLevelUpTemplateManager`. Nenhum dos três callsites demonstra chamada a `GetExp`, `GetAtk`, `GetDef`, `GetArmyNum`, `GetBreakRequire`, `GetBreakRequireRank` ou `GetBreakRequireBase`.

A implementação do helper está agora **PASS — encontrada e pareada**. O registro de `HeroLevelUpTemplateManager` no global `DataCenter` continua **BLOCKED**: o root do manager cria `BaseClass("HeroLevelUpTemplateManager")`, mas o loader que publica a classe em `DataCenter` não está no conjunto exportado.

## 8. RAM e DataTables

Última medição durante esta análise: **718,2 MB livres**, abaixo de 875 MB.
- **BLOCKED** — não iniciar AssetRipper nem carregar bundles de DataTable.
- **NOT RUN** — extração `heroes_levelup` base e Lua 5.5.
- **NOT RUN** — extração física de `aps_new_heroes` / variantes B.

Nenhum bundle foi carregado/exportado nesta rodada. Nenhum original foi modificado; sem merge, deploy ou publicação.


## 9. Evidência adicional do bootstrap/BaseClass

- A busca exata por BaseClass no inventário de constantes encontrou 30 nomes distintos de classes/manager em 30 pares módulo-versão. O padrão é compatível com uma factory global comum, mas não contém a implementação da factory.
- A busca no manifesto Lua exportado não encontrou asset BaseClass.bytes, LuaEntry.bytes ou um módulo central DataCenter.bytes; os caminhos encontrados para HeroUtils são os dois assets pareados já analisados.
- A busca no manifesto completo de bundles não encontrou candidatos nomeados lua_scripts_common, lua_scripts_base, lua_scripts_core, lua_scripts_entry ou lua_scripts_framework. Os bundles Lua listados estão agrupados principalmente em DataCenter, Scene e UI.
- O root de HeroLevelUpTemplateManager chama BaseClass com o nome HeroLevelUpTemplateManager, mas não atribui a classe diretamente a DataCenter. A publicação deve ocorrer em loader/factory externo ao conjunto Lua exportado ou em camada de runtime; isso continua como hipótese, não prova.

Estado do bootstrap: classe criada por BaseClass — PASS; mecanismo que publica a classe em DataCenter — BLOCKED; execução dinâmica — NOT RUN.

- Refinamento do manifesto: não há arquivo exato DataCenter.bytes, BaseClass.bytes ou LuaEntry.bytes no export manifest principal. Os dois resultados parecidos são SlgDataCenter.bytes (um Lua 5.4 e um Lua 5.5) sob Assets/SlgEngine/Main/LuaTxt*/DataCenter; não são o bootstrap do DataCenter principal.


## 10. Busca por bootstrap nativo / loader fora dos bundles Lua

- Busca read-only no DarkWar_Analysis_Core e na pasta DarkWar_Audit_APKs não encontrou cópias locais de global-metadata.dat, libil2cpp.so, libil2cpp.dll, GameAssembly.dll, Assembly-CSharp.dll ou Assembly-CSharp-firstpass.dll.
- Não há APK local na pasta Downloads. O único arquivo localizado é OneDrive\DarkWar_Original_APK_Archive\split_install_time_pack.apk, 2,082,044,905 bytes, presente como placeholder cloud-only.
- O arquivo não foi reidratado nem copiado; não houve download de 2,08 GB nem extração adicional.
- Consequência: a busca estática nos bundles Lua exportados continua sem localizar a implementação da factory BaseClass ou o registro do manager em DataCenter. A próxima fonte provável é o bootstrap no IL2CPP/native metadata ou um bundle ainda não exportado; acesso a esses bytes permanece BLOCKED.

**Estado:** BaseClass usada por 30 classes — PASS; definição/loader no conjunto Lua exportado — BLOCKED; inspeção IL2CPP/APK — BLOCKED; execução dinâmica — NOT RUN.
