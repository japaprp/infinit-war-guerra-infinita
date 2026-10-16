# Catálogo de evidências — Dark War: Survival

**Projeto de destino:** Guerra Infinita (implementação original)  
**Estado:** catálogo atualizado até `IMG-20261015-WA0288.jpg`. A contagem antiga de 94 arquivos é histórica e está pendente de auditoria da pasta real; não equivale ao total atual.  
**Branch de evidências:** `research/dark-war-survival-captures`  
**Regra:** este catálogo descreve apenas elementos visíveis nas capturas; não afirma acesso ao código-fonte interno do jogo.

## Como interpretar

- **CONFIRMADO VISUALMENTE** — elemento, texto ou valor visível em uma captura.
- **RELATADO NA INTERFACE** — descrição, bônus ou probabilidade exibida pelo próprio jogo; não é validação independente do resultado real.
- **PRECISA DE TESTE** — fórmula interna, comportamento após ações, RNG efetivo, escalonamento de níveis ou causalidade não demonstrada por uma imagem estática.

Os nomes e valores identificáveis de contas foram omitidos deste catálogo. As imagens originais ainda podem conter informações de conta, aliança, zona e rankings; como o repositório é público, recomenda-se substituir as capturas por versões anonimizadas antes de incorporar esta PR.

## Índice de evidências por arquivo

| Arquivo | Sistema | Observação visual | Estado / perguntas em aberto |
|---|---|---|---|
| `IMG-20261015-WA0155.jpg` | Modificação da garagem / chips | Tela de conjunto de chips com quatro posições ao redor do núcleo de ressonância; botão de instalação em um clique; quatro abas numeradas I–IV; poder exibido de 7.840.000. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: efeito real de ressonância e regras para ativar conjuntos. |
| `IMG-20261015-WA0156.jpg` | Acessórios da viatura | Seis posições de acessórios, todos exibidos como nível 2, níveis de item aproximadamente 23–26; atributos incluem Ataque de Tropas, poder de ATQ contra cidade e valor de destruição. | CONFIRMADO VISUALMENTE. Os valores comparativos exibidos não provam a fórmula por nível. |
| `IMG-20261015-WA0157.jpg` | Formação de heróis 1 | Viatura no centro, cinco posições de herói, abas Herói/Soldados, botão Salvar e contagem de tropas. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: cálculo de poder, regras de posição e prioridade de alvos. |
| `IMG-20261015-WA0158.jpg` | Base / cidade | Visão isométrica da base, construções com níveis, recursos no topo, botões de navegação e tarefa de exploração com progresso. | CONFIRMADO VISUALMENTE. O fluxo de construção e desbloqueio precisa de capturas sequenciais. |
| `IMG-20261015-WA0160.jpg` | Base / construção em andamento | Visão da cidade com temporizador visível em uma construção e atalho para ações de melhoria. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: duração base, bônus de aceleração e efeito de sair/reabrir. |
| `IMG-20261015-WA0161.jpg` | Poder de combate | Painel divide poder entre edifício, tecnologia, tropas, herói, veículo modificado e agente/pet. | CONFIRMADO VISUALMENTE. As categorias são componentes do indicador agregado; fórmula de agregação desconhecida. |
| `IMG-20261015-WA0162.jpg` | Detalhamento de poder | Subcategorias exibem valores de poder e classificações/letras, com botões de promoção. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: limites das notas e critérios de classificação. |
| `IMG-20261015-WA0163.jpg` | Perfil do sobrevivente | Tela de perfil mostra poder, abates, aliança, zona e descrição do perfil. | CONFIRMADO VISUALMENTE. Não reutilizar nomes, IDs, zona ou dados da conta no jogo original. |
| `IMG-20261015-WA0172.jpg` | Detalhe de chip de ataque | Módulo de Assalto — Guerreiro: dano de combate dos guerreiros +71%; texto informa dano adicional de unidade e bônus de dano de habilidade da viatura. | RELATADO NA INTERFACE. PRECISA DE TESTE: se bônus são aditivos/multiplicativos e como se acumulam. |
| `IMG-20261015-WA0173.jpg` | Evolução de chip | Tela de aumento de estrelas mostra progresso 4/10, custo de poder e requisito de material 1/5; bônus projetado sobe de +71% para +80,6%. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: custo e ganho por estrela em outros níveis. |
| `IMG-20261015-WA0174.jpg` | Chip defensivo | Barreira Gravitacional — Guerreiro: Vida útil do Guerreiro +45,2%; texto descreve redução de dano e escudo após habilidade da viatura. | RELATADO NA INTERFACE. PRECISA DE TESTE: duração, limites e ordem de cálculo do escudo. |
| `IMG-20261015-WA0175.jpg` | Evolução de chip defensivo | Progresso de estrelas 4/10; projeção de Vida útil do Guerreiro de +45,2% para +54,8%; requisito 0/3. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: relação entre material, estrelas e bônus. |
| `IMG-20261015-WA0176.jpg` | Fábrica de chips / armazém | Grade de chips de várias raridades, categorias/filtros e botão Instalar. | CONFIRMADO VISUALMENTE. Inventário e filtros precisam de mapeamento completo. |
| `IMG-20261015-WA0177.jpg` | Fábrica de chips / fabricar | Área de seleção para criar chip; categorias por ícones e lista de receitas/itens disponíveis. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: desbloqueio de receitas e taxa de produção. |
| `IMG-20261015-WA0178.jpg` | Fábrica de chips / receita | Receita de Barreira Gravitacional — Guerreiro selecionada; material mostra 233/800 e controle de quantidade. | CONFIRMADO VISUALMENTE. Não extrapolar custo para outras raridades/receitas. |
| `IMG-20261015-WA0180.jpg` | Modificação da garagem / chips | Reaparece o conjunto de quatro chips, ressonância, poder e botão de instalação rápida. | CONFIRMADO VISUALMENTE; provável tela repetida para referência. |
| `IMG-20261015-WA0184.jpg` | Inventário de itens especiais | Inventário com abas Especial/Equipamento/Guerra/Acelerado/Recursos; itens de chip, materiais, EXP e caixas. | CONFIRMADO VISUALMENTE. Os itens precisam de catálogo por tipo e fonte. |
| `IMG-20261015-WA0185.jpg` | Probabilidades de baú de chip | Anúncio de probabilidade para chip laranja 0,2%; vários itens listados com probabilidades individuais pequenas; chip roxo aparece como categoria separada. | RELATADO NA INTERFACE. Confirmar se valores são por abertura, por item ou por grupo e se há pity. |
| `IMG-20261015-WA0186.jpg` | Probabilidades de baú de chip | Continuação do anúncio: chips roxos e chips azuis; grupo azul exibido com 30,0% e quatro resultados individuais de 7,5%. | RELATADO NA INTERFACE. Não inferir RNG real só pela tabela exibida. |
| `IMG-20261015-WA0187.jpg` | Baú de chip verde | Modal de baú verde com seleção de quantidade e botão Usar; mostra recompensas de raridades diferentes. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: resultados reais e possibilidade de múltiplos itens. |
| `IMG-20261015-WA0188.jpg` | Detalhes de recompensas de chip | Lista de possíveis chips/materiais avançados com chances pequenas por item. | RELATADO NA INTERFACE. Registrar tabela completa antes de comparar probabilidades. |
| `IMG-20261015-WA0189.jpg` | Detalhes de recompensas de chip | Lista inclui material de chip avançado e chips de diferentes classes/raridades com chance exibida. | RELATADO NA INTERFACE. PRECISA DE TESTE: pesos e distribuição efetiva. |
| `IMG-20261015-WA0190.jpg` | Detalhes de recompensas de chip | Continuação da tabela de recompensas, incluindo quantidades múltiplas de material e chips. | RELATADO NA INTERFACE. Confirmar a soma de probabilidades e as regras de quantidade. |
| `IMG-20261015-WA0191.jpg` | Detalhes de recompensas de chip | Lista de recompensas para outra categoria de chip/tropa, com itens por classe. | RELATADO NA INTERFACE. Separar pools por classe e tipo de baú. |
| `IMG-20261015-WA0192.jpg` | Baú de chip azul | Inventário de itens especiais com baú azul selecionado; descrição promete chip azul ou superior e materiais avançados. | RELATADO NA INTERFACE. Verificar a recompensa em aberturas controladas. |
| `IMG-20261015-WA0193.jpg` | Detalhes de recompensas de chip | Outra continuação de lista de recompensas para chips de tropa/classe. | RELATADO NA INTERFACE. Vincular ao tipo de baú exato antes de modelar. |
| `IMG-20261015-WA0194.jpg` | Duelo da Aliança — Dia 5 | Objetivos de desenvolvimento global com pontuação por consumir engrenagens, liga de titânio, plantas de design, núcleo de energia e fragmentos de equipamento exclusivo. | CONFIRMADO VISUALMENTE. Pontos são específicos do evento/tarefa mostrado; verificar outros dias. |
| `IMG-20261015-WA0195.jpg` | Duelo da Aliança — Dia 5 | Pontos para medalhas de honra, regulamentos de treinamento e abertura de baú de chips laranja. | CONFIRMADO VISUALMENTE. A tarefa de abrir baú pode ter pontuação em lote; precisa de teste. |
| `IMG-20261015-WA0196.jpg` | Duelo da Aliança — Dia 5 | Pontuação para núcleo de energia, Planta DX e fragmentos de herói por raridade. | CONFIRMADO VISUALMENTE. Confirmar pontos por unidade e eventuais limites diários. |
| `IMG-20261015-WA0197.jpg` | Duelo da Aliança — Dia 5 | Pontos para diamantes, rações táticas avançadas, posições nutritivas, chips de potencial e medalhas. | CONFIRMADO VISUALMENTE. Separar custo de recurso e pontuação concedida. |
| `IMG-20261015-WA0206.jpg` | Equipamento exclusivo / arma | Tela de arma exclusiva com atributos e materiais necessários para atualização; mostra progresso e botão Atualizar. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: como cada nível altera atributos e habilidades. |
| `IMG-20261015-WA0207.jpg` | Equipamento de herói | Detalhes de peça de equipamento, atributos básicos e de promoção, botão remover/substituir e evolução de estrelas. | CONFIRMADO VISUALMENTE. Mapear raridade, slot e efeitos de conjunto. |
| `IMG-20261015-WA0208.jpg` | Equipamento de herói | Detalhes de outra peça, com nível 100/100 e atributos aprimorados como ataque de tropas e dano de facção. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: bônus locais versus bônus globais. |
| `IMG-20261015-WA0209.jpg` | Herói / habilidade | Tela de habilidade ativa de um herói, dano-base, dano adicional por estrelas e custo de atualização. | RELATADO NA INTERFACE. PRECISA DE TESTE: escala do dano e comportamento contra diferentes alvos. |
| `IMG-20261015-WA0210.jpg` | Equipamento de herói | Outra visualização de equipamento com ATQ/DEF de herói, dano de tropas e atributos de promoção. | CONFIRMADO VISUALMENTE. Evitar assumir que valores se aplicam a todos os heróis. |
| `IMG-20261015-WA0211.jpg` | Honra do herói | Tela de nível de honra, facção/classe e bônus de tropa por níveis; materiais e opções de desconto. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: se bônus acumulam por nível e por herói. |
| `IMG-20261015-WA0212.jpg` | Herói / habilidade | Reapresenta habilidade ativa e escalonamento de dano do herói. | CONFIRMADO VISUALMENTE; provável captura repetida para detalhar a habilidade. |
| `IMG-20261015-WA0213.jpg` | Herói / estrelas | Tela de evolução de estrelas, poder, ATQ, DEF e unidades do herói; indicação de que foi adicionado ao Salão da Honra. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: desbloqueios por estrela. |
| `IMG-20261015-WA0213(1).jpg` | Herói / estrelas | Duplicata visual da tela anterior. | CONFIRMADO VISUALMENTE; manter como duplicata até decidir deduplicação. |
| `IMG-20261015-WA0214.jpg` | Herói / equipamento e nível | Tela de herói com quatro slots de equipamento, nível e recursos de melhoria. | CONFIRMADO VISUALMENTE. Mapear slot → tipo de equipamento → atributo. |
| `IMG-20261015-WA0215.jpg` | Herói / atributos | Tela de personagem com nível, poder, ATQ, DEF, unidades e quatro peças de equipamento. | CONFIRMADO VISUALMENTE. Valores são estado de uma conta específica, não valores iniciais. |
| `IMG-20261015-WA0216.jpg` | Herói / evolução de estrelas | Tela mostra alterações projetadas de atributos e unidades, materiais e botões de evolução. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: ganho por estrela e custo acumulado. |
| `IMG-20261015-WA0218.jpg` | Herói / habilidade | Habilidade ativa com progressão de dano por estrelas e condição de atualização. | RELATADO NA INTERFACE. Confirmar o nível mínimo e o efeito de cada estrela. |
| `IMG-20261015-WA0219.jpg` | Lista de heróis | Grade de heróis com raridades, níveis, estrelas e botão para recrutamento. | CONFIRMADO VISUALMENTE. Criar catálogo de classes, raridades e funções sem copiar arte/personagens. |
| `IMG-20261015-WA0220.jpg` | Formação de heróis 3 | Viatura e cinco posições de heróis, lista de heróis/soldados e botão Salvar. | CONFIRMADO VISUALMENTE. Comparar formações 1–3 e bônus de equipe. |
| `IMG-20261015-WA0221.jpg` | Formação de heróis 2 | Segunda formação com cinco posições, roster, níveis e botão Salvar. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: regras de exclusividade entre formações. |
| `IMG-20261015-WA0222.jpg` | Formação de heróis 1 | Primeira formação com cinco posições e contagem de tropas. | CONFIRMADO VISUALMENTE. Comparar escalação e capacidade de tropas. |
| `IMG-20261015-WA0224.jpg` | Arena da Tempestade / perfil de herói | Modal com resumo de equipe de outro jogador e níveis dos heróis. | CONFIRMADO VISUALMENTE. Dados de jogadores devem ser anonimizados. |
| `IMG-20261015-WA0225.jpg` | Arena da Tempestade | Ranking de sobreviventes, pontos e grupos Ouro/Prata. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: pareamento, reset e recompensa por colocação. |
| `IMG-20261015-WA0226.jpg` | Arena da Tempestade / perfil | Modal com composição de heróis e níveis. | CONFIRMADO VISUALMENTE. Não inferir a fórmula do ranking só pela composição. |
| `IMG-20261015-WA0227.jpg` | Arena da Tempestade | Outra aba/grupo do ranking, com pontuação, classificação e botão Desafio. | CONFIRMADO VISUALMENTE. Testar regras de combate e limites de desafio. |
| `IMG-20261015-WA0230.jpg` | Loja / pacote de viaturas | Pacote combinado de veículos modificados, recursos e materiais, preço e tentativas restantes. | CONFIRMADO VISUALMENTE. Registrar como monetização; não usar preços como economia obrigatória do nosso jogo. |
| `IMG-20261015-WA0231.jpg` | Loja / pacote de viaturas | Variante de pacote combinado com quantidades de itens diferentes. | CONFIRMADO VISUALMENTE. Comparar diferenças entre ofertas e segmentação de preço. |
| `IMG-20261015-WA0232.jpg` | Loja / equipamento exclusivo | Oferta de pacote de seleção de equipamento exclusivo, itens e preço. | CONFIRMADO VISUALMENTE. Não presumir que o item é garantido sem ler as condições completas. |
| `IMG-20261015-WA0233.jpg` | Loja / pacote personalizado | Ofertas raras/épicas com slots para escolher recursos, tentativas e preços. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: seleção livre, restrições e atualização da oferta. |
| `IMG-20261015-WA0234.jpg` | Loja / especiais diários | Ofertas diárias associadas a herói e itens; pacotes com preços escalonados. | CONFIRMADO VISUALMENTE. Identificar reset diário e limite por conta. |
| `IMG-20261015-WA0235.jpg` | Loja / desconto | Pacotes de fragmentos de equipamento, núcleos de energia e cristais com preço. | CONFIRMADO VISUALMENTE. Captura mostra ofertas, não prova valor esperado ou vantagem real. |
| `IMG-20261015-WA0236.jpg` | Loja / promoção de personagem | Promoção de personagem/companheiro com itens e preço de pacote. | CONFIRMADO VISUALMENTE. Mapear o que é garantido versus aleatório. |
| `IMG-20261015-WA0237.jpg` | Loja / passes | Passe mensal e passe semanal, recompensas imediatas/diárias e validade. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: calendário de resgate e regras após expiração. |
| `IMG-20261015-WA0238.jpg` | Loja / recursos | Pacotes de chips e fragmentos de equipamento com preço e tentativas. | CONFIRMADO VISUALMENTE. Registrar recursos e quantidades em tabela própria. |
| `IMG-20261015-WA0239.jpg` | Loja / passes semanais | Passe semanal de mascote e cartão semanal de veículo modificado. | CONFIRMADO VISUALMENTE. Confirmar recompensas diárias e se acumulam ao não resgatar. |
| `IMG-20261015-WA0240.jpg` | Loja / passes semanais | Cartão semanal de tecnologia e de equipamento. | CONFIRMADO VISUALMENTE. Mesmas questões de reset e resgate. |
| `IMG-20261015-WA0241.jpg` | Loja / ofertas por item | Pacote de peças de precisão, fragmentos de equipamento exclusivo e aceleração. | CONFIRMADO VISUALMENTE. Captura mostra preço/quantidade; não inferir conversão em dinheiro sem contexto. |
| `IMG-20261015-WA0242.jpg` | Loja / passes semanais | Cartão semanal de equipamento e cartão de tempo. | CONFIRMADO VISUALMENTE. Mapear durações e recursos em catálogo de economia. |
| `IMG-20261015-WA0243.jpg` | Loja / ofertas especiais | Planta DX, item de aceleração, chegada do herói e pesquisa tecnológica. | CONFIRMADO VISUALMENTE. Distinguir compra direta de bônus promocional. |
| `IMG-20261015-WA0244.jpg` | Loja / ofertas especiais | Pacotes de recursos de construção, materiais de veículo e engrenagens. | CONFIRMADO VISUALMENTE. Quantidades devem ser transcritas em planilha separada se forem necessárias para simulação. |
| `IMG-20261015-WA0245.jpg` | Loja / ofertas especiais | Treinamento de tropas, chips de veículo modificado e diagramas de design. | CONFIRMADO VISUALMENTE. Não confundir moeda premium com material de melhoria. |
| `IMG-20261015-WA0246.jpg` | Loja / ofertas especiais | Núcleo de energia, medalhas de sabedoria e pacote de alimentos. | CONFIRMADO VISUALMENTE. Catalogar custo e itens. |
| `IMG-20261015-WA0247.jpg` | Loja / ofertas especiais | Livros de habilidade, ruptura de pet, ração tática avançada e material de equipamento. | CONFIRMADO VISUALMENTE. Verificar usos alternativos de cada item. |
| `IMG-20261015-WA0248.jpg` | Loja / ofertas especiais | Livros de habilidade, moedas e portfólio de recursos. | CONFIRMADO VISUALMENTE. Não usar dados de oferta como taxa de drop. |
| `IMG-20261015-WA0249.jpg` | Evento / manual de desenvolvimento de heróis | Calendário de recompensas por dia com fragmentos, recursos e itens de evolução. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: requisitos, dia perdido e reinício do evento. |
| `IMG-20261015-WA0250.jpg` | Loja / moeda premium | Pacotes escalonados de moeda premium com quantidades e preços diferentes. | CONFIRMADO VISUALMENTE. Usar apenas para estudar a estrutura de monetização, não como necessidade de design. |
| `IMG-20261015-WA0251.jpg` | Tropas / detalhes | Modal de tropas com abas Tropas, Tropas de defesa, Tropas de combate e Reservista; capacidade, unidades por tipo e conversão de soldados. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: feridos, mortos, reservas e conversão. |
| `IMG-20261015-WA0252.jpg` | Tecnologia | Árvore/grade de tecnologias por categoria com níveis e percentuais de progresso. | CONFIRMADO VISUALMENTE. Capturar cada tecnologia, requisitos e bônus por nível. |
| `IMG-20261015-WA0253.jpg` | Tropas / extração e substituição | Modal de tropas com barra de capacidade e botões Extrair/Substituir. | CONFIRMADO VISUALMENTE. Testar impacto na formação, capacidade e recuperação. |
| `IMG-20261015-WA0254.jpg` | Construção / quartel de reserva | Melhoria de nível 30 para 1 estrela; aumento projetado de capacidade; custos de recursos e tempo longo. | CONFIRMADO VISUALMENTE. Registrar pré-requisitos e tempos; a captura é de uma conta avançada. |
| `IMG-20261015-WA0255.jpg` | Construção / centro militar | Melhoria de nível 4 para 5 estrelas, capacidade de soldados e tropas, requisito de torre de vigia e custos/temporizador. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: relação entre níveis de edifícios e capacidade total. |
| `IMG-20261015-WA0258.jpg` | Torre de Vigia / ranking | Ranking de sobreviventes por nível de Torre de Vigia. | CONFIRMADO VISUALMENTE. Testar desempate e atualização do ranking. |
| `IMG-20261015-WA0259.jpg` | Poder de combate | Painel detalhado com categorias e totais de poder de combate. | CONFIRMADO VISUALMENTE. Comparar a composição com outras capturas sem expor conta. |
| `IMG-20261015-WA0260.jpg` | Rankings | Página de rankings por categorias de poder, heróis, tropas e outros sistemas. | CONFIRMADO VISUALMENTE. Regras de atualização e escopo regional precisam de teste. |
| `IMG-20261015-WA0261.jpg` | Rankings | Outra parte do catálogo de rankings, incluindo poder pessoal e classificação de heróis. | CONFIRMADO VISUALMENTE. Catalogar cada ranking e seu critério. |
| `IMG-20261015-WA0262.jpg` | Ranking de abates pessoais | Lista de classificação por abates. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: contagem, período e elegibilidade. |
| `IMG-20261015-WA0263.jpg` | Rankings de zona | Painel com poder de aliança, poder pessoal, classificação de heróis e abates. | CONFIRMADO VISUALMENTE. Distinguir ranking da zona e da zona cruzada. |
| `IMG-20261015-WA0272.jpg` | Poder da aliança | Ranking de alianças por poder. | CONFIRMADO VISUALMENTE. Verificar atualização, membros contabilizados e critérios de desempate. |
| `IMG-20261015-WA0279.jpg` | Duelo da Aliança — Dia 6 | Objetivos de derrotar inimigo, acelerar, derrotar tropas de nível baixo e eliminar tropas aliadas em combate. | CONFIRMADO VISUALMENTE. Pontuação depende da tarefa e do contexto do evento. |
| `IMG-20261015-WA0280.jpg` | Duelo da Aliança — Dia 5 | Continuação de objetivos de desenvolvimento global, incluindo chips, medalhas e regulamentos de treinamento. | CONFIRMADO VISUALMENTE. Comparar com capturas do mesmo dia para evitar duplicar pontos. |
| `IMG-20261015-WA0281.jpg` | Duelo da Aliança — Dia 6 | Objetivos de escoltar caminhão de ouro, executar operação de sabedoria e acelerar. | CONFIRMADO VISUALMENTE. PRECISA DE TESTE: condições de elegibilidade e limites. |
| `IMG-20261015-WA0282.jpg` | Duelo da Aliança — Dia 1 | Objetivos de desenvolvimento de abrigo, poder de tecnologia, medalha e aceleração de construção/pesquisa. | CONFIRMADO VISUALMENTE. Separar pontos por ação e quantidade. |
| `IMG-20261015-WA0283.jpg` | Duelo da Aliança — Dia 3 | Objetivos de escoltar caminhão de ouro, operação de sabedoria, consumir núcleo de energia e abrir baú de herói. | CONFIRMADO VISUALMENTE. Confirmar limites e janela do evento. |
| `IMG-20261015-WA0284.jpg` | Duelo da Aliança — Dia 2 | Objetivos de formação de heróis: evento de radar, fragmentos de equipamento exclusivo e recrutamento avançado. | CONFIRMADO VISUALMENTE. Verificar se o evento concede pontos por tentativa ou sucesso. |
| `IMG-20261015-WA0285.jpg` | Duelo da Aliança — Dia 2 | Continuação de tarefas de recrutamento e promoção de heróis por raridade. | CONFIRMADO VISUALMENTE. Separar pontos por cor/raridade. |
| `IMG-20261015-WA0286.jpg` | Duelo da Aliança — Dia 5 | Objetivos de chips, medalhas, regulamentos de treinamento e materiais de construção. | CONFIRMADO VISUALMENTE. Reconciliar tarefas repetidas entre capturas. |
| `IMG-20261015-WA0287.jpg` | Duelo da Aliança — Dia 3 | Objetivos de Planta DX, aceleração de treinamento e promoção de soldados. | CONFIRMADO VISUALMENTE. Testar se acelerar e concluir naturalmente pontuam de forma diferente. |
| `IMG-20261015-WA0288.jpg` | Duelo da Aliança — Dia 1 | Objetivos de desenvolvimento do abrigo e tecnologia, medalhas e acelerações. | CONFIRMADO VISUALMENTE. Captura de uma conta avançada; não define estado inicial de um jogador novo. |

## Descobertas consolidadas até aqui

### A. Viaturas e chips

- A tela de modificação apresenta quatro slots de chip organizados ao redor de um núcleo de ressonância, além de quatro páginas/conjuntos numerados.
- A fábrica de chips separa inventário e fabricação; a fabricação de um chip observado requer material e permite escolher quantidade.
- O jogo exibe chances para baús por raridade e por resultado. As probabilidades mostradas são **declarações da interface**, não uma medição independente do RNG.
- Há chips de ataque, defesa e outras classes; efeitos declarados incluem dano de tropa, dano adicional de unidade, dano de habilidade da viatura, vida e redução/escudo.

### B. Heróis, equipamentos e tropas

- As formações visíveis usam cinco posições de herói em torno de uma viatura e têm abas para heróis e soldados.
- As telas de herói separam atributos, habilidade e evolução de estrelas; o equipamento usa quatro slots visíveis nas capturas analisadas.
- Existem abas de tropas para tropas comuns, defesa, combate e reserva, com controles de extração, substituição e conversão.
- Os números de poder observados são de uma conta avançada e **não devem ser usados como valores iniciais** para novos jogadores.

### C. Base e tecnologia

- O poder de combate é apresentado em categorias distintas: edifícios, tecnologia, tropas, heróis, veículos modificados e agente/pet.
- As telas de melhoria mostram nível atual, nível/estrela de destino, atributos projetados, custos, pré-requisitos e duração.
- Os tempos e custos observados variam por construção; precisamos de capturas sequenciais de vários níveis para derivar tabelas de progressão confiáveis.

### D. Eventos, ranking e economia

- O Duelo da Aliança apresenta tarefas específicas por dia, cada uma com pontuação associada a consumos, upgrades, combate ou missões.
- Existem rankings separados para poder, heróis, tropas, abates, Torre de Vigia e poder de aliança.
- A loja inclui pacotes de recursos, equipamentos, chips, tecnologia, aceleração, passes semanais/mensais e ofertas personalizadas. Isso é evidência da estrutura comercial, não uma recomendação para reproduzir monetização agressiva.

## O que ainda não pode ser concluído a partir destas capturas

1. Fórmula completa de dano, mitigação, crítico, ordem de turnos, alvo e efeitos de status.
2. Fórmula de poder e critérios para classificações por letras.
3. Fórmula geral de custo/tempo por nível e todos os pré-requisitos de construções.
4. Probabilidade real de baús, pity, proteção contra azar e independência de tentativas.
5. Regra completa de ressonância de chips e acumulação de bônus.
6. Algoritmo de pareamento, atualização e reset de rankings/eventos.
7. Persistência, sincronização, regras de servidor e comportamento offline.

Esses itens ficam como **PRECISA DE TESTE**. Uma captura estática não revela lógica interna por si só.

## Próxima etapa recomendada

1. Auditar a pasta `screenshots/` e comparar os nomes reais com o catálogo, usando `WA0288` como maior identificador observado — não como contagem total.
2. Registrar lacunas na sequência, duplicatas (incluindo sufixos como `(1)`) e arquivos não catalogados, preservando os nomes originais.
3. Fazer uma segunda passagem para transcrever valores exatos em CSV: probabilidades, custos, bônus e pontos de evento.
4. Planejar testes controlados de combate, upgrades e baús com antes/depois e múltiplas amostras.
5. Transformar apenas regras bem sustentadas em especificações do Guerra Infinita; manter nomes, arte, código e balanceamento próprios.
