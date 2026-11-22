# Sistema de chips e Sincronia de Núcleo

**Projeto:** Guerra Infinita  
**Status:** especificação de pesquisa; não representa implementação concluída.  
**Base documental:** relatório de análise fornecido pelo usuário em 15/10/2026, catálogo de capturas e auditoria do protótipo.  
**Referência de comparação:** Dark War: Survival. Guerra Infinita deverá usar nomes, arte, regras e balanceamento próprios.

> **Limite de verificação:** este documento organiza a transcrição fornecida. Os arquivos de vídeo citados não foram abertos nem inspecionados diretamente nesta etapa. Por isso, os timestamps e valores abaixo são tratados como observações relatadas no relatório, não como uma verificação independente dos vídeos.

## 1. Evidências relatadas

### 1.1 Presets e slots

| Campo | Observação relatada | Classificação |
|---|---|---|
| Presets | I, II, III e IV | Relatado no vídeo; compatível com capturas catalogadas |
| Composição visual | Quatro posições de chip ao redor de um veículo/núcleo central | Relatado no vídeo e nas capturas estáticas |
| Poder exibido por preset | I: 7.840.000; II: 6.570.000; III: 5.240.000; IV: 2.759.000 | Relatado no vídeo; conferir arredondamento do IV |
| Ressonância | Indicador visual de 0 a 5 | Relatado no vídeo; a fórmula não está confirmada |
| Raridades | Verde, azul, roxo e laranja/dourado | Relatado pela interface |
| Detalhe de chip | Campo de Supressão; 4/10 estrelas e requisito 1/3 | Relatado no vídeo; confirmar o que cada unidade do requisito representa |
| Efeito descrito | Redução de 8% do dano de habilidade inimiga e redução adicional de 3% por quatro turnos após habilidade da viatura | Texto de efeito relatado pela interface; aplicação real no combate não testada |

**Não inferir:** a soma dos quatro poderes de preset não foi demonstrada como decomposição do poder total da garagem. Presets podem representar configurações alternativas, não quatro contribuições simultâneas. O poder total da garagem deve ser medido e reconciliado por teste, sem somar presets alternativos por padrão.

### 1.2 Baú de Chip Verde

Tabela transcrita do relatório fornecido:

| Raridade | Chance agrupada | Resultados listados | Chance por resultado |
|---|---:|---:|---:|
| Laranja / lendário | 0,2% | 12 | aproximadamente 0,0166–0,0167% (derivada) |
| Roxo / épico | 4,8% | 12 | 0,4% |
| Azul / raro | 30,0% | 4 | 7,5% |
| Verde / comum | 65,0% | 4 | 16,25% (derivada) |
| **Total** | **100%** | **32** | — |

A chance individual de 16,25% para cada resultado verde e a divisão exata de 0,2% entre os 12 resultados laranja são cálculos derivados da distribuição agrupada, não necessariamente números impressos individualmente pela interface. Não atribuir nomes de itens a linhas quando a associação não está confirmada.

O relatório também indica uma recompensa de chip por abertura e um material avançado descrito no baú. Confirmar em teste se o material é garantido, se a quantidade é fixa e se todas as variantes do baú se comportam assim. Esta tabela se aplica **somente ao Baú de Chip Verde identificado**; não usar automaticamente em baús roxos, laranja ou outros sistemas de recompensa.

### 1.3 Garagem e acessórios

Valores transcritos do relatório:

- Garagem: nível 267, progresso exibido de 91%, poder 27.178.500 e moeda 1.700.
- Seis posições de acessórios; níveis observados aproximadamente 23–26.
- Atributos exibidos: Ataque de Tropas aproximadamente +81,8% a +85,9%; Valor de Destruição aproximadamente +13% a +13,5%.
- Ação de atualização: custo 720 relatado, sem animação de melhoria observada.
- Fortalecimento: custos individuais relatados de 452–520 materiais roxos e 60–100 laranjas; rodapé 2.944.800 + 147.600 com confiança média devido a corte.
- Evolução de viatura relatada: Verme da Areia I — 300.000 / +5%; Verme da Areia II — 600.000 / +10%; Colmeia II — 1.200.000 / +20%; Cão do Inferno I — 1.500.000 / +25%, seis acessórios nível 21; Cão do Inferno II — 1.800.000 / +30%, garagem nível 43; Cão do Inferno III — 2.100.000 / +35%, garagem nível 55.

Esses nomes e valores servem somente para rastrear a pesquisa do jogo de referência. Não reutilizar nomes, assets ou tabela de custos no jogo original. O relatório indica que parte dos custos está cortada; não usar os totais como fonte definitiva de balanceamento.

## 2. Modelo original proposto para Guerra Infinita

### 2.1 Entidades

Separar a definição do chip da unidade física que o jogador possui:

- **ChipDefinition:** ID de catálogo, nome original, facção/conjunto, raridade, atributos base, habilidade e versão de balanceamento.
- **ChipInstance:** ID único da unidade possuída, referência à definição, nível, estrelas e estado de propriedade.
- **VehicleLoadout:** quatro referências a instâncias de chip e um identificador de núcleo/veículo central.
- **LoadoutPreset:** ID do preset, configuração salva, data/versão e indicação se está ativo.
- **CoreSyncRule:** regra original, explícita e versionada para calcular a Sincronia de Núcleo.
- **ChestTable:** tabela versionada com resultados, pesos, escopo do baú e origem dos dados.

Exemplo conceitual, não código executável:

```text
ChipDefinition {
  id, name, faction, rarity,
  basePower, baseStats, skillDefinitionId, balanceVersion
}

ChipInstance {
  instanceId, definitionId, level, stars, ownershipState
}

LoadoutPreset {
  id: I | II | III | IV,
  slots: [instanceId | null, instanceId | null,
          instanceId | null, instanceId | null],
  coreId, isActive
}
```

O poder do preset deve ser calculado a partir de suas próprias peças e modificadores validados. Presets alternativos são configurações salvas; eles não devem conceder bônus simultaneamente.

### 2.2 Sincronia de Núcleo — regra ainda a definir

A proposta de nome original é **Sincronia de Núcleo**, exibida como progresso de 0 a 100%. Não converter automaticamente as cinco estrelas da referência em uma fórmula linear, nem implementar como fato a hipótese de que quatro chips do mesmo conjunto e raridade ativam ressonância.

Antes da implementação, escolher e documentar:
1. quais combinações de conjunto/facção são válidas;
2. se raridade, nível ou estrelas são condições;
3. como cada slot contribui para o progresso;
4. se há limiares e quais modificadores cada limiar concede;
5. como bônus aditivos e multiplicativos se combinam;
6. como a interface explica progresso, requisitos e resultado.

A regra escolhida precisa ser própria, testável, acessível ao jogador e versionada. Até essa decisão, não aplicar bônus ocultos nem exibir uma Sincronia como se já aumentasse o combate.

### 2.3 Evolução de estrelas

A interface de referência relata progresso 4/10 e requisito 1/3 em uma tela. Isso **não basta para concluir** que todo chip usa três cópias físicas idênticas em todas as etapas. Para Guerra Infinita, a economia de evolução deve declarar claramente:
- recurso consumido e quantidade;
- se exige cópias da mesma definição, mesma raridade ou mesma estrela;
- se a peça equipada ou salva em presets pode ser consumida;
- resultado em nível/estrelas e mudança de atributos;
- comportamento quando o inventário muda ou a transação falha.

A operação deve ser atômica: ou custo e evolução são aplicados juntos, ou nada muda. Chips referenciados por presets não podem ser destruídos silenciosamente.

### 2.4 Baús e transparência

O protótipo de Guerra Infinita deve manter sua própria tabela de recompensas, separada da transcrição de referência. Se o projeto optar por usar uma distribuição matematicamente semelhante, essa será uma decisão de balanceamento original documentada, não uma reprodução automática do jogo comercial.

Requisitos:
- cada tabela identifica o tipo exato de baú e sua versão;
- pesos normalizados somam 100%;
- chances agrupadas e individuais são validadas;
- o material adicional, se garantido, é separado da recompensa aleatória;
- RNG executado pelo servidor quando houver economia online;
- simulação estatística serve como verificação aproximada, não prova que a implementação é justa ou correta;
- testes determinísticos usam RNG injetável ou uma semente fixa, sem depender de 1.000 sorteios aleatórios como único teste.

## 3. Contrato funcional e testes de aceite

| ID | Cenário | Resultado esperado |
|---|---|---|
| CHIP-001 | Save novo | Quatro presets I–IV; quatro slots vazios por preset; I ativo |
| CHIP-002 | Trocar I para II | Configuração de I preservada; atributos e poder passam a refletir apenas II |
| CHIP-003 | Alterar preset inativo | Não altera atributos de combate enquanto esse preset não estiver ativo |
| CHIP-004 | Recarregar save | Presets, slots e preset ativo restaurados sem duplicar itens |
| CHIP-005 | ID de chip inválido no save | Referência inválida removida com segurança |
| CHIP-006 | Mesma instância em dois slots do mesmo preset | Operação bloqueada ou normalização determinística |
| CHIP-007 | Mesma instância em presets alternativos | Pode ser referência compartilhada, mas só o preset ativo afeta combate |
| CHIP-008 | Chip salvo em preset e tentativa de consumir | Bloquear consumo ou solicitar remoção explícita das referências |
| CHIP-009 | Evolução sem materiais suficientes | Recusar sem consumir itens parcialmente |
| CHIP-010 | Evolução bem-sucedida | Atualizar a instância e todas as referências válidas sem cobrança duplicada |
| CHIP-011 | Regra de sincronia não configurada | Nenhum bônus de sincronia aplicado |
| CHIP-012 | Sincronia com regra aprovada | Testar todos os limiares, combinações e limites com dados determinísticos |
| CHEST-001 | Validar pesos da tabela | Soma exatamente 100% dentro da precisão definida |
| CHEST-002 | Baú verde | Usar exclusivamente a tabela versionada atribuída a esse tipo |
| CHEST-003 | Recompensa adicional | Garantia e quantidade do material seguem regra explícita, fora do sorteio quando garantido |
| CHEST-004 | Trocar preset e recalcular header | Exibição corresponde ao estado ativo e não soma presets alternativos |
| GARAGE-001 | Fortalecer acessório sem custo suficiente | Nenhum material ou atributo muda |
| GARAGE-002 | Evoluir veículo sem requisito | Operação bloqueada com requisito faltante explícito |

## 4. Auditoria do protótipo existente

A auditoria anterior da PR #17 encontrou presets e slots modelados e persistidos, mas não identificou integração explícita do preset ativo ao cálculo de atributos de combate. Antes de considerar o recurso completo:
- integrar o cálculo do preset ativo ao domínio de combate;
- provar por teste que preset inativo não altera atributos;
- definir exclusividade entre chip instalado na viatura e chip equipado em herói;
- garantir que melhoria/evolução atualiza a instância sem consumir peça referenciada;
- adicionar testes de integração, além dos testes unitários de slots.

Referência de auditoria: [Plano de testes de integração](../research/dark-war-survival/chip-loadout-integration-test-plan.md) — o caminho relativo pode variar conforme a branch; também disponível em [GitHub](https://github.com/japaprp/infinit-war-guerra-infinita/blob/research/dark-war-survival-captures/research/dark-war-survival/chip-loadout-integration-test-plan.md).

## 5. Pendências de evidência

- [ ] Vídeo ou captura que mostre instalação com um clique antes e depois.
- [ ] Vídeo do comando “Reconstituir chip” e seu efeito no inventário.
- [ ] Sequência de fortalecimento de acessório, incluindo custo antes/depois, confirmação e alteração de poder.
- [ ] Relatório de combate para testar os efeitos descritos de supressão.
- [ ] Captura completa e sem cortes dos custos de garagem/acessórios.
- [ ] Testes de troca de apenas um chip para isolar as condições de Sincronia de Núcleo.

## 6. Decisões de originalidade

Nomes de referência como “Colmeia”, “Cão do Inferno” e “Verme da Areia” não serão usados como nomes finais. As sugestões “Sucateiro”, “Patrulheiro” e “Titã de Cerco”, bem como os seis sistemas Motor, Blindagem, Rolo, Lança-Mísseis, Radar e Chassi, são ideias iniciais que precisam de validação de identidade visual e de design; não são ainda conteúdo definitivo.

**Regra de progressão:** todos os novos jogadores começam no nível 1. A conta avançada usada na pesquisa serve para entender sistemas de progressão, não como estado inicial do jogo original.
