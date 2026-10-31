# HeroLevelUpTemplateManager — decode dirigido e referências indiretas (2026-10-31)

## OpCodes Lua 5.5 — evidência empírica

Os IDs 73 e 22 não têm entradas no crosswalk CSV original. Comparei as instruções por PC em funções pareadas Lua 5.5/5.4 do mesmo módulo e linha-fonte.

| ID Lua 5.5 | Função 6 / PC | Par Lua 5.4 | Identificação no alvo | Evidência mais ampla |
|---:|---:|---:|---|---|
| 73 | PC 6 | ID 74 | FORPREP | 63/68 ocorrências alinhadas mapeiam para Lua 5.4 ID 74; demais: ID 12 (3), ID 14 (2) |
| 22 | PC 13 | ID 73 | FORLOOP | 61/68 ocorrências alinhadas mapeiam para Lua 5.4 ID 73; demais: IDs 66 (2), 0 (1), 11 (2), 56 (2) |
| 86 | PC 8 | ID 0 | MOVE (candidato empírico) | 28/28 ocorrências alinhadas em 27 funções e 7 módulos mapeiam para Lua 5.4 ID 0 |

**Limitação:** a comparação global por mesmo PC apresenta divergências para IDs 73 e 22. No alvo específico, PC6 e PC13 coincidem exatamente com FORPREP/FORLOOP da versão 5.4. Não generalizar os mapeamentos para qualquer módulo sem alinhamento de função mais rigoroso.

Para ID 86, a identificação como MOVE tem 28/28 pares alinhados, mas confiança MEDIUM. Existem 28 verificações do campo A sem divergência; o campo B não foi validado separadamente. A identidade do opcode é sustentada, mas a semântica do operando fonte ainda exige confirmação independente.

## Rastro de GetBreakRequireBase

Chunks da função 6, linhas 30–39, 17 instruções em cada versão:
- Lua 5.4 SHA-256: `9b1ff70670b820bb4fc3f59cd10adbb8a397ee3e8efab3f1811fc35be9652b42`
- Lua 5.5 SHA-256: `1e9e37ca404e97d3e387855f1b40eca102eb2ad5d6412b939d46be496f78a72c`

### Lua 5.4 — PASS
- PC7 SELF: método `GetBreakRequireBase`, receptor R0, função em R6 e self em R7.
- PC8 MOVE: R8 recebe R5.
- PC9 CALL: A=6, B=3, C=2; argumento explícito é R8, portanto sua origem é R5.
- PC6 FORPREP e PC13 FORLOOP usam A=2; R5 é o registrador candidato da variável visível do loop no layout Lua 5.4.

Conclusão: **argumento explícito proveniente de R5, confirmado estaticamente**.

### Lua 5.5 — cadeia parcial, equivalência ainda BLOCKED
- PC6 ID73 identificado no alvo como FORPREP, A=2.
- PC7 SELF: A=5, receptor R0, self em R6.
- PC8 ID86 candidato MOVE: A=7, B=4.
- PC9 ID5 CALL: A=5, B=3, C=2; argumento explícito ocupa R7.
- PC13 ID22 identificado no alvo como FORLOOP, A=2.

Sob a interpretação empírica ID86=MOVE, o argumento enviado à chamada em R7 vem de R4. Contudo, o campo B do opcode 86 não foi validado separadamente e a posição da variável visível do loop na VM 5.5 ainda não foi demonstrada. A versão 5.5 não deve ser descrita como equivalente à 5.4, nem R4 deve ser chamado de variável do loop sem essa prova.

Conclusão: **PASS para a estrutura SELF/MOVE/CALL e identificação contextual de FORPREP/FORLOOP; BLOCKED para semântica independente do operando fonte e equivalência de registradores entre versões**. O resultado anterior que apontava literal `1` não se sustenta e está substituído por este rastro mais preciso.

## Busca de referências externas e indiretas

Busca no inventário de constantes Lua 5.4/5.5, excluindo o módulo que declara os acessores:

| Termo exato / chave | Hits externos |
|---|---:|
| GetExp | 0 |
| GetAtk | 0 |
| GetDef | 0 |
| GetArmyNum | 0 |
| GetBreakRequire | 0 |
| GetBreakRequireRank | 0 |
| GetBreakRequireBase | 0 |
| HeroLevelUp / HeroLevelUpTemplateManager | 0 |
| lv_attr_atk / lv_attr_def | 0 |
| break_require_base / break_require_rank | 0 |
| army_num | 0 |

Busca parcial por `GetDef` encontrou seis strings em módulos Arena, mas nenhuma é igualdade exata com o símbolo `GetDef`; foram excluídas dos hits do acessor. O inventário não revela alias literal, nome de manager ou chave de DataTable relacionada fora do módulo.

**Conclusão limitada:** nenhum consumidor externo literal/alias textual foi identificado no inventário disponível. Ainda não é prova de código morto. Chamadas por referência de função, aliases atribuídos em runtime, reflexão, nomes construídos, módulos ausentes ou acesso via objeto genérico continuam possíveis. Próximo passo: rastrear módulos de bootstrap/registro de DataCenter e referências ao objeto que recebe o manager, em vez de procurar apenas o nome textual do método.

## RAM e DataTables

Última medição: **642 MB livres**, abaixo do mínimo de 875 MB.
- **BLOCKED** — não iniciar AssetRipper nem carregar bundle de DataTable.
- **NOT RUN** — extração `heroes_levelup` base.
- **NOT RUN** — extração `heroes_levelup` Lua 5.5.
- **NOT RUN** — hash/estrutura de TextAssets físicos e comparação de registros.

Quando a RAM alcançar 875 MB: extrair somente a versão base; verificar caminho, tamanho e SHA-256; depois extrair a versão 5.5 e comparar colunas, chaves, custos, requisitos e progressão.

## Validações

| Verificação | Estado |
|---|---|
| Decodificador dedicado executado | PASS |
| ID73 contextualizado no alvo como FORPREP | PASS |
| ID22 contextualizado no alvo como FORLOOP | PASS |
| ID86 identificado empiricamente como MOVE | PASS, confiança MEDIUM; campo B pendente |
| Lua 5.4 — argumento R5 | PASS |
| Lua 5.5 — origem R4 | BLOCKED para semântica independente/equivalência |
| Consumidores externos literais | PASS — nenhum identificado |
| Consumidores indiretos dinâmicos | BLOCKED — exige rastrear bootstrap/aliases |
| Extração DataTables | NOT RUN — RAM 642 MB < 875 MB |
| Cruzamento físico de registros | NOT RUN |

## Segurança

Análise estática e leitura de inventários; escrita apenas de artefatos de pesquisa. Nenhum bundle foi carregado/exportado, nenhum original foi modificado, e não houve merge, deploy ou publicação.
