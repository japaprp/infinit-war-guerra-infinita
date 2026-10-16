# Pesquisa comparativa: chips, equipamento e baús

Projeto: Guerra Infinita (original). Data: 2026-10-15. Esta nota separa evidência visual, regras do protótipo e relatos de fontes comunitárias.

## Capturas catalogadas

O catálogo visual em `index.md` registra:
- `IMG-20261015-WA0155.jpg` e `IMG-20261015-WA0180.jpg`: quatro posições de chips em torno de um núcleo de ressonância e quatro abas/conjuntos I–IV.
- `IMG-20261015-WA0172.jpg`–`WA0175.jpg`: Módulo de Assalto +71% para +80,6%, requisito 1/5; Barreira Gravitacional +45,2% para +54,8%, requisito 0/3.
- `IMG-20261015-WA0176.jpg`–`WA0178.jpg`: inventário e fabricação de chips; uma receita exibe 233/800 materiais.
- `IMG-20261015-WA0185.jpg`–`WA0193.jpg`: tabelas de chance de baús; interface mostra 0,2% para resultado laranja e subtotal azul de 30%.
- `IMG-20261015-WA0206.jpg`–`WA0216.jpg`: equipamento exclusivo, equipamento de herói, atributos, habilidades e evolução.

Esses são valores e elementos mostrados na interface; não provam por si só a fórmula interna de combate, o RNG real ou a regra completa de ressonância.

## Código atual da branch feat/chips-equipment-chests

Arquivo analisado: [engine/game.js](https://github.com/japaprp/infinit-war-guerra-infinita/blob/feat/chips-equipment-chests/engine/game.js).

- O protótipo tem quatro tipos de módulo e dois atributos equipáveis por herói: `attackPct` e `hpPct`. As capturas mostram quatro posições na viatura; portanto, o modelo atual ainda não representa diretamente as quatro posições.
- O bônus usa `basePct + (level - 1) × 9.6`. Para o Módulo de Assalto, nível 5 dá 71% e nível 6 dá 80,6%, coincidindo com os dois valores observados. Isso não comprova a fórmula em todos os níveis.
- Os requisitos de cópias configurados são 5 para Assalto e 3 para Barreira, compatíveis com os requisitos vistos nessas telas, mas não extrapolados para todos os módulos.
- O baú do protótipo usa: 0,2% lendário; quatro resultados azuis de 7,5% cada; 30% avançado; 39,8% materiais. Soma: 100%.
- A tabela é explicitamente marcada no código como balanceamento original do protótipo, não como reprodução do pool completo do jogo de referência.
- A tabela geral de baús do protótipo tem 45% recursos, 25% fragmentos, 15% equipamento e 15% baú de módulos. Isso é uma regra própria do Guerra Infinita, não uma taxa de drop confirmada do Dark War.

## Fonte comunitária adicional

[Atlantis DWS — ferramentas e guias](https://atlantisdws.com/tools) afirma que cada tipo de tropa tem quatro chips e descreve ressonância baseada no menor nível de estrelas após desbloquear o conjunto. É fonte comunitária, não documentação oficial. Usar como hipótese de pesquisa e confirmar nas capturas; não tratar como verdade definitiva.

[Dark War Survival Player Hub](https://dw.zilo-project.com/) declara que usa dados da comunidade DWSI Discord e pede capturas para melhorar sua base. Os dados também precisam ser rastreados por fonte e confiança.

## Lacunas e decisões técnicas

1. Confirmar se as quatro posições são slots de chips da viatura, e o que as abas I–IV representam.
2. Descobrir quais condições ativam ressonância: slots completos, estrelas, raridade ou menor nível do conjunto. As capturas atuais não bastam para concluir.
3. Transcrever a tabela completa de recompensas dos baús para CSV; não estimar probabilidades ausentes.
4. Distinguir bônus de dano, vida, mitigação, escudo e dano de habilidade. Não converter “vida” em número de tropas sem uma regra de design explícita.
5. Validar inventário, IDs únicos, equipagem única, evolução, custo insuficiente, nível máximo e salvar/reabrir.
6. Fazer as recompensas e os custos serem validados pelo servidor quando houver sincronização online.
7. Manter progressão jogável sem compras obrigatórias.

## CI consultado

No commit `07007fec09d4adbad6b00eca0c43387de3958780` da branch `feat/chips-equipment-chests`, o GitHub Actions marcou sucesso para:
- [Backend Integration](https://github.com/japaprp/infinit-war-guerra-infinita/actions/runs/38829219909)
- [Drop Probability Calibration](https://github.com/japaprp/infinit-war-guerra-infinita/actions/runs/38829219707)
- [Client Persistence](https://github.com/japaprp/infinit-war-guerra-infinita/actions/runs/38829219724)

Isso valida os testes automatizados daquele commit, não a fidelidade das fórmulas ao jogo comercial nem o funcionamento em dispositivo real.

## Próximas ações

- [ ] Transcrever as tabelas completas de baús e registrar a captura de origem por resultado.
- [ ] Confirmar quatro slots e quatro abas com capturas específicas.
- [ ] Especificar uma regra original e testável de ressonância para Guerra Infinita.
- [ ] Revisar o modelo da PR #15 antes de ampliar a implementação.
- [ ] Manter a PR aberta e sem merge até concluir revisão e validação.
