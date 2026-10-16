# Pesquisa pública complementar — Era Industrial e evoluções

**Projeto:** Guerra Infinita (jogo original)  
**Data da pesquisa:** 2026-10-15  
**Escopo:** fontes públicas sobre Dark War: Survival para orientar uma especificação comportamental; não é cópia de código, arte, nomes ou balanceamento proprietário.  
**Regra de evidência:** separar texto observado em fonte pública, relato comunitário e hipótese. Conferir com capturas do projeto antes de transformar valores em regras definitivas.

## Fontes consultadas

1. **Calculadora comunitária de peças de precisão — Dark War Survival**
   - URL: https://www.dark-war.com/calculators/precision-parts
   - Tipo: guia/calculadora comunitária, não página oficial do desenvolvedor.
   - A página diz que foi corrigida em 14/09/2026 e afirma ter verificado no jogo alguns valores em painéis.
   - Confiança: média para orientar a conferência; valores não substituem as capturas originais do projeto.

2. **Guia comunitário inicial e progressão**
   - URL: https://www.dark-war.com/start
   - Tipo: guia comunitário.
   - Descreve Torre de Vigia 30 como ponto de entrada da Era Industrial e destaca tropas, pesquisa e heróis como sistemas de progressão.
   - Confiança: média; recomendações estratégicas do autor não são regras internas do jogo.

3. **Reddit — “Industry Building Priorities”**
   - URL: https://www.reddit.com/r/darkwarsurvival/comments/1rju86c/industry_building_priorities/
   - Tipo: relatos de jogadores.
   - Jogadores discutem Centro Militar, edifícios de facção, pesquisa, equipamento de herói, arma especial e chips de viatura. Um comentário menciona habilidades de tropas em Industrial 3, 5 e 8; outro menciona bônus significativos em Industrial 3 e 7. Isso é relato comunitário e precisa de verificação visual.
   - Confiança: baixa a média, útil para criar uma lista de telas a investigar, não para definir fórmulas.

4. **Reddit — “Which buildings should I prioritize for Ind?”**
   - URL: https://www.reddit.com/r/darkwarsurvival/comments/1t9ir7j/which_buildings_should_i_prioritize_for_ind/
   - Tipo: relatos de jogadores.
   - A discussão menciona acampamentos de tropas, Salão da Aliança/Guild, Plaza, Centro Militar, Centro de Pesquisa e Oficina de Motor como possíveis prioridades, com opiniões divergentes.
   - Confiança: baixa a média; prioridades são opiniões de jogadores, não requisitos oficiais.

5. **Reddit — “Which to focus on first?” (chips)**
   - URL: https://www.reddit.com/r/darkwarsurvival/comments/1s0x35u/which_to_focus_on_first/
   - Tipo: relatos de jogadores.
   - Jogadores descrevem chips de viatura, raridades, fabricação, estrelas e ressonância; recomendações divergem entre completar conjuntos e priorizar a formação principal.
   - Confiança: baixa a média; mecânicas exatas devem ser confrontadas com as telas do jogo.

6. **Busca por página oficial no Facebook**
   - Foram feitas buscas por página oficial e publicações públicas sobre Era Industrial/peças de precisão. Nesta rodada não foi possível verificar uma publicação oficial do Facebook que confirme os números industriais.
   - Estado: **não verificado**. Não atribuir a informação ao Facebook oficial sem URL/post verificável.

## Era Industrial — números publicados pela calculadora comunitária

A tabela da calculadora separa o custo da Torre de Vigia, dos acampamentos de tropas e do Salão da Aliança/Guild. Os valores abaixo são transcritos da página e precisam de conferência com as capturas do usuário.

| Tier mostrado pela fonte | Torre: por estágio | Acampamento: por estágio | Guild/Salão: por estágio | Torre ×5 | Acampamento ×5 | Guild ×5 |
|---|---:|---:|---:|---:|---:|---:|
| Industrial 1 | 180 | 80 | 50 | 900 | 400 | 250 |
| Industrial 2 | 220 | 90 | 50 | 1.100 | 450 | 250 |
| Industrial 3 | 260 | 110 | 60 | 1.300 | 550 | 300 |
| Industrial 4 | 310 | 130 | 70 | 1.550 | 650 | 350 |
| Industrial 5 | 370 | 160 | 90 | 1.850 | 800 | 450 |
| Industrial 6 | 300 | 120 | 70 | 1.500 | 600 | 350 |
| Industrial 7 | 320 | 140 | 80 | 1.600 | 700 | 400 |
| Industrial 8 | 350 | 160 | 100 | 1.750 | 800 | 500 |

**Cuidado com o rótulo do nível:** a calculadora usa a linha “Industrial 5” para a transição que custa 370 por estágio na Torre de Vigia. Isso coincide com o relato do usuário de estar no Industrial 4 e precisar de 370 × 5 = 1.850 para chegar ao 5. Portanto, no modelo do Guerra Infinita, guardar explicitamente o **nível atual** e o **nível de destino** evita erro de deslocamento de uma unidade.

A fonte relata que a Torre de Vigia pode exigir três pré-requisitos: ela própria, um acampamento de facção e a Guild/Salão da Aliança. A rotação de acampamentos indicada é Fighter → Shooter → Rider, repetindo por tier; a própria página reconhece que corrigiu a rotação em 14/09/2026. Tratar essa sequência como hipótese externa até conferir a tela de requisito no jogo.

A fonte também afirma que cada tier corresponde a cinco melhorias de construção e que o custo por estágio fica constante dentro do tier. Ela registra uma queda no custo da Torre de 370 no tier de destino Industrial 5 para 300 no Industrial 6, portanto **não extrapolar uma progressão linear simples**. Os valores para Industrial 9 e 10 não estão nesta tabela; não preencher sem novas evidências.

## Outras evoluções a investigar

### 1. Edifícios e tropas
- Torre de Vigia: requisito central para liberar a progressão industrial.
- Acampamentos de Fighters/Shooters/Riders: podem funcionar como pré-requisitos e afetar a força das tropas.
- Guild/Salão da Aliança e Plaza: citados por jogadores como parte da progressão/prioridades.
- Centro Militar: jogadores dizem que aumenta tamanho de marcha, mas consideram caro.
- Centro de Pesquisa: conferir árvores, requisitos, desbloqueios e bônus por nível.
- Hospital/reserva e construções de treinamento: conferir capacidade, feridos/reserva e requisitos.
- Capturar antes/depois de cada estágio para registrar custo de madeira, aço/ferro, energia, peças de precisão, duração, requisito e efeito.

### 2. Pesquisa tecnológica
- Mapear as árvores por facção/tipo de tropa e a separação entre ataque, defesa, dano, capacidade e desbloqueios.
- A comunidade recomenda focar a pesquisa no tipo de tropa principal, mas isso é estratégia de jogadores, não regra universal.
- Confirmar por capturas se Industrial 3/5/8 realmente libera habilidades e se Industrial 3/7 dá bônus adicionais.

### 3. Heróis
- Nível do herói, raridade, estrelas, fragmentos, habilidades e honra são trilhas distintas a modelar separadamente.
- Registrar requisitos de evolução, atributos antes/depois e habilidade desbloqueada; não presumir que poder mostrado revela a fórmula completa.
- Não copiar heróis, nomes, arte ou textos do jogo de referência.

### 4. Equipamento e arma especial
- Equipamento de herói: níveis, raridade, slots, estrelas/ascensão e materiais de melhoria.
- Arma/equipamento exclusivo: evolução própria e materiais específicos, segundo relatos comunitários.
- Conferir se o bônus afeta o herói, a tropa, a viatura ou a formação inteira.

### 5. Viaturas, acessórios e chips
- Viatura/acessórios: atributos, slots, raridade, materiais e efeitos.
- Chips: fabricação, raridade, nível/estrelas, ressonância e bônus de conjunto.
- Os jogadores relatam ganhos grandes de poder com chips e recomendam priorizar a formação principal, mas não há fórmula confirmada nestas fontes.
- Registrar probabilidades exatamente como aparecem na interface e separar odds declaradas de resultados observados.

### 6. Economia, eventos e recompensas
- Eventos diários/semanais podem conceder pontos por upgrades, consumos, recrutamento, combate e abertura de baús.
- Separar a regra permanente do jogo da regra temporária de cada evento.
- Não reproduzir ofertas pagas como requisito do Guerra Infinita; manter uma economia jogável sem pagamento obrigatório.

## Regras atuais para o Guerra Infinita (vindas do usuário)

- Progressão normal 1–30: sem peças de precisão.
- Depois do nível normal 30, começa Industrial 1–10.
- A etapa industrial tem cinco estágios; custo fixo por estágio dentro do tier; total = custo por estágio × 5.
- O usuário informou que, estando no Industrial 4, o custo da Torre/etapa que está subindo é 370 por estágio, totalizando 1.850 para chegar ao Industrial 5.
- Madeira, aço e energia também são exigidos e a dificuldade aumenta; seus custos devem ser registrados por construção/tier e não inventados.
- O usuário descreveu aumentos de 30 após o Industrial 6 e de 40 no Industrial 10; os valores para tiers 9–10 continuam sem confirmação pública nesta rodada. Não substituir esses relatos por extrapolação sem conferir a captura.
- Construções diferentes podem ter custos de peças diferentes; não aplicar a tabela da Torre a todas as construções.

## Próximo trabalho no repositório

1. Transcrever custos e requisitos industriais das capturas existentes em uma tabela estruturada, com coluna para arquivo de evidência, construção, tier atual, tier de destino, estágio (1–5), recursos, duração e efeito.
2. Comparar cada valor visual com a fonte comunitária; anotar divergências em vez de escolher silenciosamente uma delas.
3. Completar a investigação das outras trilhas: pesquisa, tropas, heróis, equipamento, arma exclusiva, viatura/chips e eventos.
4. Só então transformar dados verificados em configuração do jogo original e testes automatizados.
5. Manter a PR em rascunho, não mesclar automaticamente, e preservar a identidade original do Guerra Infinita.
