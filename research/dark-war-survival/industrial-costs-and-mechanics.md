# Era Industrial — comparação de custos comunitários

**Status da evidência:** referências comunitárias externas; não são documentação oficial do publisher. Valores só devem ser marcados como confirmados no jogo quando houver captura correspondente.

## Fontes consultadas

1. Calculadora “505 Precision Parts”, código público: https://github.com/topher-gits/dws505/blob/main/pp.html
   - O código declara cinco estágios (*notches*) por tier e calcula o total como custo por estágio × 5.
   - A tabela deste repositório cobre I1–I8.
2. Calculadora “Precision Parts Calculator”, Dark War Survival Player Hub: https://dw.zilo-project.com/tools/precision_parts
   - O site declara que usa dados enviados pela comunidade DWSI Discord.
   - Lista totais até I10 para várias construções.
3. Calculadora “Industrial Watchtower Upgrade Requirements”: https://www.dark-war.com/calculators/precision-parts
   - Afirma usar custos transcritos de painéis do jogo e rechecados por jogadores. A própria página registra que alguns valores ainda não foram fotografados e que houve correção de rotação de acampamentos em 14 de setembro de 2026.

## Torre de Vigia — custo por tier

| Tier | Por estágio | Total (5 estágios) | Evidência |
|---|---:|---:|---|
| I1 | 180 | 900 | Duas calculadoras comunitárias concordam |
| I2 | 220 | 1.100 | Duas calculadoras comunitárias concordam |
| I3 | 260 | 1.300 | Duas calculadoras comunitárias concordam |
| I4 | 310 | 1.550 | Duas calculadoras comunitárias concordam |
| I5 | 370 | 1.850 | Duas calculadoras comunitárias concordam; dark-war.com observa que o custo I5 ainda não foi fotografado |
| I6 | 300 | 1.500 | Duas calculadoras comunitárias concordam; dark-war.com diz que o valor de 300 por estágio foi confirmado no jogo |
| I7 | 320 | 1.600 | Duas calculadoras comunitárias concordam |
| I8 | 350 | 1.750 | Duas calculadoras comunitárias concordam; dark-war.com diz que o valor de 350 por estágio foi confirmado no jogo |
| I9 | 400* | 2.000 | Total publicado por dw.zilo-project.com e dark-war.com; 400 é o total ÷ 5, não valor por estágio diretamente citado aqui |
| I10 | 450* | 2.250 | Total publicado por dw.zilo-project.com e dark-war.com; 450 é o total ÷ 5, não valor por estágio diretamente citado aqui |

* I9/I10: o custo por estágio é derivado aritmeticamente do total comunitário, e deve ser rotulado como cálculo derivado, não como transcrição direta de uma captura.

## Custos por estágio publicados por top​her-gits/dws505 (I1–I8)

Ordem das construções conforme o código da calculadora: Torre de Vigia (*Watch Tower*), edifícios de tropas (*Troop buildings*), centro de pesquisa, oficina médica, salão de construção, radar, campo de treinamento, mercado, centro militar, biblioteca, praça da aliança, acampamento de reservistas e guilda.

| Construção | I1 | I2 | I3 | I4 | I5 | I6 | I7 | I8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Torre de Vigia | 180 | 220 | 260 | 310 | 370 | 300 | 320 | 350 |
| Edifícios de tropas | 80 | 90 | 110 | 130 | 160 | 120 | 140 | 160 |
| Centro de pesquisa | 180 | 220 | 260 | 310 | 370 | 300 | — | — |
| Oficina médica | 30 | 40 | 50 | 60 | 70 | 60 | 70 | — |
| Salão de construção | 50 | 60 | 80 | 90 | 110 | 90 | 100 | 120 |
| Radar | 100 | — | 140 | 140 | 210 | 150 | — | — |
| Campo de treinamento | 50 | 60 | 80 | 90 | 110 | 90 | 100 | 120 |
| Mercado | 50 | 60 | 80 | 90 | 110 | 90 | 100 | 120 |
| Centro militar | 250 | 300 | 360 | 440 | 520 | 400 | 440 | — |
| Biblioteca | 50 | 60 | 80 | 90 | 110 | 90 | 100 | 120 |
| Praça da aliança | 30 | 40 | 40 | 50 | 60 | 50 | 60 | — |
| Acampamento de reservistas | 150 | 180 | — | — | — | 250 | — | — |
| Guilda | 50 | 50 | 60 | 70 | 90 | 70 | 80 | 100 |

**Legenda:** “—” significa que essa calculadora não lista custo de Peças de Precisão para aquela construção naquele tier; não prova que a construção não exija outros recursos ou pré-requisitos.

## Custos I9–I10: limites e divergências

A calculadora do Player Hub publica estes totais:

| Construção | I9 | I10 |
|---|---:|---:|
| Torre de Vigia | 2.000 | 2.250 |
| Acampamento (Fighter/Shooter/Raider) | 1.100 | 1.500 |
| Centro militar | 2.900 | 3.500 |
| Praça da aliança | 500 | 650 |
| Oficina médica | 500 | 750 |
| Salão de construção | 650 | 750 |
| Radar | 1.250 | 1.500 |
| Centro de pesquisa | 2.100 | 2.500 |
| Mercado / Campo de treinamento / Biblioteca | 650 | 750 |
| Guilda | 600 | 750 |

**Divergência documentada:** outra tabela comunitária, EZPK TIP (https://ezpk1.ezpk322.com/tip/), informa Guilda I10 = **700**, enquanto o Player Hub informa **750**. Não escolher silenciosamente um dos números; manter a diferença aberta até validar por captura. As fontes não demonstram que todos os servidores ou versões usem exatamente os mesmos valores.

## Pré-requisitos da Torre de Vigia: fonte separada

A página https://www.dark-war.com/calculators/precision-parts relata que cada tier da Torre de Vigia depende de três construções: a própria Torre, um acampamento de facção e a Guilda/Alliance Hall; o acampamento e a Guilda devem estar um tier abaixo do alvo. Ela relata a rotação Fighter → Shooter → Rider, repetindo a cada três tiers. A própria página identifica essa rotação como corrigida em 14/09/2026. Tratar isso como **relato comunitário com evidência de painéis citada pela página**, não como observação direta nossa, até confrontar com as capturas do projeto.

## Conclusões que podem ser usadas agora

1. A sequência de custo total da Torre de Vigia I1–I8 é **900 → 1.100 → 1.300 → 1.550 → 1.850 → 1.500 → 1.600 → 1.750**.
2. O custo diminui de I5 para I6; não usar uma fórmula linear para projetar os próximos tiers.
3. Os totais da Torre de Vigia I9 = 2.000 e I10 = 2.250 aparecem em duas calculadoras comunitárias. Isso é concordância entre fontes comunitárias, não confirmação oficial.
4. A tabela por construção de top​her-gits/dws505 só cobre I1–I8. Para I9/I10, usar as outras fontes e marcar a proveniência.
5. Não inferir probabilidades de baús, ressonância de chips ou custos de outras construções a partir da tabela da Torre.

## Próxima validação com as capturas do jogador

- Conferir se a tela atual é Torre de Vigia I4 e se o próximo tier mostra **370 Peças de Precisão por estágio / 1.850 no total**.
- Para cada captura, registrar separadamente custo por estágio, total do tier, recursos secundários, pré-requisitos e nome exato da construção.
- Se uma captura divergir, priorizar a evidência visual datada e registrar servidor/versão quando disponíveis; não apagar silenciosamente a divergência comunitária.
