# Era Industrial — comparação de custos comunitários

**Status da evidência:** referência comunitária externa; não é documentação oficial do publisher. Não tratar estes valores como confirmados por captura do jogo até comparar com as imagens originais.

## Fonte primária desta tabela comunitária

- Calculadora “505 Precision Parts”, repositório público: https://github.com/topher-gits/dws505/blob/main/pp.html
- A própria página informa que cada tier tem cinco estágios (*notches*) e calcula o total como custo por estágio × 5.
- A tabela implementada no código cobre tiers 1–8. Ela não fornece tiers 9–10; não extrapolar nem preencher lacunas por estimativa.

## Torre de Vigia — custo por estágio e total por tier

| Tier | Peças por estágio | Total (5 estágios) | Observação |
|---|---:|---:|---|
| I1 | 180 | 900 | Comunitário |
| I2 | 220 | 1.100 | Comunitário |
| I3 | 260 | 1.300 | Comunitário |
| I4 | 310 | 1.550 | Comunitário |
| I5 | 370 | 1.850 | Compatível com o relato do jogador; ainda comparar com captura |
| I6 | 300 | 1.500 | O custo cai em relação a I5; não presumir progressão monotônica |
| I7 | 320 | 1.600 | Comunitário |
| I8 | 350 | 1.750 | Comunitário |
| I9 | — | — | Não listado na tabela consultada |
| I10 | — | — | Não listado na tabela consultada |

## Custos por estágio publicados pela fonte

Valores abaixo seguem a ordem das construções declarada no código da calculadora: Torre de Vigia (*Watch Tower*), edifícios de tropas (*Troop buildings*), centro de pesquisa, oficina médica, salão de construção, radar, campo de treinamento, mercado, centro militar, biblioteca, praça da aliança, acampamento de reservistas e guilda.

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

**Legenda:** “—” significa que a calculadora não lista custo de Peças de Precisão para aquela construção naquele tier; não significa necessariamente que o jogo não exija outros materiais ou pré-requisitos.

## Interpretação segura

1. A sequência da Torre de Vigia é **900 → 1.100 → 1.300 → 1.550 → 1.850 → 1.500 → 1.600 → 1.750** de I1 a I8.
2. O custo por estágio da Torre de Vigia atinge 370 em I5 e cai para 300 em I6. Logo, não usar uma fórmula de crescimento linear para estimar tiers seguintes.
3. A fonte consultada publica dados somente até I8. Valores I9/I10 devem ficar pendentes até encontrar outra fonte e/ou captura verificável.
4. A página é uma ferramenta comunitária mantida em repositório público, não fonte oficial. Pode haver diferenças entre versões, servidores ou atualizações.
5. Requisitos de pré-construção, acampamento e salão/guilda não são estabelecidos por esta tabela de custo. Registrar esses requisitos separadamente e somente como “observados” quando houver captura; caso contrário, citar a fonte específica e marcar como comunitário.

## Próxima validação com as capturas do jogador

- Confirmar se o nível atual mostrado é Torre de Vigia I4 e se a próxima melhoria exibe **370 Peças de Precisão por estágio / 1.850 no total**.
- Registrar em linhas separadas custo por estágio, total do tier, materiais secundários e pré-requisitos.
- Não inferir probabilidades de baús, ressonância de chips ou custos de outras construções a partir desta tabela.
