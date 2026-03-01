# Infinit War (Guerra Infinita) - Plano Mestre de Producao (Mobile 2.5D)

Este repositório agora possui um **pacote completo de planejamento técnico** para o jogo mobile 2.5D de estratégia e sobrevivência com city builder, heróis, PvE/PvP multiplayer e monetização equilibrada.

## Escopo funcional consolidado

- Base builder (cidade, upgrades, fila de construção, trabalhadores, hospital, quartel)
- Sistema de heróis (ATQ/DEF/Unidades, estrelas, ascensão, shards, skills)
- Eventos globais PvP e mapa mundial multiplayer
- Sistema de alianças (membros, rally, ajuda, objetivos coletivos)
- Temporizadores autoritativos no servidor
- VIP, ranking global e progressão sazonal
- PvE com zumbis/inimigos de mapa
- Energia/resistência com regeneração
- Loot e shards por atividades
- Monetização com gemas, loja, passe de batalha e live ops

## Decisões técnicas (baseline de produção)

- Cliente: **Unity LTS (URP)** + C#
- Backend principal: **Java/Spring** (serviços críticos e alta concorrência)
- Serviços de live-ops/admin: **Node.js**
- Banco transacional: **MySQL 8**
- Cache/locks/ranking quente: **Redis 7**
- Mensageria assíncrona: **Kafka/RabbitMQ**
- Infra: **AWS (EKS + RDS + ElastiCache + S3 + CloudFront + WAF)**
- Arquitetura: cliente-servidor autoritativa + anti-cheat em camadas

## Documentos criados (para nao se perder)

### 1) Backlog completo por sprint
- [Backlog tecnico por epicos e historias](docs/planning/BACKLOG_SPRINTS.md)
- [Kickoff de execucao (inicio do projeto)](docs/planning/KICKOFF_EXECUCAO.md)

### 2) Documento de API central
- [OpenAPI (REST)](docs/api/openapi.yaml)
- [gRPC Proto (servicos centrais)](docs/api/proto/core_services.proto)

### 3) Planilhas de balanceamento inicial (CSV)
- [Guia de balanceamento](docs/balance/BALANCEAMENTO_INICIAL.md)
- [Heroes](docs/balance/heroes_balance.csv)
- [Construcao](docs/balance/buildings_balance.csv)
- [Economia](docs/balance/economy_balance.csv)
- [Passe de batalha](docs/balance/battle_pass_balance.csv)

## Ordem recomendada de execução

1. Validar backlog e congelar escopo de MVP (Sprints 1 a 6)
2. Implementar contrato de API (OpenAPI + proto) e stubs
3. Integrar economia e timers servidor-autoritativos
4. Rodar tuning inicial com as planilhas de balanceamento
5. Entrar em alpha fechado com telemetria ativa

## Metas de entrega

- MVP funcional: 3 meses (S1-S6)
- Alpha: S7-S9
- Beta: S10-S11
- Release candidate/global prep: S12+

## Como usar estes artefatos

- Produto/Game Design: use `BACKLOG_SPRINTS.md` para planejamento e priorização
- Engenharia cliente/backend: implemente pelos contratos em `openapi.yaml` + `core_services.proto`
- Economia/LiveOps: ajuste valores nos CSVs e valide via KPIs (retenção, inflação, ARPDAU, win-rate)

## Validacao por etapas (recomendado)

Antes de cada nova etapa, rode:

- `npm run check:env`

O script valida automaticamente:

- Node.js e npm no PATH
- health da API (`/health`)
- porta local da API
- MySQL do XAMPP (binario, servico e consulta em `infinitwar.app_state`)
- Redis local (com aviso e fallback em memoria se ausente)

## Protecao de branch (GitHub)

Depois de conectar este projeto em um repositório GitHub:

- Instale GitHub CLI (uma vez):
  - `winget install --id GitHub.cli -e`
- Faça login:
  - `gh auth login`
- Aplique a proteção da branch principal com check obrigatório:
  - `npm run github:protect:main`
  - Ou sem `origin` configurado localmente:
  - `powershell -ExecutionPolicy Bypass -File scripts/setup-branch-protection.ps1 -Owner <owner> -Repo <repo> -Branch main`

Script usado:

- `scripts/setup-branch-protection.ps1`

---

Se necessário, o próximo passo é gerar automaticamente:
- tarefas no Jira/Linear a partir do backlog
- skeleton de serviços backend (controllers + DTOs + proto stubs)
- planilha com simulação de 90 dias de economia e inflação

