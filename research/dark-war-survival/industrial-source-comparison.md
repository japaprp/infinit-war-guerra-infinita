# Análise técnica de fontes públicas — calculadora de Peças de Precisão

**Projeto:** Guerra Infinita (jogo original)  
**Data:** 2026-10-15  
**Estado:** pesquisa comparativa; não é especificação definitiva de balanceamento.  
**Fonte analisada:** [topher-gits/dws505 — pp.html](https://github.com/topher-gits/dws505/blob/main/pp.html)  
**Fontes de comparação:** [Dark War Player Hub — Precision Parts](https://dw.zilo-project.com/tools/precision_parts) e [Dark-War.com — Industrial Watchtower calculator](https://www.dark-war.com/calculators/precision-parts).

## Resultado principal

O arquivo `pp.html` é uma calculadora comunitária estática: não tem backend nem dependências de build; mantém uma tabela de custo por estágio (“notch”) para 13 categorias de construção, multiplica por cinco estágios por tier e renderiza uma matriz Industrial 1–8. A interface guarda o tier selecionado no `localStorage`. Esses são padrões de implementação genéricos; o Guerra Infinita deve usar código, nomes, interface e dados próprios.

**Não importar a tabela de `pp.html` diretamente para o jogo.** Ao comparar os valores com o Player Hub, aparecem discrepâncias materiais para algumas construções e tiers. A página do repositório se descreve como ferramenta do estado 505, então os números podem ser específicos da comunidade/estado, estar incompletos ou conter erros. As fontes não permitem decidir automaticamente qual tabela está correta.

## Estrutura observada em `pp.html`

- `NOTCHES = 5`: cada tier tem cinco estágios.
- `BUILDINGS`: 13 rótulos genéricos de construção, incluindo Watch Tower, Troop buildings, Research center, Medical workshop, Construction hall, Radar, Training ground, Mart, Military center, Library, Alliance Plaza, Reservist camp e Guild.
- `PER_NOTCH`: matriz de custos por estágio para os tiers 1–8; zero significa que a tabela da página não cobra peças naquela combinação.
- O total por tier é calculado como custo por estágio × 5; a linha final soma todas as construções.
- A seleção de tier atualiza a tabela; o tier escolhido é salvo localmente no navegador.
- Não há requisitos de pré-construção, saldo de jogador, transação, persistência de conta, temporizadores de construção ou validação de servidor nessa calculadora. Ela é um visualizador de custos, não um modelo completo da lógica do jogo.

## Valores transcritos da fonte dws505

Os números abaixo são **peças por estágio**, não o total do tier. Um zero é mostrado na fonte como traço.

| Tier | Watch Tower | Troop buildings | Research center | Medical workshop | Construction hall | Radar | Training ground | Mart | Military center | Library | Alliance Plaza | Reservist camp | Guild |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 180 | 80 | 180 | 30 | 50 | 100 | 50 | 50 | 250 | 50 | 30 | 150 | 50 |
| 2 | 220 | 90 | 220 | 40 | 60 | 0 | 60 | 60 | 300 | 60 | 40 | 180 | 50 |
| 3 | 260 | 110 | 260 | 50 | 80 | 140 | 80 | 80 | 360 | 80 | 40 | 0 | 60 |
| 4 | 310 | 130 | 310 | 60 | 90 | 140 | 90 | 90 | 440 | 90 | 50 | 0 | 70 |
| 5 | 370 | 160 | 370 | 70 | 110 | 210 | 110 | 110 | 520 | 110 | 60 | 0 | 90 |
| 6 | 300 | 120 | 300 | 60 | 90 | 150 | 90 | 90 | 400 | 90 | 50 | 250 | 70 |
| 7 | 320 | 140 | 0 | 70 | 100 | 0 | 100 | 100 | 440 | 100 | 60 | 0 | 80 |
| 8 | 350 | 160 | 0 | 0 | 120 | 0 | 120 | 120 | 0 | 120 | 0 | 0 | 100 |

## Comparação e divergências que precisam ficar abertas

O Player Hub publica **totais por tier**, não valores por estágio. Quando a categoria parece corresponder, comparei o total comunitário com o valor de `pp.html × 5`. Nomes de edifícios podem não mapear perfeitamente, por isso esta comparação é um sinal de revisão e não prova, por si só, que uma das fontes está errada.

| Categoria aproximada | Tier | dws505 × 5 | Player Hub | Resultado |
|---|---:|---:|---:|---|
| Watchtower / Watch Tower | 1–8 | 900, 1.100, 1.300, 1.550, 1.850, 1.500, 1.600, 1.750 | mesmos valores | Concordância |
| Acampamento de tropa / Troop buildings | 1–8 | 400, 450, 550, 650, 800, 600, 700, 800 | mesmos valores para Fighter/Shooter/Raider Camps | Concordância nos custos, mas o rótulo dws505 agrupa os acampamentos |
| Centro de Pesquisa / Research center | 1–8 | 900, 1.100, 1.300, 1.550, 1.850, 1.500, 0, 0 | 900, 1.100, 1.300, 1.550, 1.850, 2.150, 2.300, 2.450 | Divergência em T6–T8 |
| Radar | 1–8 | 500, 0, 700, 700, 1.050, 750, 0, 0 | 500, 600, 700, 850, 850, 850, 850, 850 | Divergência em T2, T4–T8 |
| Reservist camp | 1–8 | 750, 900, 0, 0, 0, 1.250, 0, 0 | 750, 900, 1.100, 1.150, 1.200, 1.250, 1.300, 1.350 | Divergência em T3–T5 e T7–T8 |
| Military center | 1–8 | 1.250, 1.500, 1.800, 2.200, 2.600, 2.000, 2.200, 0 | 1.250, 1.500, 1.800, 2.200, 2.600, 2.000, 2.200, 2.400 | Divergência em T8 |
| Guild | 1–8 | 250, 250, 300, 350, 450, 350, 400, 500 | 250, 250, 250, 350, 450, 350, 400, 500 | Divergência em T3 |

**Importante:** as categorias comparáveis e valores do Player Hub foram conferidos na página pública no momento desta pesquisa. Antes de usá-los em balanceamento, conferir capturas do jogo. Não transformar os zeros da fonte dws505 em “custo gratuito” sem confirmação: podem significar dado ausente, construção não aplicável ao tier ou custo realmente zero.

## Regras seguras para Guerra Infinita

1. Guardar os custos em dados configuráveis e versionados, com campos separados para `source`, `confidence`, `building_id`, `tier_from`, `tier_to`, `stage`, `resource_costs` e `evidence_path`.
2. Representar o tier atual e o tier de destino explicitamente para evitar o erro de uma unidade entre “Industrial 4” e o custo da transição para Industrial 5.
3. Não usar um custo genérico para todas as construções.
4. Não inferir uma curva linear; a fonte publica quedas reais de custo em alguns tiers da Torre.
5. Não aceitar custos do cliente como verdade final. Ao implementar upgrades, o servidor deve verificar requisitos e saldo e aplicar dedução + incremento em uma única transação idempotente.
6. Exibir custos ausentes como “a confirmar” no painel de pesquisa, em vez de substituí-los por zero.
7. Manter moedas pagas e ofertas opcionais fora do caminho obrigatório de progressão; o jogo deve ser concluível sem compra.

## Plano de validação

- [ ] Conferir as capturas do repositório para os custos de Watchtower e de cada construção comparável.
- [ ] Registrar cada discrepância com arquivo de captura e tier de destino.
- [ ] Confirmar se os cinco estágios usam custo constante dentro do tier para cada construção.
- [ ] Confirmar requisitos e rotação de acampamentos em capturas sequenciais.
- [ ] Criar testes de tabela: total = soma dos cinco estágios; saldo insuficiente não altera dados; falha não cobra; repetição da mesma solicitação não cobra duas vezes; estado persiste após reabrir o jogo.
- [ ] Só então promover os valores validados para configuração de produção do Guerra Infinita.

## Referências

- https://github.com/topher-gits/dws505/blob/main/pp.html
- https://dw.zilo-project.com/tools/precision_parts
- https://www.dark-war.com/calculators/precision-parts
- https://ezpk1.ezpk322.com/tip/

**Licença/independência:** a pesquisa registra fatos e observações de fontes públicas para comparação; não copia a implementação HTML/JavaScript, a arte ou a identidade visual das ferramentas analisadas. Guerra Infinita terá sua própria implementação e seu próprio balanceamento.
