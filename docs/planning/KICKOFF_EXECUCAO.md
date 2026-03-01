# KICKOFF DE EXECUCAO - Infinit War (Guerra Infinita)

Este documento inicia a execucao real do projeto com passos objetivos e entregaveis de curto prazo.

## Objetivo dos proximos 14 dias

- Consolidar baseline tecnica cliente + backend
- Fechar vertical slice jogavel (base -> combate PvE -> recompensa)
- Deixar contratos de API prontos para expansao de sistemas (alianca/PvP/ranking)

## Sprint 0 (Kickoff tecnico) - Checklist

### 1) Infra local e padroes
- [ ] Definir branch model (`main`, `develop`, `feature/*`)
- [ ] Definir convencao de commits (`feat`, `fix`, `chore`, `docs`)
- [ ] Configurar lint/format para frontend e backend
- [ ] Configurar validacao de OpenAPI/proto em CI

### 2) Backend baseline
- [ ] Separar `backend/src/index.js` em modulos (`auth`, `player`, `shop`)
- [ ] Adicionar camada de repositorio para persistencia
- [ ] Implementar middleware de idempotencia para compra
- [ ] Adicionar rate limit por `IP + userId`

### 3) Cliente baseline
- [ ] Centralizar constantes de jogo (`keys`, `timers`, `economia`) em um modulo
- [ ] Criar camada de `state sync` com retries exponenciais
- [ ] Exibir estado de conectividade online/offline no HUD
- [ ] Criar fallback de UX para backend indisponivel

### 4) Balance e telemetria
- [ ] Instrumentar eventos: login, coleta, combate, compra, upgrade
- [ ] Validar guardrails de inflacao usando `docs/balance/economy_balance.csv`
- [ ] Definir painel de KPI: D1, D7, ARPDAU, faucet/sink

## Vertical Slice (definicao)

### Entrada
- Jogador autenticado e com base inicial

### Loop
1. Iniciar construcao
2. Aguardar timer autoritativo
3. Coletar recurso
4. Lutar PvE
5. Receber loot/shards
6. Evoluir heroi

### Saida
- Estado salvo no backend
- Relatorio de progresso exibido na UI

## Definition of Done (Sprint 0)

- Build desktop inicia sem erro
- Backend responde `health`, `auth`, `state`, `purchase`
- Pelo menos 10 testes automatizados cobrindo fluxo critico
- Vertical slice completo funcionando ponta a ponta
- Documentacao atualizada (README + changelog)

## Riscos imediatos

1. Acoplamento alto em `engine/game.js`
- Mitigacao: extrair modulos por dominio (hero, combat, ui, map, economy)

2. Persistencia local JSON no backend
- Mitigacao: preparar migracao para MySQL/Redis em Sprint 1

3. Ausencia de testes automatizados
- Mitigacao: iniciar suite minima de API e simulacao de economia

## Comandos rapidos

- Rodar cliente desktop:
  - `npm install`
  - `npm run dev`

- Rodar backend:
  - `cd backend`
  - `npm install`
  - `npm run dev`

## Proximo passo recomendado

- Implementar `Sprint 1 - Fundacao tecnica` do backlog em `docs/planning/BACKLOG_SPRINTS.md`.
