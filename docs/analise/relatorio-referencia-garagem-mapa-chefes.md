# Relatório técnico de referência visual — garagem, chips, mapa e chefes

**Projeto:** Guerra Infinita  
**Status:** análise preliminar baseada em relatos de quatro vídeos fornecidos pelo usuário e resumidos por uma ferramenta externa. A equipe não verificou diretamente os quadros originais nesta etapa.  
**Objetivo:** extrair padrões gerais de sistemas e requisitos de validação para um jogo original, sem reproduzir nomes, personagens, arte, interface exata, tabelas proprietárias ou progressão do jogo de referência.

## Como ler este relatório

- **Relatado:** detalhes descritos pelo usuário a partir dos vídeos.
- **Derivado:** cálculo aritmético feito a partir desses relatos; pode herdar erros de leitura do vídeo.
- **Hipótese:** interpretação possível que ainda precisa de evidência.
- **Decisão de design:** proposta para Guerra Infinita, não uma regra atribuída ao jogo de referência.

Os valores abaixo não são especificação final de balanceamento. A conta mostrada nos relatos já estava em estágio avançado; no Guerra Infinita, toda conta nova começa no nível 1.

## Vídeo 1 — garagem, viatura e acessórios

### Relatado
- A garagem exibia uma viatura evoluída e seis posições de acessórios.
- Os acessórios mostrados estavam em níveis altos (aproximadamente 23–26, conforme a transcrição).
- O relato descreveu marcos de poder de viatura e bônus percentuais crescentes, com exigências de nível de garagem e nível mínimo dos acessórios.
- A imagem foi descrita como uma viatura militar sobre esteiras, com armamento frontal e lançadores superiores. Esses detalhes servem apenas para compreender a categoria visual; não devem ser copiados como desenho.

### Derivado / cautela
- Os marcos percentuais e os custos elevados citados são dados de uma conta avançada e não determinam custos adequados para o início do nosso jogo.
- Não temos comprovação independente de todos os rótulos dos acessórios, nem da fórmula completa de poder.
- Poder de garagem, poder da viatura e soma dos atributos dos acessórios devem ser métricas separadas até a fórmula ser comprovada.

### Decisões para Guerra Infinita
- Manter entidades de acessório individuais, seis posições tipadas e evolução independente da viatura.
- Começar com inventário vazio e sem bônus herdados.
- Mostrar custo, requisito e prévia do atributo antes de confirmar uma melhoria.
- Usar silhueta, materiais, armamento e linguagem visual próprios.
- Testar a curva econômica desde o nível 1 antes de fixar custos de meio/fim de jogo.

## Vídeo 2 — chips, presets e baús

### Relatado
- Quatro presets de chips alternavam entre composições diferentes; cada um apresentava poder distinto.
- Um indicador visual de sincronia/resonância aparecia junto dos presets.
- O relato identificou um chip defensivo/de supressão com redução de dano de habilidade inimiga e duração por turnos.
- Foi transcrita uma tabela de probabilidades para um baú de chips, com raridades e quantidades de itens.
- O baú foi descrito como contendo um material garantido e um chip aleatório.

### Derivado / cautela
- Probabilidades individuais por item foram calculadas dividindo o peso da raridade pelo número de itens daquela raridade; não devem ser tratadas como probabilidades exibidas diretamente.
- Não foi confirmada a implementação interna, o algoritmo de sorteio nem a relação completa entre raridade, estrelas, materiais e poder.
- A regra de sincronia não está suficientemente comprovada para inferir fórmula, gatilho ou bônus.

### Decisões para Guerra Infinita
- Apenas o preset ativo contribui para os atributos de combate; os demais são planos guardados.
- Impedir consumo/evolução de chip que esteja equipado em herói ou reservado em qualquer preset.
- Exibir probabilidades de baús de forma clara e com soma de 100%, identificando se a tabela é por baú, categoria ou item.
- Manter Sincronia de Núcleo desativada até existir uma regra original, documentada e testada.
- Não copiar os nomes dos chips, os percentuais ou as probabilidades relatadas.

## Vídeo 3 — mapa, caça e formações

### Relatado
- O mapa mundial mostrava inimigos errantes em níveis diferentes e coordenadas.
- Um encontro de caça indicava custo de energia, chance de recompensa e itens de recurso.
- A tela de marcha mostrava cinco heróis, tropas e poder comparado com o alvo.
- O relato mencionou formações salvas e duração estimada da marcha.

### Derivado / cautela
- Um custo de energia e uma chance de recompensa são informações de interface relatadas; ainda não conhecemos todas as condições, limites diários ou regras de falha.
- Um valor de poder do inimigo pareceu destoar de outros números. Pode ser erro de leitura, arredondamento, estado da batalha ou peculiaridade da interface; não usar como regra.
- Não está confirmado como o poder final combina heróis, tropas, chips, viatura, tecnologias e bônus temporários.

### Decisões para Guerra Infinita
- Modelar inimigos do mapa como entidades com nível, posição, custo, estado e tabela de recompensa próprios.
- Separar formação salva de marcha em andamento; validar disponibilidade de tropas e energia antes de despachar.
- Mostrar estimativa de duração e composição antes da confirmação.
- Registrar custo, resultado, perda e recompensa no mesmo evento transacional.
- Usar nomes, coordenadas, heróis, arte e tabelas de recompensa originais.

## Vídeo 4 — chefe gigante e incursão de aliança

### Relatado
- Um chefe de grande porte exibia nível e poder recomendado.
- A preparação de incursão oferecia janelas de espera, lista de participantes e capacidade de tropas.
- O relato descreveu uma incursão com participantes contribuindo quantidades diferentes de tropas e um estado que impedia entrada tardia após a partida.
- O vídeo terminou sem confirmar claramente o resultado da batalha ou a distribuição de recompensas.

### Derivado / cautela
- O número de participantes e a contagem de tropas são estados de uma sessão, não necessariamente limites universais.
- Não estão confirmados o cálculo de dano coletivo, o consumo de energia por participante, a regra de cancelamento, a distribuição do prêmio, o tratamento de desconexões ou o que acontece quando o chefe sobrevive.
- Não inferir recompensa nem sucesso da incursão sem tela de resultado.

### Decisões para Guerra Infinita
- Criar estados explícitos: recrutando, preparação encerrada, em marcha, em combate, concluída e cancelada.
- Validar cada participante no momento da entrada e novamente antes da partida.
- Bloquear entradas após o fechamento, com mensagem clara.
- Tornar custos e critérios de recompensa auditáveis e idempotentes para evitar cobrança ou prêmio duplicado.
- Definir e testar regras de desconexão, ausência de participantes, derrota, vitória e chefe sobrevivente antes de implementar recompensas.

## Matriz de evidência e pendências

| Sistema | Evidência disponível | Ainda falta confirmar |
|---|---|---|
| Garagem/acessórios | Relato de seis posições e marcos de progressão | Fórmula completa de poder, requisitos exatos e custos iniciais |
| Chips/presets | Relato de quatro presets, efeitos e tabela de baú | Regra de sincronia e sorteio completo |
| Mapa/caça | Relato de alvos, energia, marcha e formações | Falha, limites, cálculo de poder e tabela completa de recompensa |
| Chefe/aliança | Relato de preparação, participantes e marcha | Tela de resultado, dano, consumo de energia e distribuição do prêmio |

## Plano de implementação sugerido

1. Concluir e manter verdes os testes de persistência e integração.
2. Adicionar testes econômicos de acessórios, inclusive saldos inválidos, inventário cheio, IDs duplicados e nível máximo.
3. Centralizar o cálculo de poder para que presets alternativos não sejam somados.
4. Projetar entidades e transições de estado para mapa/caça e incursão sem presumir regras não observadas.
5. Implementar combate e recompensa só após definir regras originais e testes de idempotência.
6. Registrar cada observação nova com sua fonte e nível de confiança.

## Limites desta análise

Este documento é uma síntese dos relatos fornecidos pelo usuário, não uma alegação de que os vídeos foram inspecionados diretamente. Os valores transcritos podem conter erro de leitura. A referência é usada para análise de categorias de sistemas e comportamento de interface; Guerra Infinita deve manter implementação, identidade visual, texto, nomes, personagens, balanceamento e conteúdo próprios.
