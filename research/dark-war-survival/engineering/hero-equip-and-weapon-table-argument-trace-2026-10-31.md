# HeroEquipManager — argumentos e HeroWeaponManager — consumo indireto da tabela

**Resultado:** PASS — rastreamento estático das funções e callsites em Lua 5.4/5.5. A extração dos DataTables físicos permanece bloqueada por margem de RAM.

## 1. Fontes e validação

Inventários locais:
- `LUA_FUNCTION_FINGERPRINT_INVENTORY_WITH_CONSTANTS_2026-10-30-functions.csv`
- `LUA_FUNCTION_FINGERPRINT_INVENTORY_WITH_CONSTANTS_2026-10-30-constants.csv`
- `LUA_OPCODE_CROSSWALK_55_TO_54_FINGERPRINT_V1_2026-10-30.csv`

SHA-256:
- funções: `b06cd1e049068619132ba27b044f429ac2fb4d078bd9302b18f9b43a67456552`
- constantes: `b82332aa1399d1e8b29fe913ad07e1c5e2eaa121c805aff7a852eda36d45b079`
- crosswalk: `0d8715d6e62810db4c599ba6be2261f183adef14f9c1fc3c7bad6dde31360fc3`

Os nomes Lua 5.5 foram aceitos somente por mapeamentos HIGH do crosswalk com holdout sem erros/não vistos. A análise é estática.

## 2. HeroWeaponManager: consumo indireto confirmado

Função 6, linhas 37–58, em ambas as versões:
- consulta `LuaEntry.DataConfig.CheckSwitch("heroes_exclusive_equip")`;
- obtém `LocalController.instance.visitTable`;
- chama `HeroUtils.GetHeroXmlName()`;
- passa o retorno do seletor como argumento de tabela para `visitTable`, junto de uma closure;
- depois consulta `self.heroList` e retorna um booleano baseado no tamanho da lista.

A sequência decisiva é:
- PC 16: resolve `visitTable` a partir de `LocalController.instance`;
- PC 17–19: resolve e executa `HeroUtils.GetHeroXmlName()`;
- PC 20: cria a closure child prototype ordinal 0;
- PC 21: chama `visitTable(self, tableName, callback)` (CALL B=4: três argumentos explícitos incluindo o receptor do método).

A closure é função 7, linhas 42–53, em ambas as versões. Ela:
1. chama `HeroWeaponUtil.CheckShowServer(record)`;
2. se aprovado, chama `HeroWeaponUtil.CheckShowDays(record)`;
3. se aprovado, executa `table.insert(heroList, record)`, usando `heroList` capturado como upvalue.

Conclusão: HeroWeaponManager é um consumidor indireto real do nome de tabela retornado por `GetHeroXmlName`, através de `LocalController.instance.visitTable`. A ausência de `GetTableData` direto nesse método não significava ausência de consumo.

## 3. HeroEquipManager: argumentos rastreados

O root do módulo registra os protótipos:
- função 25 = `GetOtherEquipListBySlot`;
- função 34 = `HasBetterEquip`;
- função 35 = `HasEmptyEquipSlotInstall`.

### 3.1 GetOtherEquipListBySlot — função 25, linhas 252–268

Assinatura bytecode: 4 parâmetros incluindo `self` (R0); três argumentos explícitos.

- chama `GetTableData(GetHeroXmlName(), R3, "camp")`;
- compara o campo `slot` do registro iterado com R2;
- R1 é testado contra nil e participa de outro filtro/comparação, mas o campo/semântica exata não foi identificado com segurança.

Interpretação:
- R3 é a chave/ID de herói usado para recuperar `camp` — evidência estática forte, sem nome local de debug;
- R2 é o slot, pois é comparado com o campo `slot` dos equipamentos;
- R1 permanece **UNKNOWN** (filtro opcional ainda não decodificado).

A varredura de constantes identificou a definição/registro do método no root, mas nenhum callsite estático externo direto no inventário indexado. Não inferir que o método seja código morto.

### 3.2 HasBetterEquip — função 34, linhas 377–388

Assinatura: 3 parâmetros incluindo `self` (R0).

- chama `GetTableData(GetHeroXmlName(), R1, "camp")`;
- chama `GetUnEquipListBySlot` e `GetEquipByHeroIdAndSlot` com R1 e R2;
- a função 39 (`PosHasRedDot`, linhas 435–438) chama `self:HasBetterEquip(R1, R2)`;
- a função 36 (`GetSuggestUnEquipUuidListByHeroId`, linhas 403–412) percorre `HeroEquipConst.Position` e chama `HasBetterEquip` com o ID de herói recebido e a posição/slot iterada.

Conclusão: R1 = heroId; R2 = slot/posição. Confirmado pela cadeia de chamadas e pelas APIs `GetEquipByHeroIdAndSlot` / `GetUnEquipListBySlot`.

### 3.3 HasEmptyEquipSlotInstall — função 35, linhas 390–401

Assinatura: 3 parâmetros incluindo `self`. Repete a leitura `GetTableData(GetHeroXmlName(), R1, "camp")` e consulta `GetUnEquipListBySlot` / `GetEquipByHeroIdAndSlot` com R1 e R2.

Interpretação consistente com a função 34: R1 = heroId e R2 = slot. A semântica é sustentada pelo fluxo interno e pelos nomes dos métodos chamados; não foi localizado callsite externo direto no inventário para esta função específica.

## 4. Matriz de confiança

| Função | R1 | R2 | R3 |
|---|---|---|---|
| GetOtherEquipListBySlot | filtro opcional — UNKNOWN | slot — confirmado | heroId/chave de camp — forte |
| HasBetterEquip | heroId — confirmado | slot — confirmado | — |
| HasEmptyEquipSlotInstall | heroId — sustentado pelo fluxo | slot — sustentado pelo fluxo | — |

## 5. Limites e próxima etapa

- Não há nomes locais de debug para os argumentos; os significados são inferidos por fluxo de registradores, chamadas e campos.
- O valor efetivo de `heroes_exclusive_equip` no servidor não foi observado.
- O conteúdo real de `heroes_exclusive_equip` e os registros de heróis/equipamentos ainda precisam ser comparados com DataTables físicos.
- RAM livre medida nesta rodada: 699,7 MB; limite definido para abrir novo bundle: 875 MB. Nenhum bundle foi carregado/exportado.
- Próxima sequência: resolver R1 de `GetOtherEquipListBySlot` por callers indiretos/dinâmicos; depois retomar a extração de `heroes_levelup` e demais tabelas quando houver margem de memória.

Nenhum arquivo original foi alterado; nenhuma mudança de gameplay, merge ou deploy foi feita.
