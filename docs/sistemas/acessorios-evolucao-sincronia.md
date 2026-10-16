# Acessórios, evolução da viatura e Sincronia de Núcleo

**Status:** proposta de design original; não é implementação concluída nem transcrição das regras de Dark War: Survival.

## Princípios

1. Todo jogador começa no nível 1, com garagem/viatura inicial, inventário vazio e sem bônus de fim de jogo.
2. Os quatro presets de chips são configurações alternativas; apenas o ativo afeta os atributos.
3. A evolução não pode consumir uma peça equipada em herói ou reservada em qualquer preset.
4. Custos, percentuais, nomes e efeitos do jogo de referência não serão copiados como balanceamento do Guerra Infinita.
5. Sincronia só concede bônus quando uma regra original, explícita e testável estiver definida. Até lá, não aplicar bônus de sincronia.

## Proposta de seis posições de acessórios

Nomes de trabalho, todos originais e sujeitos a teste de balanceamento:

| Posição | Função principal proposta | Atributo candidato |
|---|---|---|
| Propulsor | Mobilidade e ritmo de ataque | velocidade de ação / ATQ |
| Placas Reativas | Proteção da estrutura | DEF / redução de dano |
| Sensor Tático | Identificação de pontos vulneráveis | precisão / chance crítica |
| Esteiras Reforçadas | Estabilidade e avanço | vida de unidades |
| Núcleo de Potência | Distribuição de energia | ATQ / eficiência de habilidade |
| Módulo de Cerco | Capacidade contra estruturas | dano a estruturas |

A posição e a função são distintas para evitar seis cópias do mesmo bônus. Os nomes não reutilizam as denominações observadas no jogo de referência.

## Progressão proposta

Cada acessório tem nível, qualidade e experiência/material de melhoria. A evolução deve ser transacional:

1. validar propriedade e nível máximo;
2. validar materiais e moeda;
3. calcular o custo e o resultado antes de alterar o estado;
4. descontar recursos e aplicar a melhoria em uma única operação;
5. salvar o estado uma vez e emitir o resultado;
6. em erro, não consumir recursos nem perder o item.

Os custos devem crescer por faixas, com uma curva configurável e limites de segurança. Não definir a curva final antes de simular a progressão do nível 1 até o meio de jogo e executar testes de economia. Não importar custos, requisitos de garagem ou percentuais observados em capturas da referência.

## Evolução de viatura

Separar evolução da viatura de melhoria de acessórios:

- **Melhoria de acessório:** evolui uma peça individual.
- **Evolução de viatura:** desbloqueia uma nova etapa estrutural, slots/efeitos próprios e marcos visuais originais.
- **Nível da garagem:** requisito de progressão e desbloqueio, não bônus oculto.
- **Poder exibido:** derivado dos atributos reais; não somar presets alternativos como se estivessem ativos simultaneamente.

A cada etapa de viatura, exibir requisitos, custos, atributos ganhos e prévia do resultado antes da confirmação. O desbloqueio não pode apagar presets, trocar silenciosamente o preset ativo nem remover chips.

## Sincronia de Núcleo

A Sincronia de Núcleo permanece desativada até especificar:

- quais combinações de chip/atributo contribuem;
- se a progressão é por conjunto, raridade, função ou objetivo de missão;
- como calcular o valor de 0 a 100%;
- quais marcos concedem efeitos;
- como evitar sinergias multiplicativas excessivas;
- como migrar saves quando a regra mudar.

A proposta inicial é usar marcos discretos com descrição visível, em vez de conceder bônus por uma fórmula presumida da referência. O valor deve ser calculado por função pura e coberto por testes de fronteira. Não ativar uma regra baseada apenas na hipótese de que quatro chips da mesma raridade acionam ressonância.

## Critérios de aceite antes de implementar

- Conta nova começa no nível 1, sem acessórios avançados ou materiais herdados.
- Cada uma das seis posições aceita apenas o tipo de acessório compatível.
- Acessório equipado não pode ser consumido em fusão/melhoria.
- Prévia e resultado final dos custos coincidem.
- Falha de validação não modifica inventário nem saldos.
- Salvar/reabrir mantém níveis, acessórios, preset ativo e configuração dos slots.
- A evolução de viatura não duplica bônus de presets alternativos.
- Sincronia fica em 0/sem efeito quando a configuração não é válida.
- Testes cobrem níveis mínimo/máximo, recursos insuficientes, inventário inválido e saves antigos.

## Próxima ordem de implementação

1. Finalizar os testes integrados de presets e persistência.
2. Definir uma fonte única para atributos de viatura e poder.
3. Criar entidades de acessórios separadas da definição de catálogo.
4. Implementar melhoria transacional com testes.
5. Implementar marcos de evolução da viatura.
6. Só depois calibrar e ativar Sincronia de Núcleo.
