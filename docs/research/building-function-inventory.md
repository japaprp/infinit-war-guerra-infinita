# Inventário de edifícios e progressão — Guerra Infinita

Atualizado em: 2026-10-29  
Branch de trabalho: `fix/android-entry-login-ui`  
Status: inventário inicial; níveis de desbloqueio do jogo de referência ainda não confirmados.

## Regras de evidência

- **Observado pelo usuário:** nomes/estruturas relatados a partir das capturas e da experiência de jogo.
- **Implementado no cliente atual:** elementos encontrados no código de Guerra Infinita.
- **Hipótese funcional:** função sugerida pelo nome; precisa ser confirmada por tela/ação observada.
- **Não confirmado:** nível de Torre de Vigia, pré-requisitos, custos, temporizadores e dependências. Não inventar esses valores.
- O arquivo `docs/balance/buildings_balance.csv` contém uma curva de balanceamento interna genérica para Guerra Infinita. Não é evidência dos custos ou níveis de desbloqueio de Dark War: Survival.

## Ponto de partida obrigatório

A nova conta de Guerra Infinita começa na **Torre de Vigia nível 1**, com um herói inicial e recursos iniciais definidos pelo próprio jogo. Não usar o estado Industrial 4 da conta de referência como tutorial nem como nível inicial.

A progressão deve ser reconstruída em ordem:
1. estado inicial e tutorial;
2. primeira melhoria da Torre de Vigia;
3. edifícios e ações desbloqueados por cada melhoria;
4. requisitos cruzados entre edifícios;
5. custos, tempo, trabalhadores/fila e recompensas;
6. confirmação com capturas de antes/depois ou observação repetível.

## Inventário de estruturas relatadas pelo usuário

A função abaixo é uma **hipótese de trabalho baseada no nome**, não uma afirmação confirmada sobre a implementação original.

| Estrutura relatada | Função a investigar | Estado no cliente atual |
|---|---|---|
| Torre de Vigia / núcleo central | Nível principal da base e portas de progressão | Existe conceito genérico `hq` no CSV; o mapa desenha `Centro de Comando`, não a Torre fiel |
| Usina / núcleo de energia | Produção ou capacidade energética | CSV inclui `energy_core`; tela atual não a representa |
| Fábrica de sucata / aço | Produção de material | CSV inclui `steel_plant`; tela atual não a representa |
| Enfermaria / oficina médica | Tratamento de feridos e/ou suporte médico | Mapa tem edifício genérico `Enfermaria`; sem fluxo de cura confirmado nessa tela |
| Bar dos caçadores / estação de rádio | Recrutamento, tarefas ou comunicação | Não representado na base atual |
| Residências (oito relatadas) | População, trabalhadores ou capacidade | Não representadas na base atual |
| Ponto de reunião / rally point | Reunião de tropas e marchas | Não representado como edifício na base atual |
| Bosque / arvoredo | Recurso de madeira ou área de coleta | Mapa mundial tem recurso visual de madeira; produção interna não confirmada |
| Estrada para a Torre | Navegação/organização visual da base | Cliente desenha estradas genéricas |
| Veículos/personagens (cinco relatados) | Transporte, equipe ou combate com veículos | Sistemas de acessórios/chips existem no código; posição e função exatas pendentes |
| Mercado negro | Trocas/loja especial | Não representado na base atual |
| Sala de construção | Construção, trabalhadores ou fila | Não representada na base atual |
| Sala à prova de explosão | Proteção ou função especial a identificar | Não representada; função desconhecida |
| Radar | Missões, exploração e alertas | Mapa da base desenha Radar com descrição genérica de exploração/alertas; missão real não conectada nessa tela |
| Arsenal | Equipamento, armamento ou preparação | Não representado na base atual |
| Edifício da aliança / união | Funções sociais, ajuda e território | Mapa mundial desenha postos aliados; gestão de aliança não comprovada por isso |
| Oficina de veículos | Treino/evolução de personagens ou veículos — confirmar pela tela | Código contém acessórios/chips de veículos; não comprova o fluxo observado |
| Praça central | Hub de navegação ou interação | Não representada na base atual |
| Armazém | Capacidade/estoque de recursos | CSV tem recursos e economia genérica; edifício não representado na tela atual |
| Instituto de pesquisa | Pesquisa e bônus permanentes | CSV inclui `research_lab`; interface e árvore de pesquisa não confirmadas aqui |
| Arena | Combate | Casinha do Abrigo abre/fecha a sobreposição do mapa; não comprova que o combate esteja conectado |
| Campo de exploração | Exploração PvE | Mapa tem ameaças e recursos demonstrativos; marcha ainda é declarada visual/demonstrativa |
| Praça de reunião da aliança | Reuniões/atividades de aliança | Não representada na base atual |
| Três caminhões | Transporte/logística — função exata pendente | Não representados como entidades específicas |
| Quartel reserva | Treino/capacidade de tropas | CSV inclui `barracks`; não há prova de que corresponda ao edifício relatado |
| Helicóptero | Transporte, missões ou deslocamento — confirmar | Não representado na base atual |
| Biblioteca | Pesquisa, conhecimento ou bônus — confirmar | Não representada na base atual |
| Estação de mercadorias | Comércio/logística — confirmar | Não representada na base atual |
| Posto de operações especiais | Missões/unidades especiais — confirmar | Não representado na base atual |
| Campo de treinamento | Treino de heróis/tropas — confirmar | Não representado na base atual |
| Modificação de garagem | Melhorias de veículos | Código inclui acessórios/chips de veículos; interface de garagem não confirmada |
| Centro militar | Comando ou melhoria militar — confirmar | Não representado na base atual |
| Centro de emergência | Suporte/recuperação — confirmar | Não representado na base atual |

## Diferença concreta observada no código de Guerra Infinita

O módulo `frontend/public/engine/world-map.js` atualmente desenha sete estruturas simples no Abrigo: Centro de Comando, Quartel, Oficina, Estação de Suprimentos, Radar, Enfermaria e Casinha do Abrigo. São formas geométricas ilustrativas. A Casinha está ligada a sair da sobreposição do mapa; a ação genérica de outros edifícios apenas exibe uma mensagem de que upgrades/custos serão conectados depois.

No mapa mundial, bases, ameaças, recursos e capital também são dados demonstrativos. O próprio código informa que a marcha visual não envia tropas ao servidor. Portanto, esses elementos não devem ser contabilizados como sistemas de jogo concluídos.

## Próxima coleta de evidência necessária

Para cada estrutura, registrar uma linha por captura:
- nome exatamente como aparece na tela;
- nível da Torre de Vigia e nível do edifício;
- se já está construído, bloqueado, em construção ou apenas visível;
- requisito mostrado ao tocar no edifício;
- custo e duração mostrados;
- ação disponível e resultado depois de tocar;
- captura antes/depois ou nome do arquivo de referência;
- confiança: alta (visível/repetível), média (uma captura sem interação), baixa (inferência pelo nome).

## Critério para marcar um desbloqueio como confirmado

Só registrar `Torre de Vigia N → edifício X` quando houver evidência de jogo para essa relação: tela de requisito, tutorial observado ou teste repetível em conta nova. Guias comunitários servem como pista, não como confirmação única. Até então, usar **PENDENTE DE EVIDÊNCIA**.


## Primeiros desbloqueios da referência — fonte comunitária, validar em jogo

A wiki comunitária de Structures publica a seguinte coluna “Get at Watchtower Level”. Isto é uma **pista documental para planejar a coleta**, não uma confirmação oficial nem prova de pré-requisito para upgrade. A própria página pode estar desatualizada; conferir em conta nova antes de fixar esses níveis no jogo.

| Torre de Vigia | Estruturas listadas como disponíveis |
|---:|---|
| 1 | Lumber Mill (serraria), Scrapyard (pátio de sucata), Kitchen (cozinha) |
| 2 | Power Plant (usina), Hunters Hut (cabana dos caçadores) |
| 3 | Dorm (dormitório) |
| 4 | City Gate (portão da cidade), Military Center (centro militar), Radio Station (estação de rádio) |
| 5 | Radar, Warehouse (armazém) |
| 6 | Black Market (mercado negro), Hospital |
| 7 | Library (biblioteca), Mart (mercado/loja) |
| 8 | Research Center (centro de pesquisa), Alliance Hall (salão da aliança) |
| 9 | Deerhunter Bar (bar dos caçadores) |
| 10 | Infirmary (enfermaria), Arena |
| 11 | Fighter Camp, Shooter Camp, Rider Camp, Alliance Plaza, Construction Hall |
| 12 | Gathering Ground, Conscription Office |
| 13 | Training Ground, Adventure Camp |
| 14 | Supply Station |

**Fontes comunitárias:** [Structures — Dark War Survival Wiki](https://dark-war-survival.fandom.com/wiki/Structures) e [Watchtower Upgrade Requirements — Dark War Survival](https://www.dark-war.com/calculators/watchtower). O segundo recurso lista requisitos de upgrades e assinala que valores/tempos podem variar com bônus. São fontes secundárias, não substituem a observação no cliente.

### O que já podemos inferir com cuidado

- A referência tem progressão orientada pela Torre de Vigia e edifícios de pré-requisito, não apenas uma lista plana de construções.
- Os primeiros níveis relatados pela wiki incluem estruturas de produção básica (serraria, sucata, cozinha) antes de sistemas de aliança/pesquisa e edifícios de nível mais avançado.
- Não mapear automaticamente os nomes para os edifícios atuais de Guerra Infinita: equivalências como “Quartel reserva”, “oficina médica”, “sala à prova de explosão” e “centro de emergência” ainda precisam de captura/observação para resolver diferenças de tradução ou de versão.
- Custos e tempos publicados para a referência **não** devem ser copiados para `docs/balance/buildings_balance.csv`; esse CSV é o balanceamento próprio do projeto.
