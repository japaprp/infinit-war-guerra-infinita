# HeroLevelUpTemplateManager — função 6, loop e argumento corrigidos (2026-10-31)

## Identificação da função

A função 6, linhas 30–39, é o método `GetNeedMainLv` do `HeroLevelUpTemplateManager`. O root da classe associa esse método à closure correspondente; a função consulta `DataCenter.BuildManager.MainLv`, percorre os níveis de herói de 1 a `HeroMaxLevel` e chama `GetBreakRequireBase(i)` para o índice corrente.

Hashes dos chunks:
- Lua 5.4: `9b1ff70670b820bb4fc3f59cd10adbb8a397ee3e8efab3f1811fc35be9652b42`
- Lua 5.5: `1e9e37ca404e97d3e387855f1b40eca102eb2ad5d6412b939d46be496f78a72c`

## OpCodes Lua 5.5 no alvo

| Opcode Lua 5.5 | PC | Identificação no alvo | Par Lua 5.4 |
|---:|---:|---|---:|
| 73 | 6 | FORPREP | 74 |
| 22 | 13 | FORLOOP | 73 |
| 86 | 8 | MOVE | 0 |

IDs 73 e 22 são identificados contextualmente pela função pareada: 63/68 e 61/68 correspondências por mesmo PC, respectivamente. Para ID 86, 28/28 instruções alinhadas em 27 funções e 7 módulos correspondem a MOVE; o crosswalk genérico conserva confiança MEDIUM, mas o uso no alvo é confirmado pelo rastro de registradores e pelo valor da variável de controle.

## Semântica do loop — diferença real entre Lua 5.4 e 5.5

O detalhe que resolveu a divergência é uma alteração na disposição dos registradores de loops numéricos entre as versões upstream:
- Lua 5.4: após FORPREP, a variável de controle fica em `A+3` (fonte oficial `lvm.c`, linhas 200–208). Com A=2, R5.
- Lua 5.5: após FORPREP, a variável de controle fica em `A+2` (fonte oficial `lvm.c`, linhas 203–214). Com A=2, R4.

Referências oficiais:
- Lua 5.4.9: https://lua.org/source/5.4/lvm.c.html
- Lua 5.5.1: https://lua.org/source/5.5/lvm.c.html

Isso explica por que o registrador fonte da instrução MOVE muda de R5 para R4. Não é argumento literal nem erro de equivalência: é a posição da variável de controle na VM correspondente.

## Rastro independente de registradores

### Lua 5.4 — PASS

- PC0–2: obtém `DataCenter.BuildManager.MainLv` em R1.
- PC3: inicializa R2 com 1.
- PC4: carrega `HeroMaxLevel` em R3.
- PC5: inicializa R4 com passo 1.
- PC6 FORPREP A=2; variável de controle após preparação: R5 (=A+3).
- PC7 SELF: `GetBreakRequireBase`, receptor R0, método R6, self R7.
- PC8 MOVE: R8 recebe R5.
- PC9 CALL A=6, B=3, C=2: chama com self R7 e argumento explícito R8.
- PC10 compara MainLv (R1) com o valor retornado em R6.

Resultado: `GetBreakRequireBase(i)`, com `i` em R5.

### Lua 5.5 — PASS

- PC0–2: obtém `DataCenter.BuildManager.MainLv` em R1.
- PC3: inicializa R2 com 1.
- PC4: carrega `HeroMaxLevel` em R3.
- PC5: inicializa R4 com passo 1.
- PC6 opcode 73 FORPREP A=2; variável de controle após preparação: R4 (=A+2).
- PC7 SELF: `GetBreakRequireBase`, receptor R0, método R5, self R6.
- PC8 opcode 86 MOVE: R7 recebe R4.
- PC9 opcode 5 CALL A=5, B=3, C=2: chama com self R6 e argumento explícito R7.
- PC10 compara MainLv (R1) com o valor retornado em R5.

Resultado: `GetBreakRequireBase(i)`, com `i` em R4.

## Conclusão funcional

O argumento explícito de `GetBreakRequireBase` é o índice corrente do loop numérico, iniciado em 1 e limitado por `HeroMaxLevel`. O valor literal 1 é o limite inicial do loop, não o argumento passado a cada chamada.

A função 13 `GetBreakRequireBase` consulta a coluna `break_require_base` usando esse índice como chave. Assim, `GetNeedMainLv` percorre os requisitos de base por nível de herói e os compara com `DataCenter.BuildManager.MainLv`.

## Validação do opcode 86 / operando B

- 28/28 ocorrências do opcode 86 no inventário pareado correspondem a MOVE da Lua 5.4.
- O campo B está dentro de `maxStackSize` em 28/28 casos; zero fora do intervalo.
- Em 18/28 pares, B conserva o mesmo número de registrador; em 10/28, o número muda devido à alocação diferente de registradores entre compilações.
- No alvo, B=4 coincide exatamente com A+2 da FORPREP Lua 5.5. O par Lua 5.4 usa B=5, coincidente com A+3.
- O mapeamento genérico do crosswalk continua MEDIUM; a semântica do MOVE no alvo fica PASS pela convergência entre par alinhado, limite de registradores e layout oficial do loop 5.5.

## Correção de evidência anterior

O arquivo anterior `DARKWAR_HEROLEVELUP_GETTER_CALLERS_2026-10-31.csv` indicava incorretamente `R7=1` na Lua 5.5. O valor 1 é a inicialização do loop. A linha corrigida registra `R7=R4`, e R4 é a variável de controle conforme a semântica Lua 5.5. Não usar a antiga linha como evidência.

## Validações

| Verificação | Estado | Evidência |
|---|---|---|
| Opcode 73 no alvo = FORPREP | PASS | PC6 pareado com Lua 5.4 ID74 |
| Opcode 22 no alvo = FORLOOP | PASS | PC13 pareado com Lua 5.4 ID73 |
| Opcode 86 no alvo = MOVE | PASS | 28/28 pares e cadeia MOVE→CALL |
| Operando B válido | PASS | 28/28 dentro de maxStackSize |
| Loop Lua 5.4 usa R5 | PASS | semântica oficial A+3 |
| Loop Lua 5.5 usa R4 | PASS | semântica oficial A+2 |
| Argumento GetBreakRequireBase em ambas versões | PASS | MOVE→CALL com índice do loop |
| Extração DataTables | NOT RUN | RAM abaixo de 875 MB |

Nenhum bundle foi carregado/exportado nesta etapa. Nenhum original foi modificado; sem merge, deploy ou publicação.

[executed on device: WIN-RPC1DR79TVC (a1fb0fea-9200-442c-8e10-e849494b85b1)]