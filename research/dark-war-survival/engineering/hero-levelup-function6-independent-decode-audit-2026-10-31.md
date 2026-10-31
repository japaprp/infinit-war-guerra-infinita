# HeroLevelUpTemplateManager — auditoria do decode da função 6 (2026-10-31)

## Objetivo

Validar independentemente o argumento enviado pela função 6 ao acessor público `GetBreakRequireBase`, comparando Lua 5.4 e Lua 5.5. Esta etapa é uma auditoria do decode; não altera código de jogo nem executa o cliente original.

## Resultado

**BLOCKED — argumento ainda não validado em nenhuma das duas versões.**

A leitura dos inventários de bytecode confirmou que a função 6 tem 17 instruções nas duas variantes e os hashes abaixo. Porém, o crosswalk Lua 5.5 → Lua 5.4 disponível não resolve todos os opcodes presentes no corpo da função. Dois IDs não têm entrada (`73` no PC 6 e `22` no PC 13); o ID `86` no PC 8 tem confiança apenas `MEDIUM`. Logo, a interpretação anterior de que Lua 5.5 passa literalmente `1` não está confirmada por decode independente.

A indicação anterior de R5 para Lua 5.4 também permanece **candidata derivada do parser**, não confirmada por uma decodificação independente do fluxo de registradores.

## Evidência observada

| Campo | Lua 5.4 | Lua 5.5 |
|---|---|---|
| Módulo | HeroLevelUpTemplateManager | HeroLevelUpTemplateManager |
| Função | 6 | 6 |
| Linhas-fonte | 30–39 | 30–39 |
| Instruções | 17 | 17 |
| Parâmetros | 1 (self) | 1 (self) |
| Max stack | 9 | 8 |
| SHA-256 do chunk | `9b1ff70670b820bb4fc3f59cd10adbb8a397ee3e8efab3f1811fc35be9652b42` | `1e9e37ca404e97d3e387855f1b40eca102eb2ad5d6412b939d46be496f78a72c` |

Constantes observadas no protótipo: `DataCenter`, `BuildManager`, `MainLv`, `HeroMaxLevel` e `GetBreakRequireBase`.

### Lua 5.5 — opcodes sem cobertura suficiente

| PC | ID bruto (7 bits) | Palavra bruta | Situação no crosswalk |
|---:|---:|---|---|
| 6 | 73 | `00030149` | Sem entrada |
| 8 | 86 | `000403d6` | MOVE candidato, confiança MEDIUM |
| 13 | 22 | `00038116` | Sem entrada |

O crosswalk empírico não deve ser tratado como uma tabela universal de opcodes: a confiança é específica para os pares e ocorrências efetivamente validados.

## Auditoria dos scripts de decode existentes

Os scripts independentes `decode-lua54-control-flow-independent.js` e `decode-lua55-control-flow-independent.js` foram inspecionados. Ambos estão especializados na função PveUtil da linha 3163 e nas verificações de TEST/JMP daquele seletor. Não são decodificadores genéricos e não podem ser reutilizados diretamente na função 6 de HeroLevelUpTemplateManager.

## Decisão técnica

1. Não atribuir significado de negócio a R5 nem aceitar `1` como argumento Lua 5.5.
2. Não inferir a semântica dos IDs ausentes pela proximidade dos registradores ou por nomes de opcodes stock.
3. Construir um decode específico para a função 6, usando formato de instrução e semântica da VM realmente presentes no binário.
4. Validar o fluxo de cada versão separadamente; só declarar equivalência quando os registradores de origem e destino estiverem demonstrados.
5. Depois, procurar consumidores externos de `GetBreakRequireBase` e cruzar os parâmetros com os DataTables físicos.

## Validação

- **PASS** — computador remoto online; leitura dos CSVs de inventário e scripts existentes concluída.
- **PASS** — função 6 localizada nas duas versões; 17 palavras de instrução e hashes identificados.
- **PASS** — lacunas de cobertura do crosswalk identificadas para os PCs 6, 8 e 13 da versão 5.5.
- **FAIL** — o crosswalk atual não permite decodificar integralmente a função 6 de Lua 5.5.
- **BLOCKED** — argumento efetivo de `GetBreakRequireBase` ainda não validado em Lua 5.4/5.5.
- **NOT RUN** — exportação de DataTables; permanece condicionada à margem de RAM mínima de 875 MB.
- **NOT RUN** — execução do cliente original e leitura do valor remoto de switches.

## Segurança e escopo

A rodada foi somente de leitura. Nenhum bundle foi carregado/exportado, nenhum original foi alterado, e não houve merge, deploy ou publicação.
