# Referência visual — Dark War: Survival

Esta pasta reúne evidências visuais usadas para análise comportamental e técnica de referência para o projeto original **Guerra Infinita**.

## Conteúdo

- `screenshots/`: capturas de tela originais usadas como evidência.
- `index.md`: catálogo inicial das observações por arquivo, sistema, evidência e perguntas em aberto.
- Auditoria da pasta `screenshots/` na branch: **94 arquivos de imagem** (`.jpg`), mais `.gitkeep`. A referência histórica era de 96 imagens; portanto, **2 imagens previstas não aparecem na pasta atual** e ainda precisam ser localizadas. O maior identificador é `WA0288`, não o total de imagens.
- Cruzamento com `index.md`: **94 nomes únicos catalogados**, sem arquivos da pasta fora do catálogo e sem nomes catalogados ausentes da pasta. O inventário menciona `WA0288` duas vezes; isso é repetição no texto, não um arquivo adicional. Existe também `IMG-20261015-WA0213(1).jpg`, que deve ser preservado como nome original.
- Busca adicional nas árvores de todas as branches acessíveis do repositório: não localizei as duas imagens faltantes. Foram encontrados arquivos com identificadores de WhatsApp em outras branches (`IMG-20261015-WA0039.jpg` e `IMG-20261015-WA9463.jpg`), mas não há evidência de que sejam as duas imagens previstas; não os contei como parte deste conjunto.

## Artefatos estruturados adicionais

- [Especificação de chips e Sincronia de Núcleo](../../docs/sistemas/chips_ressonancia.md): requisitos originais, evidências relatadas, regras ainda hipotéticas e testes de aceite.
- `data/green-chip-chest-probabilities.json`: dataset estruturado de 32 resultados do baú verde observado, com probabilidades derivadas identificadas e nomes não confirmados deixados em aberto.
- `video-analysis-protocol.md`: protocolo para análise dinâmica de vídeos de gameplay enviados por WhatsApp, com timestamps, pré/pós-ação, classificação de evidências e perguntas técnicas.
- `chip-loadout-integration-test-plan.md`: casos de teste pendentes para validar presets, persistência, inventário, evolução e integração real com atributos de combate.

## Regras de análise

1. Registrar somente o que a captura realmente mostra; marcar inferências como hipóteses.
2. Classificar observações como **CONFIRMADO VISUALMENTE**, **RELATADO NA INTERFACE** ou **PRECISA DE TESTE**.
3. Catalogar interface, progressão, heróis, equipamento, baús/probabilidades, combate, mapa, expedições, recompensas e economia.
4. Criar nomes, arte, interface e implementação próprios para Guerra Infinita; as imagens são referência de análise, não assets do jogo.
5. Não afirmar que uma fórmula interna foi descoberta com base apenas em uma captura estática.

## Privacidade

O repositório é **público**. As capturas podem conter nome de jogador, ID, aliança, zona, ranking ou mensagens. Antes de compartilhar o material publicamente ou incorporar a PR, recorte/oculte informações pessoais que não sejam necessárias para estudar a mecânica. Não envie credenciais, tokens ou códigos de autenticação.

## Estado da análise

A primeira leitura visual foi registrada em `index.md`. Valores exatos de custos, probabilidades e bônus ainda precisam de transcrição estruturada e, quando possível, de testes controlados. Nenhuma hipótese é tratada como fato sem evidência.

## Relatórios comparativos adicionados

- [industrial-source-comparison.md](./industrial-source-comparison.md): comparação da calculadora comunitária dws505 com outras fontes de custos industriais, incluindo divergências por construção/tier.
- [industrial-costs-and-mechanics.md](./industrial-costs-and-mechanics.md): tabela de custos por estágio I1–I8 e comparação adicional de totais da Torre de Vigia I9–I10, com grau de confiança e divergências entre fontes comunitárias.
- [chest-probability-transcription.md](./chest-probability-transcription.md): transcrição parcial das probabilidades visíveis nas capturas WA0185–WA0193, incluindo subtotal laranja 0,2%, roxo 4,8%, azul 30% e itens individuais legíveis.
- [equipment-chips-source-comparison.md](./equipment-chips-source-comparison.md): comparação das capturas de chips/equipamentos com o protótipo atual, limitações do modelo de slots e probabilidades.
- [Issue #16 — quatro slots, presets e ressonância](https://github.com/japaprp/infinit-war-guerra-infinita/issues/16): trabalho rastreável para confirmar as regras visuais e modelá-las com testes.

## Engenharia reversa — novas descobertas

- [Resolução estática de nomes dinâmicos de tabelas Lua](./engineering/dynamic-table-name-resolution-2026-10-31.md): análise comparativa de HeroUtils nas variantes Lua 5.4/5.5, seleção de NewHeroes/NewHeroesB e LW_Hero/LW_Hero_B, hashes e próximos passos para exportar PveUtil.
- [Pré-checagem de PveUtil](./engineering/pveutil-precheck-2026-10-30.md): associação confirmada de `PveUtil.bytes` aos bundles Lua base e Lua 5.5 (IDs 7 e 84), hashes locais dos quatro bundles utilitários e bloqueio de exportação por RAM insuficiente.
- [Diagnóstico de importação UnityRaw do PveUtil](./engineering/pveutil-unityraw-import-diagnosis-2026-10-31.md): teste controlado que identificou o prefixo `UnityRaw` como causa provável do bloqueio inicial; importação do bundle 7 concluída após removê-lo em uma cópia de trabalho. Exportação do TextAsset ainda pendente.
- [Extração e primeira leitura do PveUtil — bundle ID 7](./engineering/pveutil-base-bundle7-extraction-2026-10-31.md): extração confirmada de `PveUtil.bytes` (88.707 bytes), SHA-256 registrado e parser Lua 5.4 aprovado com 139 funções, 8.793 instruções e 1.847 constantes. A reconstrução dos seletores e a variante Lua 5.5 continuam pendentes.
- [Inventário de símbolos e candidatos a seletores do PveUtil](./engineering/pveutil-symbols-and-selector-candidates-2026-10-31.md): primeira triagem das funções e constantes de `GetArmyXmlName`, resolutores de herói e candidatos `army_xml_use_b` / `Army_B` / `Army`, com limites e próximos testes explícitos.
