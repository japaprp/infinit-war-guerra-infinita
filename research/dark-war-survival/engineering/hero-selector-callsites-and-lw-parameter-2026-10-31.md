# HeroUtils — pontos de chamada e parâmetro do seletor LW

**Resultado:** PASS — auditoria estática dos callsites e decodificação do controle de fluxo de `GetLwHeroTableName` em Lua 5.4 e Lua 5.5.

## 1. Método e escopo

A varredura de callsites usa os inventários de funções/constantes de todos os módulos disponíveis. Um callsite só é contado quando:
1. a constante de texto correspondente é usada por `GETFIELD`;
2. a instrução imediatamente seguinte é `CALL` sobre o mesmo registrador.

Para Lua 5.5, os nomes semânticos são aceitos somente por entradas HIGH do crosswalk empírico, cuja validação holdout registrou zero IDs errados/não vistos. Isso é análise estática do conjunto indexado, não prova de ausência de chamadas dinâmicas ou reflexão.

## 2. GetHeroXmlName — 20 callsites

Foram encontrados 20 callsites: 10 em Lua 5.4 e 10 em Lua 5.5, com o mesmo padrão de módulos e linhas-fonte.

| Módulo | Funções/linhas | Chamadas por versão |
|---|---|---:|
| HeroDataManager | função 43 / linha 609; função 46 / linha 638 | 2 |
| HeroEquipManager | função 25 / linha 252; função 34 / linha 377; função 35 / linha 390 | 3 |
| HeroWeaponManager | função 6 / linha 37 | 1 |
| UIHeroListCtrl | função 15 / linha 282, duas posições de chamada | 2 |
| UIWorldCupActListPanelCtrl | função 4 / linha 12, duas posições de chamada | 2 |
| **Total por versão** | | **10** |

Todos os callsites encontrados chamam o seletor sem argumentos explícitos e recebem um valor. A equivalência de linhas e funções entre Lua 5.4/5.5 dá uma correspondência estrutural estável.

Interpretação permitida: o nome de tabela retornado por `GetHeroXmlName()` é compartilhado por sistemas de dados, equipamento, arma, lista de heróis e painel de evento. A varredura não prova, por si só, que cada callsite subsequentemente consulte a mesma tabela; isso exige trace local de cada função até `GetTableData` ou outro consumidor.

## 3. GetLwHeroTableName — regra completa do parâmetro

O seletor público está ligado ao child prototype ordinal 100 / função 107, linhas 1538–1544, em ambas as versões. Possui um parâmetro formal em R0. Não existe nome local de debug no chunk para identificar semanticamente esse parâmetro.

Constantes:
- switch: `ABtest_lw_hero`
- variante B: `TableName.LW_Hero_B`
- variante base: `TableName.LW_Hero`

Controle de fluxo validado:
- PC 4 chama `CheckSwitch("ABtest_lw_hero")`.
- PC 5 testa o resultado do switch.
- PC 6 faz JMP para PC 12 quando o switch é falso/nil.
- Se o switch é verdadeiro, PC 7 testa o parâmetro R0 com `k=1`.
- Se R0 é falso/nil, o TEST pula o JMP da PC 8 e retorna `LW_Hero_B` na PC 11.
- Se R0 é truthy, PC 8 salta para PC 12 e retorna `LW_Hero`.

Regra equivalente:
```
LW_Hero_B iff CheckSwitch("ABtest_lw_hero") is truthy AND R0 is false/nil
otherwise LW_Hero
```

Lua 5.4:
- TEST PC 5: opcode ID 66, A=1, k=0.
- JMP PC 6: opcode ID 56, sJ=+5, destino PC 12.
- TEST PC 7: opcode ID 66, A=0, k=1.
- JMP PC 8: opcode ID 56, sJ=+3, destino PC 12.

Lua 5.5:
- TEST PC 5: opcode ID 80, A=1, k=0.
- JMP PC 6: opcode ID 43, sJ=+5, destino PC 12.
- TEST PC 7: opcode ID 80, A=0, k=1.
- JMP PC 8: opcode ID 43, sJ=+3, destino PC 12.

Os IDs semânticos Lua 5.5 são resolvidos pelo crosswalk HIGH validado. Os dois fluxos retornam a mesma regra.

## 4. Ausência de callsites estáticos identificados

A busca exata no inventário disponível encontrou:
- `GetLwHeroTableName`: 0 referências constantes e 0 callsites;
- `GetHeroLevelUpXmlName`: 0 referências constantes e 0 callsites.

Isso não prova que os helpers sejam código morto. Chamadas dinâmicas, reflexão, nomes montados em runtime, módulos não indexados ou outros caminhos indiretos permanecem possíveis.

O parâmetro R0 de `GetLwHeroTableName` e seus valores reais nos chamadores continuam sem interpretação. Não atribuir a ele um significado de classe, tipo ou categoria de herói até localizar um chamador e rastrear o argumento.

## 5. Limites e próximos passos

1. Localizar o chamador indireto de `GetLwHeroTableName` ou provar se o helper é invocado via registro/reflexão.
2. Rastrear os 10 callsites por versão de `GetHeroXmlName` até os pontos efetivos de leitura.
3. Correlacionar o parâmetro R0 com o esquema físico de `lw_hero.bytes` e `lw_hero_B.bytes`, quando os TextAssets forem exportados.
4. Exportar os DataTables somente quando a RAM livre atingir pelo menos 875 MB. A medição atual desta rodada foi 420,2 MB; portanto, nenhuma carga/exportação nova foi iniciada.

Nenhum arquivo original foi alterado; nenhum merge, deploy ou mudança de gameplay foi realizado.
