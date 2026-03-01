# Balanceamento Inicial (Heroes, Construcao, Economia, Passe)

Este guia explica como usar os CSVs de balance inicial.

## Arquivos

- `heroes_balance.csv`: base de herois (stats, crescimento, shards por estrela, item de ascensao)
- `buildings_balance.csv`: curva de custos/tempo/ganho de poder por edificio e nivel
- `economy_balance.csv`: metas diarias de renda, energia, faucet/sink de gemas e guardrail de inflacao
- `battle_pass_balance.csv`: XP por tier e recompensa de trilha free/premium

## Formulas de referencia

### 1) Herois

- Stat base por nivel:
  `Stat(L) = Base + Growth * (L - 1)^1.06`
- Multiplicador de estrela:
  `M_star = 1 + 0.11*(s-1) + 0.015*(s-1)^2`
- Multiplicador de ascensao:
  `M_asc = 1 + 0.18*a`
- Poder aproximado:
  `Power = 0.42*ATQ + 0.33*DEF + 7.5*UNITS + SkillScore`

### 2) Construcao

- Custo por nivel:
  `Cost(n) = BaseCost * r_cost^(n-1)`
- Tempo por nivel:
  `Time(n) = BaseTime * r_time^(n-1)`
- `buildings_balance.csv` foi gerado com `r_cost` entre `1.18` e `1.23`, e `r_time` entre `1.20` e `1.25`.

### 3) Economia

- Receita/hora:
  `Income(n) = Income0 * r_income^(n-1)`
- Recompensa PvE:
  `PvEReward(n) = Reward0 * r_pve^(n-1)`
- Guardrail de inflacao:
  `Inflation = Faucet_7d / Sink_7d` (meta: `0.90` a `1.10`)

### 4) Passe de batalha

- XP incremental por tier:
  `XP_inc(t) = 80 + 16 * t^1.08`
- XP acumulado:
  `XP_total(t) = sum(XP_inc(1..t))`

## Metas operacionais sugeridas

- D1: 35-40%
- D7: 14-18%
- D30: 6-9%
- Delta de vantagem pagante no PvP competitivo: < 15%
- Inflacao de recursos: manter entre 0.90 e 1.10 por recurso

## Rotina de tuning (semanal)

1. Extrair KPIs (retenção, ARPDAU, faucet/sink, win-rate por faixa de poder)
2. Ajustar 1-2 variaveis por vez (ex.: custo de upgrade, drop de shard, gem sink)
3. Rodar A/B em um realm de controle
4. Validar impacto por 7 dias antes de novo ajuste amplo

## Observacoes

- O cliente nunca deve ser fonte de verdade para custo, tempo, drop e resultado competitivo.
- Ajustes de balance devem ser servidos por config remota e versionados.
- Sempre registrar mudancas de balance no changelog de live ops.
