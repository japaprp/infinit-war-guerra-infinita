# Pesquisa pública e comparação funcional — Dark War: Survival
**Data da revisão:** 2026-10-28  
**Projeto de destino:** Guerra Infinita (implementação original)  
**Branch de evidências:** `research/dark-war-survival-captures`

## Método e nível de confiança

- **CONFIRMADO OFICIALMENTE:** informação do Google Play ou da presença pública identificada como oficial.
- **CONFIRMADO VISUALMENTE:** elemento legível nas capturas próprias catalogadas em `index.md`.
- **CORROBORADO POR COMUNIDADE:** guia, wiki, calculadora ou relato comunitário; pode estar desatualizado ou conter erros.
- **HIPÓTESE / PRECISA DE TESTE:** comportamento que não pode ser provado por uma captura estática ou fonte secundária.
- Não descompilar, copiar código, arte, personagens distintivos, texto narrativo ou dados de conta. Usar a pesquisa para especificar mecânicas e construir uma apresentação original.

## Fontes públicas consultadas

1. Google Play — [Dark War Survival](https://play.google.com/store/apps/details?id=com.readygo.dark.gphh). A descrição do desenvolvedor apresenta os ciclos de atribuir tarefas a sobreviventes, coletar/explorar, construir e expandir o abrigo, recrutar/pesquisar e cooperar em alianças. A página indica Android e atualização em 16/10/2026. **Fonte de produto oficial para a descrição geral; não substitui observação de gameplay.**
2. Discord Discovery — [Dark War Survival](https://discord.com/servers/dark-war-survival-1263473266387845212). A página identifica o servidor como oficial e descreve discussões sobre progressão, builds de heróis, eventos sazonais e eficiência da base. **Fonte comunitária primária para descobrir relatos; conteúdo interno do servidor não foi presumido nem acessado por esta consulta pública.**
3. [Pocket Gamer — guia para jogadores F2P e pagantes](https://www.pocketgamer.com/dark-war-survival/guide/). Descreve ajuda de aliança para acelerar construções, radar e mapa-múndi com bases de outros jogadores, objetivos e coleta/saque. **Guia editorial independente; conferir versão e condições atuais no jogo.**
4. [Dark War Survival Fandom — Structures](https://dark-war-survival.fandom.com/wiki/Structures) e [Resources](https://dark-war-survival.fandom.com/wiki/Resources). Listas comunitárias de edifícios, desbloqueios e recursos. **Úteis para inventário inicial; não tomar níveis, nomes ou números como definitivos sem captura correspondente.**
5. [Dark-war.com — guia de progressão](https://www.dark-war.com/start), [calculadora da Torre de Vigia](https://www.dark-war.com/calculators/watchtower), [sistema de combate](https://www.dark-war.com/dps) e [temporadas](https://www.dark-war.com/seasons). Guias detalhados com progressão por Torre de Vigia, pré-requisitos, tropas, pesquisa, chips e temporadas. **Fonte comunitária/técnica, não documentação oficial do desenvolvedor; usar como pista e cruzar com capturas e outras fontes.**
6. [Dark War Survival Player Hub](https://dw.zilo-project.com/). Declara usar dados de DWSI Discord e convida jogadores a enviar capturas para melhorar a base de dados. **Agregador comunitário; rastrear origem e confiança de cada número.**
7. [Vantera — calculadoras de melhoria](https://vantera.app/pt-BR/calculators). Apresenta calculadoras para construções, pesquisa, equipamento, armas exclusivas, chips e veículo modificado, indicando a versão de cliente usada pelo serviço. **Fonte de comparação, não prova isolada de fórmulas internas.**

## Mecânicas corroboradas e implicações para a referência visual

### Dentro do abrigo / base
- O ciclo geral descrito na loja oficial é: atribuir tarefas a sobreviventes → coletar/explorar → construir e expandir → recrutar e pesquisar → colaborar em alianças.
- A captura `IMG-20261015-WA0158.jpg` registra base isométrica, construções com níveis, recursos no topo, atalhos de navegação e uma tarefa de exploração em progresso; `WA0160` mostra construção com temporizador.
- As fontes comunitárias listam edifícios funcionais como Torre de Vigia, serraria/madeira, sucata/metal, usina/energia, cabana de caça/comida, alojamento, portão, centro militar, rádio, radar, armazém, hospital, centro de pesquisa, salão da aliança e acampamentos de tropas. **A lista precisa ser conferida contra a versão do jogo e as capturas; não implementar todos de uma vez sem estabelecer a sequência de desbloqueio.**
- A Torre de Vigia é descrita por várias fontes comunitárias como um eixo de progressão que condiciona níveis/desbloqueios, acesso ao mapa e escalões de tropas. Isso é coerente com o papel de um prédio central, mas os números por nível devem ser transcritos das fontes visuais antes de serem usados como regra de jogo.

### Fora do abrigo / mapa-múndi
- O guia editorial independente descreve mapa aberto após desbloqueios do radar, bases de outros jogadores, objetivos externos e coleta/saque de recursos.
- O guia comunitário detalha ainda territórios/tiles sazonais, resistência, captura por alianças e sistemas industriais em temporadas posteriores. **Esses detalhes são dependentes da temporada/servidor e devem ser marcados como avançados, não como parte obrigatória do primeiro nível.**
- Para Guerra Infinita, preservar o fluxo de toque Abrigo ↔ Mundo e as interações do mapa já planejadas; adicionar deslocamento, seleção de alvo, expedição, coleta, ataque e agrupamento como ações distintas, com estados de carregamento/retorno e validação no servidor.

### Heróis, formação, viatura e chips
- As capturas `WA0155`–`WA0157` mostram quatro posições de chips em torno de um núcleo, quatro abas I–IV, seis posições de acessórios da viatura e formação com viatura central e cinco posições de herói.
- `WA0172`–`WA0175` registram valores de bônus e prévias de evolução exibidos na interface; `WA0176`–`WA0178` mostram inventário/fabricação; `WA0185`–`WA0193` mostram tabelas de probabilidades parcialmente legíveis.
- Os valores e probabilidades são transcrições de interface, não confirmação independente de RNG ou fórmula. Manter a origem de cada linha e nunca completar campos encobertos por cálculo especulativo.
- A comparação existente `equipment-chips-source-comparison.md` aponta uma lacuna concreta: o modelo antigo do protótipo não representava diretamente quatro posições de chip; a ressonância e as abas precisam de regra testável própria. A fórmula de bônus observada em dois níveis é apenas correspondência parcial, não regra universal.

## Comparação preliminar com a implementação de Guerra Infinita

Consulta estática da `frontend/public/game.html` na branch `feat/android-world-map-shell`:
- **Presente na estrutura HTML:** Abrigo, controles Mundo/Abrigo, painel de heróis, painel de acessórios da viatura e áreas de mapa/expedição.
- **Não evidenciado diretamente nesse HTML:** telas funcionais de Torre de Vigia e pré-requisitos, economia/produção de edifícios, Centro de Pesquisa/árvores de tecnologia, Radar, Aliança, filas de tropas e fluxo completo de captura de territórios. Isso é uma lacuna de evidência do arquivo consultado, não prova de que não exista lógica em outro módulo.
- **Prioridade visual:** a base precisa ser uma cena isométrica navegável com prédios clicáveis e níveis/temporizadores; o mapa deve ter uma camada de mundo separada, alvos selecionáveis, zoom/pan por toque e estados claros. Evitar resolver a semelhança apenas com botões textuais ou painéis genéricos.
- **Prioridade funcional:** cada elemento visível precisa executar uma ação real, persistir o estado e exibir feedback. Não apresentar um botão como funcional se ele apenas muda a aparência.

## Lacunas de pesquisa e validação

1. Duas imagens previstas na contagem histórica de 96 ainda não estão na pasta atual; 94 imagens estão catalogadas. Não inferir quais são as duas ausentes.
2. Fazer uma comparação visual tela a tela da base, mapa, construção, pesquisa, radar, alianças, formação e garagem com capturas de origem; registrar arquivo e coordenadas/área de interesse por observação.
3. Consultar atualizações e discussões públicas da comunidade oficial quando houver acesso verificável. Não afirmar que mensagens privadas de Facebook/Discord foram lidas se só a página pública foi acessível.
4. Verificar divergências entre guias, versões e temporadas antes de aceitar custos, desbloqueios ou probabilidades.
5. Proteger a privacidade: o catálogo já alerta que capturas originais podem conter identificadores de conta, aliança, zona e ranking. Não reutilizar esses valores como dados de Guerra Infinita e não republicar novas cópias sem anonimização.

## Próxima sequência técnica

1. Concluir a auditoria comparativa da base e do mapa contra as capturas `WA0158`, `WA0160` e demais imagens correspondentes; converter diferenças em critérios de aceite.
2. Fechar a persistência PostgreSQL isolada, mostrando claramente o estágio exato de qualquer falha; não considerar o teste completo apenas porque TLS e uma transação temporária passaram.
3. Validar o APK debug gerado no GitHub Actions no Galaxy S21. A compilação automatizada passou, mas a instalação e o teste físico ainda não estão confirmados.
4. Fazer smoke tests de login, expedição e persistência no frontend hospedado; o serviço está publicado, mas a verificação do navegador real ainda precisa de evidência.
5. Só depois de todos os critérios passarem, revisar as PRs em rascunho. Não mesclar nem publicar automaticamente.

## Infraestrutura — observação de 2026-10-28

- Supabase: o projeto `guerra-infinita-db` foi encontrado como `ACTIVE_HEALTHY`; não havia branches de desenvolvimento listadas no momento da consulta.
- Render: existe `infinit-war-api`, mas seu serviço continua configurado para a branch `fix/firebase-id-token-validation`; o site de validação `infinit-war-web-validation` foi publicado com sucesso a partir de `feat/android-world-map-shell`. A configuração do backend não foi alterada nesta revisão.
- GitHub: o workflow Android concluiu com sucesso e gerou o artefato `guerra-infinita-debug-apk`; a validação no dispositivo físico permanece pendente.
- Aiven: a chamada de inventário falhou internamente nesta sessão. Isso **não** prova ausência de projeto/serviço Aiven; a inspeção deve ser repetida quando o conector responder.
