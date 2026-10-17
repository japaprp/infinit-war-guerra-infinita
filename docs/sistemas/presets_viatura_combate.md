# Presets de chips da viatura — regra de combate (Guerra Infinita)

Status: **implementação inicial em validação**.

## Regra original definida

- Existem quatro configurações salvas: I, II, III e IV.
- Somente o preset selecionado como ativo fornece bônus durante o cálculo dos atributos.
- Presets alternativos são configurações guardadas; seus chips não acumulam bônus enquanto estão inativos.
- Um mesmo chip físico pode ser referenciado em mais de um preset para facilitar a troca de configuração, mas só conta uma vez no preset ativo.
- Referências inválidas, chips ausentes do inventário e tipos de atributo não suportados são ignorados com segurança.
- O bônus de ataque é aplicado ao ATQ dos heróis; o bônus de vida/proteção é aplicado à quantidade de unidades, de acordo com a modelagem atual do protótipo.

## Fórmula do protótipo

O cálculo reutiliza a progressão já existente para os chips do Guerra Infinita:

`bônus percentual = percentual base do tipo + (nível - 1) × levelStepPct`

Cada entrada de `CHIP_CATALOG` define `basePct` e `levelStepPct`; mudar esses valores altera o balanceamento sem alterar o motor de combate. Os percentuais dos chips ativos são somados por atributo e aplicados como um multiplicador. Esta é uma regra provisória e configurável do **nosso jogo**, não uma afirmação sobre a fórmula completa de Dark War: Survival.

## Estado da ressonância

- O domínio calcula a prontidão quando os quatro espaços do preset ativo estão preenchidos.
- `ready` não significa que o bônus está ativo: `active` e `bonusApplied` permanecem `false` enquanto a regra original não estiver definida e validada.
- A interface comunica explicitamente essa distinção. Nenhuma fórmula ou probabilidade é inferida das capturas de referência.

## Arquivos

- `engine/chip-loadouts.js`: presets, slots, validação de referências e prontidão da ressonância.
- `engine/vehicle-chip-combat.js`: cálculo puro dos bônus do preset ativo.
- `engine/game.js`: catálogo configurável e integração com os atributos calculados dos heróis.
- `game.html`: carrega os helpers antes do motor de jogo.
- `tests/vehicle-chip-combat.test.mjs`: testes unitários de seleção, duplicação, dados ausentes e progressão configurável.
- `tests/vehicle-chip-loadouts.test.mjs`: testes de presets, duplicação, persistência de referência e prontidão sem bônus.
- `tests/client-persistence.test.mjs`: teste de navegador para persistência, mudança de ATQ ao trocar preset e reabertura.

## Validação pendente

- A suíte automatizada do GitHub Actions está sendo executada para este branch.
- O teste de navegador automatizado verifica que trocar de preset altera o ATQ visível e que o preset ativo persiste após fechar/reabrir.
- Ainda falta playtest manual no Electron e balanceamento com partidas controladas; não tratar os percentuais iniciais como balanceamento final.

## Separação entre referência e design próprio

A análise visual do jogo de referência informa que existem presets de chips, mas não comprova a fórmula integral dos bônus da viatura. A regra descrita aqui é uma decisão de design original para o Guerra Infinita.
