# Pesquisa de referência pública — Dark War: Survival

**Objetivo:** analisar sistemas de jogo observáveis em fontes públicas para orientar *Guerra Infinita*, um jogo original. Este documento não é uma extração do cliente, do código, dos arquivos privados ou dos assets de Dark War: Survival.

**Limite de evidência:** wikis e guias da comunidade podem estar incompletos, desatualizados ou conter opiniões. Percentuais, valores de combate, taxas de drop e progressão só devem ser considerados confirmados quando medidos em jogo por observação repetível ou publicados oficialmente. Não copiar nomes, personagens, textos, arte, mapas ou layouts específicos; usar somente ideias gerais de mecânicas e criar implementação/identidade próprias.

## Fontes públicas consultadas

1. [Dark War Survival Wiki (Fandom)](https://dark-war-survival.fandom.com/wiki/Dark_War_survival_Wiki) — wiki colaborativa com páginas de heróis, estruturas, eventos e recursos.
2. [Dark War Survival Data](https://darkwardata.com/) — catálogo comunitário de heróis, itens e eventos.
3. [SyncWars — Dark War 201: A Deeper Dive](https://www.syncwars.com/dark-war-201-a-deeper-dive/) — guia de comunidade sobre heróis, sinergia, equipamentos, pesquisa, tropas, eventos e progressão.
4. [Reddit — New player, season 1 tips](https://www.reddit.com/r/darkwarsurvival/comments/1ps35i1/new_player_season_1_tips/) — experiência comunitária sobre equipamento, fragmentos, recursos e eficiência free-to-play.
5. [Reddit — Tips](https://www.reddit.com/r/darkwarsurvival/comments/1v81jbn/tips/) — discussão comunitária sobre progressão, eventos, pesquisa e recursos.
6. [Z-War — mapas mundiais e sazonais](https://z-war.icu/posts/dark-war-world-season-territory-maps/) — ferramenta comunitária que descreve mapa mundial, mapas de temporada, minimapa, zonas e planejamento territorial.

## Mecânicas recorrentes identificadas nas fontes

### 1. Progressão de conta e abrigo
- A progressão combina nível da base/torre, construções, produção de recursos, pesquisa e desbloqueio gradual de sistemas.
- Melhorar apenas o nível geral não basta: prédios de suporte, capacidade militar, pesquisa e economia precisam acompanhar.
- Para nosso jogo: introduzir um abrigo/base original com edifícios de funções distintas, requisitos claros e tempos/custos exibidos antes da confirmação.

### 2. Heróis, habilidades e fragmentos
- Heróis têm atributos, raridade, estrelas/fragmentos e habilidades; sinergia e função importam além de um único número de poder.
- Guias aconselham concentrar recursos na formação principal em vez de distribuir tudo igualmente por muitos heróis.
- Para nosso jogo: heróis originais com funções (defensor, dano, suporte), habilidades ativas/passivas, fragmentos e explicação da sinergia. Balancear por simulação, não copiar personagens ou estatísticas específicas.

### 3. Equipamentos
- Equipamento é um sistema de progressão de longo prazo; qualidade, nível e bônus alteram o desempenho.
- Os guias diferenciam equipamento defensivo para linha de frente e ofensivo para dano; recursos raros devem ser tratados como gargalo.
- Para nosso jogo: slots e bônus já iniciados na implementação; falta validar a fórmula de atributos no combate, definir limites de melhoria/desmontagem e adicionar comparação de item atual versus item novo.

### 4. Recursos, energia e exploração PvE
- Energia é uma restrição de ritmo; combate/exploração pode render recursos e itens.
- Fontes comunitárias citam recursos provenientes de construções, exploração, tarefas e eventos.
- Para nosso jogo: definir uma economia coerente, recompensas por faixa de dificuldade e limites anti-farm; o saldo deve ser alterado por funções centrais e validado no backend.

### 5. Baús e recompensas aleatórias
- Baús aparecem como um canal de recompensas em vários sistemas/eventos.
- As fontes abertas consultadas não confirmam probabilidades universais que possamos tratar como as taxas internas do jogo original. Taxas podem variar por tipo de baú/evento/servidor.
- Para nosso jogo: manter probabilidades próprias, visíveis antes de abrir; adicionar registro de testes estatísticos com grande amostra, garantia de recompensa após sequência de azar (pity) somente se desejado e um histórico de resultados. Nunca apresentar odds simuladas como odds oficiais do jogo de referência.

### 6. Eventos, alianças e mapas
- As fontes descrevem eventos recorrentes, objetivos com janela de tempo, recompensas, cooperação de alianças e disputas territoriais.
- Mapas de mundo/temporada usam regiões, zonas e minimapa para orientar planejamento.
- Para nosso jogo: primeiro consolidar expedições PvE individuais; depois adicionar pontos de interesse, níveis de ameaça, objetivos por região e eventos diários. Alianças/PvP ficam para uma fase posterior, pois exigem servidor e regras de integridade mais robustas.

### 7. Economia e monetização
- Guias comunitários descrevem moedas premium, baús/eventos, fragmentos, equipamento raro e sistemas que aceleram progressão. Isso pode criar pressão de gasto e diferenças grandes entre jogadores.
- Para nosso jogo: priorizar progressão jogável sem pagamento, compras nunca devem ser necessárias para completar a campanha, mostrar taxas/custos claramente e não usar timers artificiais para pressionar compras. Nenhum serviço pago será ativado sem autorização explícita.

## Estado atual de Guerra Infinita

### Implementado na branch de desenvolvimento
- Novo jogador local/backend começa com um herói e recursos premium/econômicos zerados, preservando energia inicial.
- Inventário de equipamentos, slots, bônus e chance configurada de drop após vitória.
- Baús de explorador e tabela de recompensas configurável.
- Painel de expedição com destinos/objetivos, marcadores no mapa/minimapa, temporizador e persistência local.
- Endpoints v1 para iniciar e resgatar expedições; o servidor valida destino/objetivo, desconta energia, controla o tempo, calcula recompensas e mantém ledger de IDs resgatados.
- Teste de integração adicionado para tempo de servidor, saldo e rejeição de resgate duplicado.

### Probabilidades atualmente configuradas no nosso protótipo — não são dados de Dark War: Survival
- Vitória contra criatura → equipamento: 20%.
- Vitória contra criatura → baú de explorador: 10%.
- Conteúdo do baú: recursos 55%, fragmentos 30%, equipamento 15%.
- Raridade dos equipamentos gerados: comum 72%, raro 23%, épico 5%.

Esses números são decisões provisórias de balanceamento para Guerra Infinita. Ainda precisam de avaliação estatística, não devem ser descritos como taxas do jogo de referência.

## Pendências prioritárias

1. **Confirmar CI:** aguardar a execução da suíte de integração no HEAD mais recente; corrigir falhas antes de marcar a etapa como aprovada.
2. **Verificar integração real cliente-servidor:** testar login, iniciar expedição, fechar/reabrir o jogo, aguardar retorno e resgatar com rede disponível.
3. **Testes de saldo:** registrar ouro, prata/metal, alimento e energia antes/depois; testar recurso insuficiente, destino inválido, objetivo incompatível, temporizador ainda ativo e resgate repetido.
4. **Persistência e migração:** confirmar que saves antigos sem os novos campos carregam corretamente; verificar conflito entre save local e snapshot do servidor.
5. **Economia de equipamento/baús:** simular dezenas de milhares de aberturas/vitórias, comparar frequência observada com odds configuradas e revisar progressão por raridade.
6. **Combate e IA:** validar se bônus de equipamento realmente alteram dano/defesa; documentar fórmulas e criar testes determinísticos.
7. **Arte original:** criar pipeline gratuito de sprites/conceitos originais para heróis, criaturas, baús, ícones e regiões; não extrair nem redistribuir assets do jogo comercial.
8. **Teste real de reabertura:** executar no navegador/dispositivo, porque sintaxe e CI do backend não comprovam a experiência visual completa.
9. **Revisão da PR:** manter em rascunho até que as verificações funcionais sejam registradas.

## Plano de pesquisa adicional

- Catalogar cada tela/print fornecido pelo usuário com: tela, ação, estado antes/depois, regra observada, hipótese, confiança e teste necessário.
- Para cada hipótese, separar **observado**, **inferido** e **não confirmado**.
- Repetir experimentos controlados com a mesma conta/nível sempre que possível, registrando resultados e amostras; não tentar contornar autenticação, acessar servidores privados ou extrair conteúdo protegido.
- Atualizar este documento com fontes, data de consulta e evidência, sem confundir a referência comercial com a implementação original.
