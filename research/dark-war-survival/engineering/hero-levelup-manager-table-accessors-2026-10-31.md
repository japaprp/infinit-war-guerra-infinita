# HeroLevelUpTemplateManager — contrato de leitura da tabela de evolução

**Status:** PASS — sete acessores de leitura identificados em Lua 5.4 e Lua 5.5.

## Ligação ao seletor

A função `GetTableName()` do `HeroLevelUpTemplateManager` seleciona e armazena em cache o nome da tabela:
- switch `ABtest_heroes_levelup` verdadeiro → `TableName.NewHeroesLevelUp_B`;
- switch falso/nil → `TableName.NewHeroesLevelUp`.

O valor efetivo do switch no servidor não foi observado. A função de seleção foi analisada estaticamente nas duas versões.

## Acessores que consomem a tabela

O inventário de chamadas `GetTableData` contém as funções 7 a 13 do `HeroLevelUpTemplateManager` nas duas versões:

| Função | Linha | Campo/coluna lido | Observação |
|---:|---:|---|---|
| 7 | 41 | `exp` | Chamada direta; chave R1 |
| 8 | 46 | `lv_attr_atk` | Chave de campo construída por concatenação |
| 9 | 52 | `lv_attr_def` | Chave de campo construída por concatenação |
| 10 | 58 | `army_num` | Chave de campo construída por concatenação |
| 11 | 63 | `break_require` | Chamada direta; chave R1 |
| 12 | 67 | `break_require_rank` | Chamada direta; chave R1 |
| 13 | 71 | `break_require_base` | Chamada direta; chave R1 |

Em todos os sete acessores, o primeiro argumento de `GetTableData` é o resultado de `self:GetTableName()`. A chamada fornece três argumentos explícitos: nome de tabela, chave e nome da coluna/campo (ou expressão concatenada que forma o campo).

O padrão de campos foi encontrado nas duas versões Lua. As linhas e índices de função coincidem; a diferença de opcode/registradores entre versões não muda o contrato de alto nível.

## O que isso nos permite afirmar

1. A tabela de evolução selecionada por `ABtest_heroes_levelup` não é somente um nome alternativo: ela alimenta sete caminhos de leitura no manager.
2. O manager lê experiência, atributos de ataque e defesa, quantidade de tropas e três grupos de requisitos de breakthrough.
3. As três colunas `lv_attr_atk`, `lv_attr_def` e `army_num` usam chave de campo calculada por concatenação. Não fixamos ainda o formato exato da chave porque é necessário inspecionar os operandos/valores de concatenação na função original.
4. A tabela física `heroes_levelup.bytes` está mapeada nos bundles base e Lua 5.5, mas seus registros ainda não foram exportados e comparados. Também não há arquivo físico separado `heroes_levelup_B.bytes` no mapa consultado; a associação entre o nome lógico `NewHeroesLevelUp_B` e o asset físico precisa ser confirmada dentro do bundle.

## Evidência

- Fonte local: `validation-reports/DARKWAR_GETTABLEDATA_CALL_ARGUMENTS_2026-10-30.csv`, linhas correspondentes às funções 7–13 de ambas as versões.
- [Evidência estruturada](./evidence/hero-levelup-manager-table-accessors-2026-10-31.json).

## Próxima etapa

Com a margem de RAM acima de 875 MB, exportar primeiro o bundle `datatable_config_luatxt_h_6a1d2a950c996f15a938acebcebc598b.bundle` e o par Lua 5.5 `datatable_config_luatxt_55_h_3241e39d538fe22e815569b43561d206.bundle`. Confirmar os nomes internos, o esquema das colunas e os registros; só então resolver as chaves concatenadas e a variante B.

## Refinamento do bytecode das colunas calculadas

No inventário bruto Lua 5.5, as funções 8, 9 e 10 têm três parâmetros formais (incluindo `self`). A sequência de instruções inclui uma cópia do registrador `R2` para um temporário imediatamente antes da operação `CONCAT`. Em paralelo, a análise de argumentos identifica `R1` como a chave enviada a `GetTableData`.

Assim, o contrato observado é:
- `R1` → chave/linha consultada;
- constante `lv_attr_atk`, `lv_attr_def` ou `army_num` + valor derivado de `R2` → nome de campo calculado.

Isso sugere que o segundo parâmetro explícito escolhe uma variante de coluna, mas seu significado (por exemplo, nível, estágio ou outra dimensão) e a ordem exata da concatenação ainda não estão comprovados. Não codificar essa interpretação até decodificar os operandos e comparar com o esquema real da tabela.

## Atualização: ordem da concatenação dinâmica decodificada

Nas funções 8–10, em Lua 5.4 e 5.5, a concatenação é **prefixo fixo seguido do segundo argumento explícito R2**. O primeiro argumento R1 é a chave de `GetTableData`; o terceiro argumento R3 é passado a `toInt` como segundo parâmetro. Assim:
- função 8: `lv_attr_atk .. R2`;
- função 9: `lv_attr_def .. R2`;
- função 10: `army_num .. R2`.

A semântica de negócio de R2 e R3 ainda depende de rastrear os chamadores e validar o esquema físico de `heroes_levelup.bytes`. Ver [decodificação das chaves dinâmicas](./hero-levelup-dynamic-field-concat-2026-10-31.md).
