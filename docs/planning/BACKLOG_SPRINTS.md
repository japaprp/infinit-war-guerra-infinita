# Backlog Tecnico por Epicos e Historias (Estimativa por Sprint)

## Premissas

- Duracao de sprint: **2 semanas**
- Capacidade media da equipe: **48 a 60 pontos por sprint**
- Escala de estimativa: Fibonacci (1, 2, 3, 5, 8, 13)
- Time base: Game Designer (1), Unity Dev (2), Backend Dev (2), 3D Artist (2), UI Designer (1), QA (1)

## Epicos

- E1. Core Client/Server e infraestrutura
- E2. Sistema de herois (atributos, estrelas, ascensao, shards)
- E3. City builder (construcao, fila, trabalhadores)
- E4. PvE (zumbis/inimigos e loot)
- E5. Mapa mundial multiplayer
- E6. PvP e rally
- E7. Alianças
- E8. Economia e monetizacao (gemas, VIP, loja)
- E9. Ranking global
- E10. UI/UX mobile + tutorial
- E11. Observabilidade, anti-cheat e seguranca
- E12. LiveOps (eventos, passe de batalha)

---

## Sprint 1 (Fundacao tecnica)

Objetivo: bootstrap de projeto, arquitetura base e persistencia inicial.

| ID | Historia | Criterio de aceite | SP |
|---|---|---|---:|
| S1-01 | Setup Unity URP mobile baseline | Build Android/iOS com FPS estavel em cena vazia | 5 |
| S1-02 | Estrutura de pastas e ScriptableObjects base | Assets organizados + exemplos funcionando | 3 |
| S1-03 | Backend gateway + auth JWT | Login, refresh e validacao de token funcionais | 8 |
| S1-04 | MySQL schema inicial (users/heroes/buildings/inventory) | Migracoes aplicadas com rollback | 8 |
| S1-05 | Redis cache + lock distribuido por jogador | Conflitos de escrita bloqueados por userId | 5 |
| S1-06 | API de sync de estado do jogador | Cliente recebe snapshot versionado | 8 |
| S1-07 | Telemetria basica (login/session/error) | Eventos enviados e consultaveis em dashboard | 5 |
| S1-08 | Pipeline CI/CD inicial | Build + testes + deploy staging automaticos | 8 |
| **Total** |  |  | **50** |

## Sprint 2 (Loop de cidade - base)

Objetivo: construcoes e progresso autoritativo de servidor.

| ID | Historia | Criterio de aceite | SP |
|---|---|---|---:|
| S2-01 | Sistema de edificios e slots da cidade | Construir em slot valido e persistir | 8 |
| S2-02 | Inicio e conclusao de construcao com timer server-side | `start_build` e `complete_build` sem dependencia de relogio local | 8 |
| S2-03 | Upgrade de edificio com custo por nivel | Custos debitados corretamente e auditados | 5 |
| S2-04 | Fila de construcao (1 slot) | Nao permite sobreposicao invalida | 5 |
| S2-05 | HUD de recursos/timers | Interface atualiza por delta de servidor | 5 |
| S2-06 | Sistema de trabalhadores (worker lock) | Worker ocupa/libera corretamente | 8 |
| S2-07 | Salvamento offline e reconciliacao | Reabrir app e estado consistente | 5 |
| S2-08 | Testes de concorrencia de build | Sem race condition em chamadas simultaneas | 8 |
| **Total** |  |  | **52** |

## Sprint 3 (Herois - progressao)

Objetivo: herois com atributos, nivel, estrelas, ascensao e shards.

| ID | Historia | Criterio de aceite | SP |
|---|---|---|---:|
| S3-01 | Modelo de dados de heroi e formulas de poder | Power reproduzivel no cliente e servidor | 8 |
| S3-02 | Sistema de nivel de heroi | Level up com custos e caps aplicados | 5 |
| S3-03 | Estrelas e consumo de shards | Star up bloqueado sem shards necessarios | 8 |
| S3-04 | Ascensao com requisitos e novo cap | Ascensao libera novos limites | 8 |
| S3-05 | Habilidades ativas/passivas nivelaveis | Efeito de skill escalando por nivel | 8 |
| S3-06 | Tela de herois (cards, detalhes, squad) | UX completa com comparacao de stats | 5 |
| S3-07 | Balance pass inicial de herois | Curva sem outliers extremos | 5 |
| S3-08 | Testes de integridade economica em upgrades | Sem duplo gasto em retry/replay | 5 |
| **Total** |  |  | **52** |

## Sprint 4 (PvE + loot)

Objetivo: combate PvE contra zumbis/inimigos, energia e recompensas.

| ID | Historia | Criterio de aceite | SP |
|---|---|---|---:|
| S4-01 | Spawn de inimigos PvE por regioes | Densidade por tile e respawn validos | 5 |
| S4-02 | Simulador de combate PvE server-side | Resultado autoritativo e deterministico | 8 |
| S4-03 | Sistema de energia/resistencia | Consumo, regen e cap funcionando | 5 |
| S4-04 | Sistema de loot table + shards | Drops respeitam probabilidades e pity rules | 8 |
| S4-05 | Hospital para feridos PvE | Conversao de baixas em feridos + cura | 8 |
| S4-06 | Quartel (treino de unidades) | Treino por lote com tempo/custos | 8 |
| S4-07 | UI de combate e relatorio | Report de batalha legivel e rastreavel | 5 |
| S4-08 | Anticheat de acao por minuto | Bloqueio e flag de comportamentos anormais | 5 |
| **Total** |  |  | **52** |

## Sprint 5 (Mapa mundial multiplayer)

Objetivo: mapa global com coordenadas, marchas e sincronizacao eficiente.

| ID | Historia | Criterio de aceite | SP |
|---|---|---|---:|
| S5-01 | Grid global + coordenadas (x,y) | Tiles e entidades consultaveis por janela | 8 |
| S5-02 | Interest management (AOI) | Cliente recebe apenas area relevante | 8 |
| S5-03 | Marcha para coleta/ataque | ETA calculado server-side | 8 |
| S5-04 | Protecao inicial de novato | Regras de escudo aplicadas em PvP | 5 |
| S5-05 | WebSocket de eventos de mapa | Atualizacao em tempo real com reconexao | 8 |
| S5-06 | Sharding de mapa por realm/zone | Escala horizontal com roteamento correto | 8 |
| S5-07 | Cache de mapa em Redis | Latencia p95 dentro de meta | 5 |
| **Total** |  |  | **50** |

## Sprint 6 (MVP hardening)

Objetivo: fechar MVP de 3 meses com estabilidade e economia minima.

| ID | Historia | Criterio de aceite | SP |
|---|---|---|---:|
| S6-01 | Loja de gemas e compras server-side | Compra idempotente e auditavel | 8 |
| S6-02 | Sistema VIP (niveis e beneficios) | Beneficios aplicados por regras | 5 |
| S6-03 | Ranking global por poder/PvE | Leaderboard atualizado periodicamente | 8 |
| S6-04 | Protecao anti replay em endpoints criticos | Nonce e janela de timestamp ativos | 5 |
| S6-05 | Polimento UX mobile + tutorial inicial | Onboarding completo para novo jogador | 8 |
| S6-06 | Suite de testes de regressao do MVP | Casos criticos automatizados | 8 |
| S6-07 | Performance pass (draw calls/memoria/FPS) | Metas de device medio atingidas | 8 |
| **Total** |  |  | **50** |

---

## Sprint 7 (Alpha - Aliancas)

| ID | Historia | Criterio de aceite | SP |
|---|---|---|---:|
| S7-01 | Criar/entrar/sair de alianca | Regras de permissao aplicadas | 5 |
| S7-02 | Cargos e permissoes internas | Lider/oficiais/membros funcionando | 5 |
| S7-03 | Chat de alianca em tempo real | Mensagens persistidas e moderacao basica | 8 |
| S7-04 | Ajuda de construcao entre membros | Reducao de tempo com limite diario | 8 |
| S7-05 | Tecnologia de alianca | Buffs aplicados corretamente | 8 |
| S7-06 | Metas coletivas semanais | Progresso e recompensa por alianca | 8 |
| S7-07 | Dashboard de alianca no cliente | UX de membros, poder e atividade | 5 |
| **Total** |  |  | **47** |

## Sprint 8 (Alpha - PvP e Rally)

| ID | Historia | Criterio de aceite | SP |
|---|---|---|---:|
| S8-01 | Ataque PvP baseline | Combate e perdas autoritativos | 8 |
| S8-02 | Rally com janela de entrada | Participacao multi-membros validada | 8 |
| S8-03 | Relatorio PvP detalhado | Logs de dano/perdas/recompensas | 5 |
| S8-04 | Balance de combate por brackets de poder | Matchmaking evita esmagamento extremo | 8 |
| S8-05 | Protecao anti abuse de rally | Cooldowns e limites aplicados | 5 |
| S8-06 | Eventos PvP globais (MVP) | Pontuacao e rewards sazonais | 8 |
| S8-07 | Ajustes de rede e latencia em batalha | p95 aceitavel em regiao alvo | 8 |
| **Total** |  |  | **50** |

## Sprint 9 (Alpha - Economia e observabilidade)

| ID | Historia | Criterio de aceite | SP |
|---|---|---|---:|
| S9-01 | Telemetria economica (faucet/sink) | Dashboard com inflacao por recurso | 8 |
| S9-02 | Parametros remotos de balance | Alteracao sem update do app | 5 |
| S9-03 | Alertas de fraude/economia anomala | Alertas com thresholds configuraveis | 8 |
| S9-04 | Segmentacao de ofertas na loja | Regras por perfil e progressao | 8 |
| S9-05 | Ajuste fino de energia e loops diarios | Melhora de D1/D7 em testes internos | 5 |
| S9-06 | QA de carga (20k conexoes simuladas) | Sem degradacao critica de servico | 13 |
| **Total** |  |  | **47** |

---

## Sprint 10 (Beta - Passe e LiveOps)

| ID | Historia | Criterio de aceite | SP |
|---|---|---|---:|
| S10-01 | Passe de batalha (free/premium) | XP, tiers e resgates funcionando | 8 |
| S10-02 | Missoes diarias/semanas/evento | Rotacao e reset servidor-autoritativos | 8 |
| S10-03 | Calendario de eventos sazonais | Ativacao por feature flag e horario | 8 |
| S10-04 | Ferramenta admin de live ops | Publicacao segura de configuracoes | 8 |
| S10-05 | Integracao push notifications | Alertas de fila pronta/evento | 5 |
| S10-06 | Testes anti pay-to-win extremo | Delta de eficiencia dentro de limite alvo | 5 |
| **Total** |  |  | **42** |

## Sprint 11 (Beta - Qualidade e compliance)

| ID | Historia | Criterio de aceite | SP |
|---|---|---|---:|
| S11-01 | Hardening de seguranca (WAF/rate limit/policies) | Ataques comuns mitigados | 8 |
| S11-02 | LGPD/GDPR baseline (consentimento e export) | Fluxo auditavel e funcional | 5 |
| S11-03 | Crash analytics e ANR triage | Taxa de crash abaixo de meta | 8 |
| S11-04 | Otimizacao final de memória mobile | Sem OOM em devices alvo | 8 |
| S11-05 | Testes de regressao full + smoke pre-release | Cobertura dos fluxos criticos | 8 |
| S11-06 | Playtest externo e correcoes prioritarias | Issues P0/P1 resolvidas | 8 |
| **Total** |  |  | **45** |

## Sprint 12 (Release candidate / Global prep)

| ID | Historia | Criterio de aceite | SP |
|---|---|---|---:|
| S12-01 | Soft-launch tuning (economia/retencao) | Ajustes aprovados por KPI | 8 |
| S12-02 | Escalabilidade para 100k DAU | Plano de capacidade validado | 13 |
| S12-03 | Runbook de operacao 24/7 | Incident response e on-call definidos | 5 |
| S12-04 | Pacote de lancamento global | Build, stores, configuracoes e monitoramento | 8 |
| S12-05 | Plano de conteudo de 90 dias pos-launch | Eventos, banners, passe e calendario | 8 |
| **Total** |  |  | **42** |

---

## Resumo por fase

- MVP (S1-S6): **306 SP**
- Alpha (S7-S9): **144 SP**
- Beta (S10-S11): **87 SP**
- Release prep (S12): **42 SP**
- **Total geral: 579 SP**

## Riscos principais e mitigacao

1. Escopo excessivo no MVP
- Mitigacao: congelar backlog de S1-S6 e tratar extras via feature flag.

2. Desbalanceamento economico em soft launch
- Mitigacao: telemetria de faucet/sink + tuning semanal com guardrails.

3. Lag no mapa mundial
- Mitigacao: AOI + sharding por realm + cache Redis + testes de carga cedo (S9).

4. Fraude/exploit em monetizacao
- Mitigacao: endpoints idempotentes, assinatura de requests, auditoria append-only.
