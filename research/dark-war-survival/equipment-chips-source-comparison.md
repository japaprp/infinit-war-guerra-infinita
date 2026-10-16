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


## Auditoria adicional de fontes comunitárias — 2026-10-15

### Fontes consultadas nesta continuação

- [Dark War Survival Player Hub](https://dw.zilo-project.com/): declara que usa dados da comunidade DWSI Discord e convida jogadores a enviar capturas.
- [Dark War — Precision Parts Calculator](https://www.dark-war.com/calculators/precision-parts): publica requisitos industriais I1–I8 e explica que a rotação de pré-requisitos envolve Torre de Vigia, três campos e Guilda. A página informa correção em 14 de setembro de 2026.
- [Treyex Gaming — Chip System Guide](https://www.treyexgaming.com/dark-war-survival-chip-system-guide-chip-factions-skills/): guia comunitário sobre facções de chips, baús e fabricação.
- [Transcrição de vídeo sobre chips](https://www.youtubetranslate.net/en/watch?v=F7xblHuCq4U): transcrição secundária que descreve, entre outros exemplos, 0,2% de chip laranja em baú verde, 30% azul e baú roxo com 85% roxo / 15% laranja.

**Limite de confiança:** nenhuma dessas páginas é documentação oficial do desenvolvedor. São fontes secundárias/comunitárias e podem refletir versões, servidores ou tipos de baú diferentes. A evidência primária do projeto continua sendo a captura original, com nome e contexto preservados.

### Matriz de confronto — chips e baús

| Regra / dado | Evidência disponível | Tratamento no Guerra Infinita |
|---|---|---|
| Baú verde com chance de 0,2% para resultado laranja | Capturas WA0185–WA0193 catalogadas; transcrição comunitária concorda com o exemplo | Manter como valor relatado pela interface da captura específica; não generalizar para outros baús |
| Resultado azul total de 30% | Subtotal visível nas capturas e transcrição secundária | Preservar como observado naquele baú; confirmar se as categorias restantes fecham 100% |
| Baú roxo: 85% roxo / 15% laranja | Guia/transcrição comunitária, não confirmado aqui por captura inequívoca da tela correspondente | Marcar como hipótese pendente de captura direta |
| Baú laranja garante chip laranja | Guia/transcrição comunitária | Marcar como hipótese de fonte secundária; confirmar tela, conteúdo e possíveis exceções |
| Quatro posições de chip e abas I–IV | Capturas WA0155 e WA0180, conforme catálogo | Modelar quatro slots e presets como conceitos distintos até teste confirmar sua relação |
| Ressonância baseada no menor nível de estrelas | Referência comunitária citada anteriormente; não comprovada apenas pelas capturas disponíveis | Não implementar como fato do jogo de referência; criar teste e definir uma regra própria para Guerra Infinita |

### Próxima fatia técnica recomendada

1. **Modelo de dados:** `ChipDefinition`, `ChipInstance`, `VehicleLoadout` com quatro slots, e presets I–IV separados do inventário.
2. **Validações:** impedir equipar a mesma instância em dois slots; validar facção, slot compatível, propriedade, evolução e materiais suficientes.
3. **Ressonância original:** especificar uma regra explícita, determinística e testável para Guerra Infinita; não copiar uma fórmula comunitária não confirmada.
4. **Baús:** separar tabelas por tipo de baú; validar que cada tabela soma exatamente 100%; manter RNG e concessão de recompensas no servidor quando houver backend.
5. **Auditoria:** registrar origem da probabilidade (captura, fonte secundária ou decisão de balanceamento), confiança, versão e testes.
6. **Progressão justa:** permitir obter materiais por atividades jogáveis e não exigir compra para desbloquear a progressão principal.

### Critérios de aceite para a próxima implementação

- Quatro slots podem ser preenchidos e salvos sem duplicação de instância.
- Presets I–IV salvam/restauram conjuntos independentemente.
- Equipagem, remoção e evolução persistem após reabrir o jogo.
- Material insuficiente e item incompatível são recusados sem alterar o estado.
- Cada baú tem tabela explícita que soma 100%; testes cobrem cada resultado e os limites.
- A UI identifica claramente valores de protótipo e não apresenta taxas não confirmadas como dados oficiais de Dark War: Survival.


## Auditoria de heróis e equipamentos — novas fontes públicas, 2026-10-16

### Evidência comunitária localizada

- [Packsify — Hero Equipment Guide, 30 jul. 2026](https://www.packsify.com/blogs/dark-war-survival-hero-equipment-guide): afirma que, em batalhas de tropas (PvP, rally e State of Supremacy), os atributos de equipamento dos cinco heróis da formação são agregados. O artigo contrasta esse comportamento com batalhas do modo Hero Battles/Adventure, onde a alocação de equipamento em cada herói importa para o dano de ataques normais. É uma afirmação de guia comunitário, não confirmada por teste independente neste projeto.
- [LDShop — Advanced Gear Optimization Strategy, 17 jun. 2026](https://www.ldshop.gg/blog/dark-war-survival/hero-euipment.html): descreve quatro espaços de equipamento (arma, capacete, armadura e botas), associando os dois primeiros a atributos ofensivos e os dois últimos à sobrevivência. É uma fonte secundária; conferir nomes, ícones e atributos na captura antes de usar a nomenclatura final.
- [DWS攻略研究所 — guia de heróis S1–S6](https://dws-kouryaku.com/hero-guide/): página em japonês com atualização registrada em outubro de 2026, organizada por facção/tipo, temporada, equipamento exclusivo, materiais de estrelas e reinicialização. Pode servir como índice de personagens/sistemas, mas não é prova de que a mesma rotação de heróis/temporada se aplique ao servidor da conta do usuário.
- [Vídeo YouTube — Hero Equipment Guide & Best Tips](https://www.youtube.com/watch?v=fSASmXvrdp4): vídeo de fevereiro de 2025 sobre raridade, aprimoramento e equipamento. É anterior a várias atualizações e serve apenas como contexto histórico, não como fonte atual para custos ou meta.

### Distinção de mecânica a preservar

Há duas perguntas diferentes que os guias comunitários podem estar misturando:
1. **Atributos agregados da formação:** quais bônus de equipamento contam para o poder/dano de uma marcha de tropas.
2. **Alocação individual em combate de heróis:** se o personagem que usa ataque normal recebe os atributos do item que está vestindo.

Não colapsar as duas regras numa só. Antes de codificar, é necessário definir quais modos de combate Guerra Infinita terá e estabelecer, para cada modo, se os atributos são agregados pela formação ou aplicados individualmente. Essa será uma decisão de arquitetura original, testável por unidade de combate.

### Limitações e decisões de implementação

- Nenhuma taxa de aumento por estrela, custo de núcleo de poder ou regra de compartilhamento de equipamento é promovida a fato nesta rodada: os materiais encontrados são guias secundários e versões distintas podem divergir.
- Registrar para cada item: slot, classe/facção compatível, raridade, nível, estrelas, atributos-base, bônus de conjunto (se houver), custos de aprimoramento e origem da informação.
- Separar EquipmentDefinition (dados imutáveis do tipo de peça) de EquipmentInstance (nível, estrelas, proprietário e identificador único), evitando que uma cópia do item seja duplicada por troca de herói.
- Os modos de batalha devem declarar uma política explícita de cálculo de atributos: formationAggregate ou perHero, em vez de deixar a regra implícita na UI.
- Não copiar heróis, nomes, arte, descrições, tabelas de balanceamento ou identidade visual do jogo de referência. A pesquisa serve para compreender categorias e padrões de sistemas; o conteúdo do Guerra Infinita deve ser original.
- A progressão do Guerra Infinita começa no nível 1 e deve permitir obter equipamento e materiais por jogo regular, sem compras obrigatórias.

### Próximas verificações

1. Cruzar as capturas WA0206–WA0216 com os quatro slots de equipamento, nomes exatos, raridade, estrelas e atributos.
2. Procurar capturas em que o mesmo equipamento é movido entre heróis e comparar o poder da marcha antes/depois.
3. Separar tela de atributos de herói, tela de formação e resultado de batalha; um único número de poder não basta para deduzir o cálculo de dano.
4. Manter todas as afirmações comunitárias etiquetadas como secundárias até haver captura legível, teste controlado ou documentação oficial.
