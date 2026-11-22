# Registro de probabilidades de baús — transcrição visual

**Branch:** `research/dark-war-survival-captures`  
**Estado:** transcrição parcial diretamente das capturas. Este documento não afirma que a chance exibida seja igual ao RNG efetivo. Os nomes de pool abaixo são provisórios quando a captura não mostra o nome do baú.

## 1. Captura IMG-20261015-WA0185.jpg — anúncio de probabilidade

| Campo | Transcrição | Estado |
|---|---|---|
| Cabeçalho | “Anúncio de Probabilidade” | Confirmado visualmente |
| Grupo | Chip laranja | Confirmado visualmente |
| Probabilidade do grupo | 0,2% | Confirmado visualmente / valor exibido |
| Itens individuais | Grade de chips laranja de diferentes classes/tropas | Parcial: alguns percentuais ficam encobertos pela notificação sobreposta |
| Linhas legíveis na parte inferior | Três itens de Cavalaria com 0,0166% cada (Módulo de Assalto, Campo de Supressão, Barreira Gravitacional); ícones de implantação também aparecem na grade | Confirmado para os números legíveis; rótulos de linhas encobertas pendentes |
| Grupo inferior | Chip roxo | Probabilidade do grupo exibida como 4,8% |
| Percentuais individuais do grupo roxo | Captura cortada antes de todas as linhas; não transcrever valores que não estejam legíveis | Pendente |

**Nota de qualidade:** uma notificação do jogo cobre parte da primeira linha/percentuais. Não deduzir o número de recompensas nem a soma a partir das linhas ocultas.

## 2. Captura IMG-20261015-WA0186.jpg — chips roxos e azuis

### Grupo roxo
- Probabilidade total exibida: **4,8%** (o cabeçalho está na captura anterior WA0185).
- A captura mostra 12 resultados roxos: 5 na primeira linha, 5 na segunda e 2 na terceira.
- Cada um dos 12 resultados exibe **0,4%**.
- Soma aritmética dos itens visíveis: 12 × 0,4% = **4,8%**, consistente com o total de grupo exibido. Isso confirma consistência aritmética da interface, não o RNG real.

### Grupo azul
- Probabilidade total exibida: **30,0%**.
- Quatro resultados azuis aparecem, cada um com **7,5%**.
- Soma aritmética: 4 × 7,5% = **30,0%**, consistente com o total exibido.

Os ícones azuis representam quatro tipos de chip/atributo distintos; os nomes textuais de cada chip não aparecem nesta captura e permanecem pendentes.

## 3. Captura IMG-20261015-WA0187.jpg — modal “Baú de chip verde”

| Campo | Transcrição |
|---|---|
| Nome do item selecionado | Baú de chip verde |
| Quantidade de baús verde no inventário | 4 |
| Quantidade de baús azul no inventário | 19 |
| Quantidade de baús roxo no inventário | 0 |
| Quantidade de baús laranja no inventário | 0 |
| Descrição | “Obter chips e 1 materiais de chip avançado” (gramática conforme exibida) |
| Quantidade selecionada para usar | 1 |
| Ação disponível | “Usar” |

A captura mostra o modal de seleção e a contagem no inventário. Ela **não mostra o resultado de uma abertura** e não permite inferir a distribuição real do baú verde.

## 4. Capturas IMG-20261015-WA0188.jpg a WA0193.jpg — detalhes de recompensas

As telas mostram a descrição “Após abrir, obtenha chips aleatórios e materiais avançados de chip” e listas roláveis. A identificação exata do baú/pool correspondente não está visível em todas as capturas; até vincular cada modal à seleção de origem, os dados ficam em grupos provisórios.

### Grupo provisório A — material avançado x1 (WA0189)

| Recompensa visível | Chance exibida | Quantidade |
|---|---:|---:|
| Material de chip avançado | 100,000% | x1 |
| Implantação Avançada — Guerreiro | 0,0167% | x1 |
| Módulo de Assalto — Guerreiro | 0,0167% | x1 |
| Campo de Supressão — Guerreiro | 0,0167% | x1 |
| Barreira Gravitacional — Guerreiro | 0,0167% | x1 |

A captura WA0189 mostra estas linhas legíveis. A lista continua para baixo, portanto não é uma transcrição completa do pool.

### Grupo provisório B — material avançado x5 (WA0190)

| Recompensa visível | Chance exibida | Quantidade |
|---|---:|---:|
| Material de chip avançado | 100,000% | x5 |
| Implantação Avançada — Guerreiro | 0,167% | x1 |
| Módulo de Assalto — Guerreiro | 0,167% | x1 |
| Campo de Supressão — Guerreiro | 0,167% | x1 |
| Barreira Gravitacional — Guerreiro | 0,167% | x1 |

A captura WA0190 mostra a linha de material parcialmente no topo e quatro linhas de chips legíveis. **Não combinar este grupo com o provisório A:** os números e a quantidade de material diferem por um fator de 10, podendo representar baús/pools diferentes.

### Linhas de Cavalaria visíveis em WA0188

| Recompensa visível | Chance exibida | Quantidade |
|---|---:|---:|
| Linha anterior parcialmente cortada, rótulo incompleto | 0,0166% | x1 (aparente; validar) |
| Módulo de Assalto — Cavalaria | 0,0166% | x1 |
| Campo de Supressão — Cavalaria | 0,0166% | x1 |
| Barreira Gravitacional — Cavalaria | 0,0166% | x1 |

A primeira linha está parcialmente escondida pelo limite superior da janela e não deve ser usada como transcrição confirmada do nome.

### Linhas de Atirador e Cavalaria visíveis em WA0191 e WA0193

- WA0191 mostra Implantação Avançada — Atirador, Módulo de Assalto — Atirador, Campo de Supressão — Atirador e Barreira Gravitacional — Atirador, todos com **0,0167%**, x1.
- WA0193 mostra as mesmas quatro recompensas de Atirador com **0,167%**, x1, e Implantação Avançada — Cavalaria com **0,166%**, x1.
- Essa diferença de uma casa decimal é importante: não normalizar 0,0167% para 0,167% nem assumir que são o mesmo pool. Manter WA0191 e WA0193 como pools separados até identificar os respectivos baús.

## 5. Inventário do baú azul — IMG-20261015-WA0192.jpg

| Campo | Transcrição |
|---|---|
| Categoria da tela | Especial |
| Item selecionado | Baú de chip azul |
| Quantidade exibida no inventário | 19 |
| Descrição | “Após abrir, obtenha aleatoriamente um chip de qualidade azul ou superior e 5 materiais avançados para chips” |
| Botões | “Detalhes” e “Usar” |

A promessa de qualidade e cinco materiais vem do texto da interface. A captura não comprova que o resultado real sempre segue a descrição nem define as chances por raridade.

## 6. Modelo de dados para implementação (não é ainda configuração de drop)

Cada linha futura deve conter:
- `source_file`
- `chest_id` (nosso ID próprio, sem copiar ID interno do jogo)
- `source_pool_label`
- `reward_label_observed`
- `reward_quantity`
- `probability_displayed_percent`
- `group_probability_displayed_percent` (quando existe)
- `source_visibility` = legível / parcial / encoberto
- `evidence_status` = confirmado visualmente / relatado na interface / precisa de teste
- `pool_identity_confidence`
- `notes`

## 7. Pendências antes de simular ou implementar probabilidades

1. Identificar qual baú abre cada lista de detalhes WA0188–WA0191 e WA0193.
2. Transcrever as linhas ocultas/cortadas de WA0185 e as linhas abaixo da área visível em WA0188–WA0193.
3. Confirmar se os percentuais são por abertura, se os grupos são mutuamente exclusivos e se há sistema de garantia (*pity*).
4. Somente depois, conferir a soma de cada pool. Não somar linhas de capturas que podem representar baús diferentes.
5. Fazer simulação estatística usando apenas uma tabela completa e identificada; a simulação verifica o código, não prova que o jogo original usa o mesmo RNG.


## 8. Revisão cruzada com a tabela do protótipo — 2026-10-16

Foi feita uma leitura do catálogo de evidências e da tabela `MODULE_CHEST_ODDS` em `engine/game.js`, branch `feat/chips-equipment-chests`.

### Distribuição exibida para o baú verde de referência

A transcrição consolidada do usuário registra:
- Laranja: 0,2% no total, distribuído por 12 itens (aprox. 0,0166667% cada).
- Roxo: 4,8% no total, 12 itens a 0,4% cada.
- Azul: 30% no total, 4 itens a 7,5% cada.
- Verde: 65% no total, 4 itens a 16,25% cada.
- Soma das categorias: 100%.

### O que o código do protótipo faz hoje

A tabela atual de `MODULE_CHEST_ODDS` contém:
- Lendário: 0,2%.
- Quatro resultados azuis: 7,5% cada (30% total).
- Um resultado chamado “Módulo avançado”: 30%.
- Materiais de módulo: 39,8%.

A soma também fecha 100%, mas **não é a mesma distribuição da interface de referência**: o protótipo não representa os 12 resultados roxos a 0,4% nem os quatro resultados verdes a 16,25%; em vez disso, reserva 30% a um resultado agregado e 39,8% a materiais. Essa diferença é aceitável apenas se a tabela for intencionalmente balanceamento original do Guerra Infinita e a UI a identificar como tal. Não a descrever como reprodução do baú verde de Dark War.

### Decisão de engenharia

Não alterar automaticamente a tabela de balanceamento original só para igualá-la à referência. Antes de implementar a tabela completa no nosso jogo, definir explicitamente qual é o objetivo:
1. **Pesquisa fiel do baú observado:** armazenar os 32 resultados e suas probabilidades exibidas como dados de referência, sem ativá-los como drop de produção.
2. **Baú original de Guerra Infinita:** criar um pool próprio, com nomes, raridades, probabilidades e recompensas próprias; garantir soma de 100% e rotulagem clara.
3. **Teste de simulação:** executar testes contra o pool selecionado e verificar pesos, limites e persistência; isso valida o nosso código, não o RNG do jogo comercial.

### Critérios para o registro de cada recompensa

Cada item precisa de ID interno original, nome exibido/transcrito, raridade, classe/facção, quantidade, chance individual, chance total da raridade, arquivo de origem, legibilidade e confiança da associação. As chances devem ser armazenadas com precisão decimal suficiente e arredondadas apenas na interface. Não misturar pools diferentes só porque seus nomes ou ícones parecem semelhantes.
