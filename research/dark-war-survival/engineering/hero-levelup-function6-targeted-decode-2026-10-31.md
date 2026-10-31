# HeroLevelUpTemplateManager — decode direcionado da função 6 e busca de consumidores (2026-10-31)

## Escopo

Construir um decodificador específico para a função 6, sem reutilizar os decodificadores PveUtil; validar a chamada de `GetBreakRequireBase` separadamente em Lua 5.4/5.5; buscar referências literais externas dos sete acessores de evolução de heróis; e verificar se há margem de RAM para extração de DataTables.

## 1. Decodificador específico

Criado `tools/experiments/decode-herolevelup-function6.js`. O script trabalha somente com as 17 palavras de instrução da função 6 em cada versão e com o crosswalk empírico já existente. Não importa nem chama os scripts de PveUtil.

Saída local: `validation-reports/HEROLEVELUP_FUNCTION6_TARGETED_DECODE_2026-10-31.json`.

### Lua 5.4 — argumento validado estaticamente

Função 6, linhas 30–39, SHA-256 do chunk:
`9b1ff70670b820bb4fc3f59cd10adbb8a397ee3e8efab3f1811fc35be9652b42`.

Fluxo:
- PC 6: `FORPREP A=2`.
- PC 13: `FORLOOP A=2`; o valor visível do loop fica em R5 (A+3).
- PC 7: `SELF A=6, B=0, C=4, k=1`; resolve o método `GetBreakRequireBase` no receptor R0 e coloca o self em R7.
- PC 8: `MOVE A=8, B=5`; copia R5 para R8.
- PC 9: `CALL A=6, B=3, C=2`; chama a função em R6 com self em R7 e argumento explícito em R8.

**Conclusão Lua 5.4: PASS — o argumento explícito de `GetBreakRequireBase` é o valor corrente do loop numérico, originalmente em R5.** O significado de negócio do índice e os limites exatos do loop não são atribuídos nesta etapa.

### Lua 5.5 — ainda bloqueado

Função 6, linhas 30–39, SHA-256 do chunk:
`1e9e37ca404e97d3e387855f1b40eca102eb2ad5d6412b939d46be496f78a72c`.

O crosswalk valida com confiança HIGH os opcodes usados em PCs 0–5, 7, 9–12 e 14–16. Permanecem:
- PC 6, opcode ID 73: sem mapeamento;
- PC 13, opcode ID 22: sem mapeamento;
- PC 8, opcode ID 86: candidato MOVE com confiança MEDIUM.

A sequência de chamada está estruturalmente alinhada com a versão 5.4, mas não é suficiente para validar o fluxo do loop e a origem do registrador copiado pelo MOVE. Não aceitar R4, R5 nem o literal 1 como argumento confirmado.

**Conclusão Lua 5.5: BLOCKED — argumento ainda não validado.** Próximo passo é validar os IDs 73 e 22 e o formato/semântica do ID 86 usando pares de instruções adicionais e invariantes de registradores, sem promover inferência estrutural a fato.

## 2. Consumidores externos dos acessores

Busca literal no inventário completo de constantes extraídas dos módulos Lua 5.4/5.5, excluindo o próprio `HeroLevelUpTemplateManager`, para:
- `GetExp`
- `GetAtk`
- `GetDef`
- `GetArmyNum`
- `GetBreakRequire`
- `GetBreakRequireRank`
- `GetBreakRequireBase`

Resultado: **zero referências literais externas** para cada um dos sete símbolos no inventário analisado. Também não foram encontradas referências literais externas a `HeroLevelUpTemplateManager` ou `HeroLevelUp` no inventário de constantes.

Isso não prova ausência de consumidores: chamadas por alias, acesso dinâmico, nomes construídos em runtime, reflexão ou módulos não indexados podem escapar da busca literal. Resultado correto: **nenhum consumidor externo estático/literal identificado neste inventário**.

Evidência local: `validation-reports/HEROLEVELUP_ACCESSOR_EXTERNAL_LITERAL_SCAN_2026-10-31.json`.

## 3. DataTables e memória

Medição de RAM livre: **707,1 MB**. Limite de segurança estabelecido: **875 MB livres**.

- **BLOCKED** — não iniciar AssetRipper nem carregar/exportar bundles de DataTable nesta rodada.
- **NOT RUN** — extração de `heroes_levelup` Lua base.
- **NOT RUN** — extração de `heroes_levelup` Lua 5.5.
- Os arquivos Lua de código já exportados foram localizados (2.214 bytes base e 1.958 bytes 5.5); eles não são os DataTables físicos.

Quando a RAM alcançar 875 MB livres, extrair um bundle por vez, primeiro `heroes_levelup` base, validar caminho/tamanho/hash do TextAsset físico, e só depois a versão 5.5.

## 4. Validações

| Verificação | Estado | Evidência |
|---|---|---|
| Decodificador dedicado criado e executado | PASS | Script e JSON local |
| Lua 5.4 — registradores e argumento | PASS | SELF → MOVE → CALL e loop FORPREP/FORLOOP |
| Lua 5.5 — argumento | BLOCKED | IDs 73/22 sem mapa; ID 86 MEDIUM |
| Busca literal dos sete acessores externos | PASS | 0 hits em módulos externos no inventário |
| Busca literal do nome do manager externo | PASS | 0 hits no inventário |
| Extração DataTable base/5.5 | NOT RUN | RAM abaixo do limite |
| Cruzamento com registros físicos | NOT RUN | depende da extração |

## Segurança

Somente leitura de inventários e escrita de novos artefatos de pesquisa. Nenhum bundle foi carregado/exportado nesta rodada; nenhum original foi alterado; sem merge, deploy ou publicação.
