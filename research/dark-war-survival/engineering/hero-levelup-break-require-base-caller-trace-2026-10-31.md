# HeroLevelUpTemplateManager — rastreamento de GetBreakRequireBase (corrigido em 2026-10-31)

**Resultado:** PASS — assinatura, coluna consultada, callsite e argumento de negócio resolvidos estaticamente nas duas versões.

## 1. Acessor

A função 13, linhas 71–73, tem dois parâmetros incluindo self (um argumento explícito) e consulta:

`GetTableData(self:GetTableName(), i, "break_require_base")`

## 2. Chamador: GetNeedMainLv

A função 6, linhas 30–39, é `GetNeedMainLv`. Ela obtém `DataCenter.BuildManager.MainLv`, percorre `i=1..HeroMaxLevel` com passo 1, chama `GetBreakRequireBase(i)` e compara o requisito retornado com o MainLv atual.

| Versão | Registrador da variável de controle | MOVE | CALL | Argumento explícito |
|---|---|---|---|---|
| Lua 5.4 | R5 (A+3, A=2) | R8 ← R5 | PC9 A=6 B=3 C=2 | R5 |
| Lua 5.5 | R4 (A+2, A=2) | R7 ← R4 | PC9 A=5 B=3 C=2 | R4 |

A diferença é consequência da mudança oficial no layout de registradores de loops numéricos entre Lua 5.4 e Lua 5.5. Referências upstream:
- Lua 5.4.9: https://lua.org/source/5.4/lvm.c.html
- Lua 5.5.1: https://lua.org/source/5.5/lvm.c.html

**Correção da análise anterior:** o valor literal 1 extraído anteriormente não era o argumento da chamada; era o inicializador do loop. A planilha de callsites foi corrigida para R7=R4 na Lua 5.5. Não usar a interpretação anterior.

## 3. Validações

- PASS — função 13, assinatura e coluna `break_require_base`.
- PASS — opcode 73=FORPREP, opcode 22=FORLOOP e opcode 86=MOVE no alvo Lua 5.5.
- PASS — operando B do MOVE: válido em 28/28 pares; no alvo aponta para A+2 da VM Lua 5.5.
- PASS — argumento Lua 5.4 = R5, variável de controle A+3.
- PASS — argumento Lua 5.5 = R4, variável de controle A+2.
- PASS — loop de 1 até HeroMaxLevel, passo 1.
- NOT RUN — execução dinâmica do cliente e confirmação runtime.
- BLOCKED — extração física de heroes_levelup, enquanto RAM livre <875 MB.

Relatório detalhado: `hero-levelup-function6-targeted-decode-2026-10-31.md`.
Evidência reproduzível: `hero-levelup-function6-targeted-decode-2026-10-31.json`.

Nenhum bundle foi carregado/exportado nesta rodada; sem alteração de originais, merge ou deploy.
