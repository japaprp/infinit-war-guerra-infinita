# Auditoria dos guias públicos — Dark War: Survival (BlueStacks)

**Objetivo:** converter os guias públicos em requisitos verificáveis para Guerra Infinita. O objetivo de produto definido é buscar paridade funcional do comportamento observável, com arte, nomes e implementação próprios. Este documento não afirma acesso ao código-fonte interno do jogo original.

**Fonte principal:** [índice de guias BlueStacks — Dark War: Survival](https://www.bluestacks.com/pt-br/blog/game-guides/dark-war-survival.html)  
**Guias lidos nesta primeira passagem:**
- [Guia para iniciantes](https://www.bluestacks.com/pt-br/blog/game-guides/dark-war-survival/dws-beginners-guide-ptbr.html)
- [Dicas e truques](https://www.bluestacks.com/pt-br/blog/game-guides/dark-war-survival/dws-tips-tricks-ptbr.html)
- [Guia de tropas](https://www.bluestacks.com/pt-br/blog/game-guides/dark-war-survival/dws-troop-guide-ptbr.html)
- [Guia de alianças](https://www.bluestacks.com/pt-br/blog/game-guides/dark-war-survival/dws-alliance-guide-ptbr.html)

## 1. Regras para não confundir evidência com implementação

- **DOCUMENTADO PELO GUIA:** o artigo declara explicitamente a mecânica.
- **A VALIDAR NO JOGO:** detalhe que o guia simplifica, não quantifica ou pode variar conforme versão.
- **EXISTE NO PROTÓTIPO:** aparência ou interação já presente no código do Guerra Infinita; não significa que a mecânica esteja ligada ao servidor.
- **NÃO IMPLEMENTADO/COMPROVADO:** requer código, persistência, testes e/ou integração real antes de ser anunciado como funcional.

Os guias são fontes secundárias e podem ficar desatualizados. Níveis, nomes, custos, temporizadores, fórmulas, requisitos e recompensas exatos precisam ser confirmados por capturas atuais, observação controlada ou fontes adicionais. Não inferir fórmulas internas apenas por texto ou imagem.

## 2. Matriz inicial de sistemas

| Sistema | O que os guias descrevem | Requisitos para Guerra Infinita | Confiança / próximo passo |
|---|---|---|---|
| Base e edifícios | Centro de Comando, Quartéis, depósitos de recursos, laboratório de pesquisa, muralhas/defesas e edifícios de produção têm papéis diferentes na progressão. | Modelar cada edifício com nível, pré-requisitos, custo por recurso, duração, efeito e limites; validar melhorias no servidor e na interface. | **DOCUMENTADO PELO GUIA**; custos e dependências **A VALIDAR**. |
| Recursos e produção | Reunir recursos, manter produção ativa e respeitar capacidade de armazenamento são partes centrais da progressão. | Inventário autoritativo, produção por intervalo, capacidade, coleta, gasto atômico e prevenção de saldo negativo. | Conceito documentado; fórmulas e valores **A VALIDAR**. |
| Missões e capítulos | Missões principais/secundárias e tarefas de crescimento orientam upgrades e dão EXP, acelerações, recursos e itens. | Cadeias de objetivos com condições explícitas, estados, pré-requisitos, recompensas idempotentes e histórico. | Conceito documentado; lista e recompensas **A VALIDAR**. |
| Modo Aventura / PvE | Progresso em fases fornece experiência/saques e desbloqueia sistemas posteriores. O guia de dicas cita o Radar como desbloqueio associado à progressão de aventura. | Campanha com nós, requisitos de entrada, equipes, resultado de combate, estrelas/saques se confirmados e desbloqueios. | Fluxo geral documentado; ordem exata e níveis **A VALIDAR**. |
| Radar e mapa-múndi | Radar abre acesso a missões e atividades globais; o mapa inclui inimigos, pontos de coleta, jogadores e atividades de grupo. | Estados reais do mapa, seleção de destino, marchas persistidas, tempo de viagem, chegada, retorno e resolução de ações no backend. | Conceito documentado; desbloqueio exato varia/precisa confirmação. |
| Marchas | Envio de tropas é parte da estratégia de mapa, exploração, coleta e ataque. | Uma marcha tem origem, destino, composição, capacidade, estado, horário de saída/chegada, cancelamento/retorno e resolução idempotente. | Conceito documentado; fórmula de velocidade, limites e estados **A VALIDAR**. |
| Tropas e formação | O guia diferencia unidades de linha de frente, ataque à distância e suporte; formação e sinergia com heróis influenciam o resultado. | Tipos de unidade configuráveis, quantidades, capacidade, formação, atributos, baixas e retorno; regras de combate testadas. | Papéis documentados; proporções sugeridas no artigo são apenas recomendação editorial, não regra universal. |
| Heróis | Heróis possuem habilidades e funções; formação e combinação alteram o desempenho. | Cadastro de herói, raridade se confirmada, nível, atributos, habilidades, fragmentos, formação e bônus aplicados de fato ao cálculo de batalha. | Conceito documentado; fórmulas, raridades e habilidades **A VALIDAR**. |
| Alianças | Acesso a ajuda, tecnologia, moeda/loja, eventos, reforços e objetivos coletivos. | Membros e cargos, permissões, pedidos de ajuda com redução limitada, doações, tecnologia, loja, reforços, eventos e logs. | Conceito documentado; limites, custos e bônus **A VALIDAR**. |
| PvP e exploração | O guia recomenda inspecionar o alvo antes de atacar e considerar força, formação e custo de perdas. | Relatório de reconhecimento, autorização de ataque, resolução de batalha no servidor, perdas, saque, proteção e prevenção de ataques duplicados. | Fluxo conceitual documentado; regras exatas **A VALIDAR**. |
| Eventos temporários | Os guias mencionam eventos com tempo limitado, tarefas coletivas e recompensas. | Configuração de janela temporal, critérios, pontuação, classificação, recompensas únicas e tratamento de fuso/encerramento. | Conceito documentado; catálogo e regras **A VALIDAR**. |
| Interface e navegação | A experiência alterna a base e conteúdo global; recursos aparecem conforme desbloqueios. | Manter a decisão de produto: dois ambientes primários — **Abrigo/Base** e **Mapa-múndi**. A Arena abre ao tocar na casinha do abrigo; não criar uma terceira aba fixa Arena. | Requisito de produto definido; protótipo visual ainda precisa de teste em Android. |

## 3. Fluxo de progressão a validar

1. Entrada de jogador novo com estado inicial próprio de Guerra Infinita (nível 1; não importar dados de contas reais do Dark War).
2. Tutorial e tarefas iniciais guiam os primeiros edifícios, coleta e melhorias.
3. Campanha/Aventura permite ganhar experiência e recompensas e avançar em desbloqueios.
4. Confirmar a sequência e os requisitos que liberam Radar e mapa-múndi.
5. No mapa, explorar alvos e pontos de recurso; enviar marchas com tropas selecionadas.
6. Resolver coleta, PvE e PvP no servidor e persistir resultados.
7. Desbloquear e aprofundar heróis, pesquisa, alianças e eventos de acordo com requisitos confirmados.

**Atenção:** a ordem acima é um mapa de investigação, não uma especificação fechada. O guia de dicas associa o Radar à progressão em Aventura e cita a Torre de Vigia nível 7 como referência para interação global; isso deve ser reproduzido somente depois de confirmação em evidências atuais.

## 4. Plano de investigação priorizado

### P0 — fechar o ciclo jogável
- [ ] Capturar a sequência inicial do jogo: criação de conta, tutorial, primeiro edifício e primeira missão.
- [ ] Registrar por edifício: nível, custo por recurso, tempo, pré-requisito e benefício.
- [ ] Confirmar como Radar/torre de vigia desbloqueiam o mapa e se existem condições alternativas.
- [ ] Registrar fluxo completo de marcha: seleção de alvo, composição, confirmação, timer, chegada, resultado e retorno.
- [ ] Distinguir PvE de mapa, campanha/Aventura e Arena de combate; documentar entrada e saídas.
- [ ] Especificar como recursos e tropas são debitados/devolvidos em sucesso, falha, cancelamento e desconexão.

### P1 — profundidade estratégica
- [ ] Transcrever tipos de tropas, counters, formação e atributos.
- [ ] Catalogar heróis, habilidades, requisitos de evolução e efeitos mensuráveis.
- [ ] Mapear pesquisa, categorias, custos e bônus por nível.
- [ ] Documentar coleta de recursos, capacidade de carga, velocidade e risco.
- [ ] Mapear ajuda da aliança, doações, tecnologia, cargos, loja e reforços.

### P2 — conteúdo de longo prazo
- [ ] Catalogar eventos, calendário, pontos, marcos e recompensas.
- [ ] Mapear missões de radar e tarefas recorrentes.
- [ ] Registrar sistemas secundários, equipamentos, chips, baús e probabilidades separadamente, usando a pasta de evidências já existente.
- [ ] Fazer testes de regressão de economia, persistência e concorrência antes de liberar sistemas conectados.

## 5. Critérios de aceite técnicos

- Uma ação importante deve ser validada no servidor; a interface não pode fabricar recursos, marchas, resultados ou recompensas.
- Operações de custo/recompensa devem ser atômicas e idempotentes para evitar duplicação por toque duplo, retry ou desconexão.
- Timers devem usar timestamps de servidor e ser recalculáveis após recarregar a página.
- Seleção visual de mapa não equivale a marcha real; a interface deve indicar claramente ações ainda indisponíveis.
- Toda regra ainda não confirmada fica marcada como hipótese, sem números inventados.
- Os testes devem cobrir sucesso, falha, timeout, desconexão, concorrência e reentrada na tela.
- O jogador inicia em estado novo, independente da conta pessoal do usuário no Dark War.
- Manter arte, nomes e implementação próprios. Usar os guias para compreender comportamento observável, não reutilizar ativos proprietários nem pressupor acesso ao código interno.

## 6. Estado do protótipo atual (20/10/2026)

A branch de interface `feat/android-world-map-shell` contém um mapa isométrico demonstrativo, bases/recursos/ameaças ilustrativas, linhas de marcha animadas, edifícios e uma casinha que retorna à arena existente. A PR #37 permanece em rascunho e não foi mesclada nem publicada.

**Limitação conhecida:** as linhas de marcha e os pontos do mapa ainda são demonstrações visuais; a tela não comprova envio de tropas, coleta, combate global, captura de território ou persistência de coordenadas no servidor. O chat também é um placeholder. O fluxo deve ser testado em navegador Android antes de considerar a interface validada.

## 7. Fontes

1. BlueStacks, [Guia para iniciantes](https://www.bluestacks.com/pt-br/blog/game-guides/dark-war-survival/dws-beginners-guide-ptbr.html).
2. BlueStacks, [Dicas e truques](https://www.bluestacks.com/pt-br/blog/game-guides/dark-war-survival/dws-tips-tricks-ptbr.html).
3. BlueStacks, [Guia de tropas](https://www.bluestacks.com/pt-br/blog/game-guides/dark-war-survival/dws-troop-guide-ptbr.html).
4. BlueStacks, [Guia de alianças](https://www.bluestacks.com/pt-br/blog/game-guides/dark-war-survival/dws-alliance-guide-ptbr.html).
5. BlueStacks, [índice de guias de Dark War: Survival](https://www.bluestacks.com/pt-br/blog/game-guides/dark-war-survival.html).
