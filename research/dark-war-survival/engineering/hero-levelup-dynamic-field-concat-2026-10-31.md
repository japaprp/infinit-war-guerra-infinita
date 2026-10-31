# HeroLevelUpTemplateManager — decodificação das chaves dinâmicas

**Resultado:** PASS — ordem de concatenação decodificada em Lua 5.4 e Lua 5.5 para os três acessores de atributos/tropas.

## 1. Fontes e hashes

Inventários locais:
- `LUA_FUNCTION_FINGERPRINT_INVENTORY_WITH_CONSTANTS_2026-10-30-functions.csv`
- `LUA_FUNCTION_FINGERPRINT_INVENTORY_WITH_CONSTANTS_2026-10-30-constants.csv`
- `LUA_OPCODE_CROSSWALK_55_TO_54_FINGERPRINT_V1_2026-10-30.csv`

SHA-256:
- funções: `b06cd1e049068619132ba27b044f429ac2fb4d078bd9302b18f9b43a67456552`
- constantes: `b82332aa1399d1e8b29fe913ad07e1c5e2eaa121c805aff7a852eda36d45b079`
- crosswalk: `0d8715d6e62810db4c599ba6be2261f183adef14f9c1fc3c7bad6dde31360fc3`

## 2. Forma comum das funções 8, 9 e 10

Cada função tem três parâmetros incluindo `self`:
- R0 = self;
- R1 = primeiro argumento explícito;
- R2 = segundo argumento explícito;
- R3 = terceiro argumento explícito.

Fluxo de bytecode nas duas versões:
1. R3 recebe `GetTableData`.
2. R4 recebe o retorno de `self:GetTableName()`.
3. R5 recebe R1.
4. R6 recebe a constante de prefixo da coluna.
5. R7 recebe R2.
6. `CONCAT A6 B2` concatena o intervalo de dois registradores começando em R6: prefixo em R6 seguido do valor de R2 em R7; o resultado fica em R6.
7. `GetTableData` é chamado com tabela R4, chave R5 e campo dinâmico R6.
8. O valor retornado é encaminhado a `toInt` junto com R3.

Portanto, a forma comprovada é:

```
fieldName = prefix .. R2
value = GetTableData(self:GetTableName(), R1, fieldName)
return toInt(value, R3)
```

## 3. Prefixos comprovados

| Função | Linhas | Prefixo fixo | Campo consultado |
|---:|---:|---|---|
| 8 | 46–49 | `lv_attr_atk` | `lv_attr_atk` + R2 |
| 9 | 52–55 | `lv_attr_def` | `lv_attr_def` + R2 |
| 10 | 58–61 | `army_num` | `army_num` + R2 |

A mesma sequência de registradores e concatenação aparece em Lua 5.4 e 5.5.

## 4. O que ainda não está provado

- R1 é a chave passada a `GetTableData`, mas seu nome semântico não foi confirmado apenas pelo bytecode.
- R2 é definitivamente o sufixo concatenado ao nome da coluna; ainda não se deve chamá-lo de nível, estrela, breakthrough ou rank sem confrontar os chamadores e os registros da tabela.
- R3 é passado como segundo argumento a `toInt`; sua semântica permanece desconhecida.
- A existência e os valores reais das colunas resultantes precisam ser confirmados no DataTable físico `heroes_levelup.bytes` e em seus registros.

## 5. Próxima etapa

1. Rastrear os chamadores das funções 8–10 para nomear R1, R2 e R3 por origem.
2. Exportar `heroes_levelup.bytes` base e variante correspondente Lua 5.5 quando RAM livre atingir 875 MB.
3. Comparar as colunas reais com os prefixos e sufixos derivados do bytecode.
4. Só então registrar a fórmula de acesso em especificação implementável para Guerra Infinita.

RAM livre medida anteriormente nesta rodada: 699,7 MB; carregamento de novos bundles permanece bloqueado. Nenhum bundle foi carregado/exportado nesta análise.
