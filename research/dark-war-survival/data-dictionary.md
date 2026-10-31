# Transcrição estruturada — Guerra Infinita
**Referência:** capturas de Dark War: Survival catalogadas em `index.md`  
**Estado:** esquema inicial; os dados abaixo são apenas valores legíveis no catálogo existente. Não preencher lacunas por estimativa.

## Regras de qualidade
- Uma linha por observação/valor, com o nome do arquivo de origem.
- Copiar números e unidades exatamente como exibidos.
- Usar `RELATADO NA INTERFACE` quando o valor vem de texto do jogo; isso não comprova a probabilidade ou fórmula real.
- Usar `PRECISA DE TESTE` para causalidade, fórmulas internas, RNG efetivo, bônus acumulados e persistência.
- Não transportar nomes, IDs, aliança, zona, mensagens ou outros dados de conta para Guerra Infinita.
- Não copiar arte, textos narrativos, nomes distintivos ou implementação proprietária. Usar somente a observação funcional para projetar sistemas originais.

## 1. Bônus de chips

| Arquivo | Chip / categoria observada | Atributo | Valor exibido | Contexto | Estado | Pergunta de validação |
|---|---|---|---:|---|---|---|
| IMG-20261015-WA0172.jpg | Módulo de Assalto — Guerreiro | Dano de combate dos guerreiros | +71% | Detalhe do chip; poder mostrado 2.390.000 | RELATADO NA INTERFACE | É aditivo ou multiplicativo? Aplica-se a todos os modos? |
| IMG-20261015-WA0173.jpg | Módulo de Assalto — Guerreiro | Dano de combate dos guerreiros | +71% → +80,6% | Prévia de evolução; progresso 4/10; poder mostrado 2.390.000 → 2.720.000; requisito visível 1/5 | CONFIRMADO VISUALMENTE / projeção da interface | A prévia se confirma após a evolução? Qual custo total? |
| IMG-20261015-WA0174.jpg | Barreira Gravitacional — Guerreiro | Vida útil do Guerreiro | +45,2% | Detalhe do chip; poder mostrado 1.530.000 | RELATADO NA INTERFACE | Qual a duração, o gatilho e o limite do escudo? |
| IMG-20261015-WA0174.jpg | Barreira Gravitacional — Guerreiro | Redução de dano recebido | 2% | Texto diz que ocorre ao entrar em combate e dura até o fim do combate | RELATADO NA INTERFACE | O efeito é constante, acumulável ou limitado por modo? |
| IMG-20261015-WA0174.jpg | Barreira Gravitacional — Guerreiro | Absorção de dano por escudo | 50% do dano recebido; limite máximo 200% do poder de ataque em dano | Texto diz que o escudo é ativado após o veículo modificado usar uma habilidade | RELATADO NA INTERFACE | Como se calcula o limite e quando o escudo termina? |
| IMG-20261015-WA0173.jpg | Módulo de Assalto — Guerreiro | Dano adicional ao atacar pela unidade | 40% | Texto complementar no detalhe/prévia | RELATADO NA INTERFACE | Se aplica ao dano base, bônus ou dano final? |
| IMG-20261015-WA0173.jpg | Módulo de Assalto — Guerreiro | Dano adicional de habilidades do veículo modificado | 800% | Texto complementar no detalhe/prévia | RELATADO NA INTERFACE | Qual é a base de cálculo e como interage com outros bônus? |
| IMG-20261015-WA0175.jpg | Barreira Gravitacional — Guerreiro | Vida útil do Guerreiro | +45,2% → +54,8% | Prévia de evolução; progresso 4/10; poder 1.530.000 → 1.850.000; requisito visível 0/3 | CONFIRMADO VISUALMENTE / projeção da interface | A prévia se confirma? Como o requisito varia por estrela? |

### Campos obrigatórios para novas linhas
`source_file`, `system`, `item_id_original`, `original_label_observed`, `stat`, `value`, `unit`, `level_or_star`, `cost_items`, `cost_amounts`, `state`, `test_id`, `notes`.

## 2. Probabilidades e pools de recompensa

| Arquivo | Pool / baú observado | Recompensa | Probabilidade exibida | Quantidade | Estado | Pendência |
|---|---|---|---:|---|---|---|
| IMG-20261015-WA0185.jpg | Anúncio de probabilidade; pool de chips | Grupo de chips laranja | 0,2% | — | RELATADO NA INTERFACE | Parte da grade está coberta por notificação; transcrever o restante em captura limpa |
| IMG-20261015-WA0185.jpg | Anúncio de probabilidade; pool de chips | Grupo de chips roxos | 4,8% | — | RELATADO NA INTERFACE | Captura mostra o cabeçalho, mas a grade completa continua na próxima imagem |
| IMG-20261015-WA0186.jpg | Grupo roxo | 12 resultados roxos | 0,4% cada | x1 por item (aparente na grade) | RELATADO NA INTERFACE | 12 × 0,4% = 4,8%; consistência aritmética, não prova RNG |
| IMG-20261015-WA0186.jpg | Grupo azul | Quatro tipos de chip azul | 7,5% cada; subtotal 30,0% | — | RELATADO NA INTERFACE | Nomes de cada chip não aparecem como texto; subtotal confere aritmeticamente |
| IMG-20261015-WA0187.jpg | Baú de chip verde | Baú selecionável | Sem chance nesta tela | Inventário: 4 verdes, 19 azuis, 0 roxos, 0 laranjas | CONFIRMADO VISUALMENTE | Modal não mostra o resultado de uma abertura |
| IMG-20261015-WA0189.jpg | Pool provisório; material avançado x1 | Material de chip avançado | 100,000% | x1 | RELATADO NA INTERFACE | Confirmar qual baú gera esta lista e se a lista continua abaixo |
| IMG-20261015-WA0189.jpg | Pool provisório; Guerreiro | Implantação Avançada, Módulo de Assalto, Campo de Supressão e Barreira Gravitacional | 0,0167% cada | x1 | RELATADO NA INTERFACE | Não é pool completo; associar ao baú correto |
| IMG-20261015-WA0190.jpg | Pool provisório; material avançado x5 | Material de chip avançado | 100,000% | x5 | RELATADO NA INTERFACE | Separar do pool x1 até identificar o baú |
| IMG-20261015-WA0190.jpg | Pool provisório; Guerreiro | Implantação Avançada, Módulo de Assalto, Campo de Supressão e Barreira Gravitacional | 0,167% cada | x1 | RELATADO NA INTERFACE | Percentual é dez vezes maior que 0,0167%; não normalizar |
| IMG-20261015-WA0191.jpg | Pool provisório; Atirador | Implantação Avançada, Módulo de Assalto, Campo de Supressão e Barreira Gravitacional | 0,0167% cada | x1 | RELATADO NA INTERFACE | Vincular ao baú/pool correto |
| IMG-20261015-WA0193.jpg | Pool provisório; Atirador | Implantação Avançada, Módulo de Assalto, Campo de Supressão e Barreira Gravitacional | 0,167% cada | x1 | RELATADO NA INTERFACE | Manter separado de WA0191 até identificar o baú |
| IMG-20261015-WA0192.jpg | Inventário Especial | Baú de chip azul | Sem chance nesta tela | Inventário: 19 | CONFIRMADO VISUALMENTE | Texto promete um chip azul ou superior e 5 materiais avançados; não comprova RNG |
| IMG-20261015-WA0193.jpg | Pool provisório; Cavalaria | Implantação Avançada — Cavalaria | 0,166% | x1 | RELATADO NA INTERFACE | Manter separado até identificar o pool exato |

### Campos obrigatórios para cada resultado
`source_file`, `chest_type`, `pool_id`, `reward_label_observed`, `rarity_observed`, `probability_displayed`, `quantity_min`, `quantity_max`, `opening_cost`, `state`, `test_id`, `notes`.

**Não calcular nem normalizar probabilidades ainda:** primeiro transcrever o conjunto completo do mesmo pool e distinguir subtotal de grupo de chance individual. Não afirmar RNG real sem amostra experimental adequada.

## 3. Custos, materiais e temporizadores

| Arquivo | Sistema | Ação / receita | Recurso | Quantidade observada | Tempo observado | Estado | Pendência |
|---|---|---|---|---:|---|---|---|
| IMG-20261015-WA0178.jpg | Fábrica de chips | Receita de Barreira Gravitacional — Guerreiro | Material exibido na receita | 233/800 disponíveis | Não registrado | CONFIRMADO VISUALMENTE | Confirmar custo por unidade e produção em outras quantidades |
| IMG-20261015-WA0173.jpg | Evolução de chip | Evolução de estrela | Material requerido | 1/5 | Não registrado | CONFIRMADO VISUALMENTE | Registrar nomes e quantidades exatos diretamente da imagem |
| IMG-20261015-WA0175.jpg | Evolução de chip | Evolução de estrela | Material requerido | 0/3 | Não registrado | CONFIRMADO VISUALMENTE | Registrar nomes e quantidades exatos diretamente da imagem |
| IMG-20261015-WA0160.jpg | Base | Construção em andamento | — | — | Valor não transcrito | CONFIRMADO VISUALMENTE | Capturar antes/depois e testar persistência após reabrir |

Para custos, manter separadas as colunas `cost_base`, `cost_by_level`, `cost_currency`, `quantity_required`, `quantity_owned`, `duration_base`, `speedup_applied` e `source_file`. Não extrapolar progressões lineares sem múltiplos níveis observados.

## 4. Mapa de sistemas observados

| Sistema | Evidência inicial | Próxima coleta |
|---|---|---|
| Garagem / conjunto de chips | WA0155, WA0180 | Registrar slots, conjunto equipado, bônus de ressonância e condição de ativação |
| Acessórios da viatura | WA0156 | Transcrever os seis slots, nível, raridade e atributos individualmente |
| Formação | WA0157 | Documentar posições, quantidade de heróis/tropas, salvar e resultado de combate |
| Base e construção | WA0158, WA0160 | Capturas sequenciais de início, aceleração, conclusão e reabertura |
| Poder | WA0161, WA0162 | Criar decomposição por categoria e verificar se a soma corresponde ao total |
| Chips e evolução | WA0172–WA0178 | Transcrever custos e bônus de cada nível/estrela disponível |
| Baús e probabilidades | WA0185–WA0193 | Vincular cada modal ao tipo exato de baú e transcrever o pool completo |
| Inventário | WA0184, WA0192 | Criar catálogo de itens, categorias, fontes e usos |
| Duelo da Aliança | WA0194 em diante, conforme índice | Transcrever objetivo, condição, pontuação e janela temporal |

## 5. Plano de testes controlados

| ID | Hipótese | Procedimento | Métrica | Critério de conclusão |
|---|---|---|---|---|
| T-001 | O bônus de chip afeta o atributo indicado | Registrar atributos sem chip; equipar apenas um chip; comparar em condição equivalente | Diferença absoluta e percentual | Repetição consistente; separar mudança de interface de resultado real |
| T-002 | A evolução aplica o valor projetado | Registrar nível/estrelas e atributo; evoluir uma etapa; registrar de novo | Valor antes/depois | O resultado coincide com a projeção ou a divergência é documentada |
| T-003 | As chances do baú descrevem o pool completo | Transcrever o pool inteiro; se houver acesso legítimo ao jogo, registrar muitas aberturas | Frequência observada por recompensa | Relatar tamanho da amostra e intervalo de incerteza; nunca declarar equivalência por amostra pequena |
| T-004 | Construção e expedição persistem ao reabrir | Iniciar ação; fechar normalmente; reabrir e consultar estado | Tempo restante, recibo e saldo | Estado persistido sem duplicar recompensa |
| T-005 | O poder total corresponde às categorias | Registrar o total e todas as parcelas na mesma tela/estado | Diferença entre soma e total | Diferença explicada ou marcada como fórmula desconhecida |

## 6. Registro de evidências futuras

Copiar este modelo para cada observação nova:

- **ID:** OBS-XXX
- **Arquivo(s):**
- **Sistema:**
- **Observação literal:**
- **Valor e unidade:**
- **Classificação:** CONFIRMADO VISUALMENTE / RELATADO NA INTERFACE / PRECISA DE TESTE
- **Hipótese associada:**
- **Teste necessário:**
- **Resultado do teste:**
- **Limitações / fatores de confusão:**
- **Decisão de design para Guerra Infinita:**

## 7. Pendências imediatas
1. A listagem da branch contém 94 imagens; as duas imagens adicionais ainda não foram confirmadas nesta pasta.
2. Transcrever os valores legíveis diretamente das capturas, sem completar números ausentes por inferência.
3. Anonimizar dados de conta nas imagens antes de ampliar o compartilhamento público.
4. Converter somente regras testadas em requisitos de implementação; regras desconhecidas permanecem configuráveis e documentadas como hipóteses.
