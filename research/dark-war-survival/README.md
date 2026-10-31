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
- [Pré-checagem de PveUtil](./engineering/pveutil-precheck-2026-10-30.md): associação confirmada de `PveUtil.bytes` aos bundles Lua base e Lua 5.5 (IDs 7 e 84), com hashes locais dos quatro bundles utilitários; pré-checagem histórica anterior à extração.
- [Diagnóstico de importação UnityRaw do PveUtil](./engineering/pveutil-unityraw-import-diagnosis-2026-10-31.md): teste controlado que identificou o prefixo `UnityRaw` como causa provável do bloqueio inicial; importação e exportação do bundle 7 concluídas após removê-lo em uma cópia de trabalho.
- [Extração e primeira leitura do PveUtil — bundle ID 7](./engineering/pveutil-base-bundle7-extraction-2026-10-31.md): extração confirmada de `PveUtil.bytes` (88.707 bytes), SHA-256 registrado e parser Lua 5.4 aprovado com 139 funções, 8.793 instruções e 1.847 constantes. A variante Lua 5.5 também foi extraída e comparada; a reconstrução semântica dos seletores continua em andamento.
- [Inventário de símbolos e candidatos a seletores do PveUtil](./engineering/pveutil-symbols-and-selector-candidates-2026-10-31.md): primeira triagem das funções e constantes de `GetArmyXmlName`, resolutores de herói e candidatos `army_xml_use_b` / `Army_B` / `Army`, com limites e próximos testes explícitos.
- [Comparação PveUtil Lua 5.4 × Lua 5.5](./engineering/pveutil-lua54-lua55-comparison-2026-10-31.md): extração validada das duas versões, alinhamento de 139 funções por linha-fonte e diferenças isoladas para disassembly posterior.
- [GetArmyXmlName — seletor de tabelas Army](./engineering/pveutil-getarmyxmlname-selector-2026-10-31.md): associação do símbolo público à função 136 e validação independente dos fluxos Lua 5.4 e Lua 5.5; ambos confirmam `true → Army_B` / `false → Army` e salto PC 6 → PC 10. O valor remoto ativo continua desconhecido.
- [Decoder independente Lua 5.4](./tools/decode-lua54-control-flow-independent.js) e [evidência JSON](./engineering/evidence/pveutil-getarmyxmlname-lua54-independent-decode-2026-10-31.json): código reproduzível e resultado verificável do salto e da polaridade do seletor.
- [Decoder independente Lua 5.5](./tools/decode-lua55-control-flow-independent.js) e [evidência JSON](./engineering/evidence/pveutil-getarmyxmlname-lua55-independent-decode-2026-10-31.json): decodificação independente dos opcodes customizados pelo crosswalk empírico, destino do JMP e caminhos de retorno.
- [HeroUtils — seletores de tabelas de heróis Lua 5.4 × Lua 5.5](./engineering/heroutils-selectors-lua54-lua55-2026-10-31.md): mapeamento root → closure → protótipo para `GetHeroXmlName`, `GetLwHeroTableName` e `GetHeroLevelUpXmlName`; regras de `NewHeroesB`, `LW_Hero_B` e `NewHeroesLevelUp_B`, com parâmetro adicional do seletor LW explicitado.
- [Analyzer reproduzível de HeroUtils](./tools/analyze-heroutils-selectors.js) e [evidência JSON](./engineering/evidence/heroutils-selector-root-mapping-2026-10-31.json): decodificação dos três seletores nas duas versões, com raw words, constantes, PCs, saltos e hashes.
- [Scanner de call sites de seletores](./tools/analyze-hero-selector-callsites.js) e [evidência JSON](./engineering/evidence/hero-selector-callsites-2026-10-31.json): 20 chamadas estáticas de `GetHeroXmlName` (todas sem argumentos explícitos), quatro de `GetArmyXmlName` e nenhuma referência/call site estático indexado para os dois outros seletores.
- [Pré-checagem dos DataTables de heróis](./engineering/hero-datatable-bundle-precheck-2026-10-31.md): seis bundles base/Lua 5.5 de heróis, evolução e LW com tamanho e SHA-256 confirmados contra o manifesto; 24 linhas de assets mapeadas. Extração individual aguarda margem de RAM acima de 875 MB.
- [Auditoria do escopo de exportação existente](./engineering/hero-datatable-existing-export-scope-audit-2026-10-31.md) e [evidência JSON](./engineering/evidence/hero-datatable-existing-export-scope-2026-10-31.json): os 32 resultados de batch existentes são módulos Lua; os bundles DataTable de heróis ainda não foram exportados. A extração segue condicionada à margem de RAM.
- [Contrato de leitura de HeroLevelUpTemplateManager](./engineering/hero-levelup-manager-table-accessors-2026-10-31.md) e [evidência JSON](./engineering/evidence/hero-levelup-manager-table-accessors-2026-10-31.json): sete acessores confirmados em Lua 5.4/5.5 para `exp`, atributos, tropas e requisitos de breakthrough; três chaves são calculadas por concatenação e ainda precisam de decodificação.
- [Callsites dos seletores de heróis e parâmetro LW](./engineering/hero-selector-callsites-and-lw-parameter-2026-10-31.md) e [evidência JSON](./engineering/evidence/hero-selector-callsites-and-lw-parameter-2026-10-31.json): 20 callsites estáticos de `GetHeroXmlName` (10 por versão) em cinco módulos; `GetLwHeroTableName` depende também do argumento R0, com regra de retorno decodificada em Lua 5.4/5.5. Chamadores e significado de R0 ainda não identificados.
- [Consumo da tabela dinâmica entre módulos](./engineering/hero-table-consumers-cross-module-2026-10-31.md) e [evidência JSON](./engineering/evidence/hero-table-consumers-cross-module-2026-10-31.json): 18 fluxos diretos `GetTableData` confirmados em Lua 5.4/5.5 para `camp`, `order`, `rarity` e `desc`; o callsite de HeroWeaponManager ainda requer trace próprio.
- [Precheck reproduzível](./tools/precheck-hero-datatable-bundles.js) e [evidência JSON](./engineering/evidence/hero-datatable-bundle-precheck-2026-10-31.json): mapeamento AssetPath → bundle, origem, hashes, lacunas de variantes B e bloqueio de memória.
- [HeroDataManager — consumo do seletor dinâmico](./engineering/herodata-manager-hero-table-consumers-2026-10-31.md): quatro traces (funções 43 e 46 em Lua 5.4/5.5) confirmam `GetHeroXmlName()` → `GetTableData(tableName, heroId, camp)`.
- [Analyzer de consumidores HeroDataManager](./tools/analyze-herodata-manager-table-consumers.js) e [evidência JSON](./engineering/evidence/herodata-manager-dynamic-hero-table-consumers-2026-10-31.json): PCs das chamadas, registradores, argumentos e hashes das fontes.

- [Argumentos de HeroEquipManager e consumo indireto de HeroWeaponManager](./engineering/hero-equip-and-weapon-table-argument-trace-2026-10-31.md) e [evidência JSON](./engineering/evidence/hero-equip-and-weapon-table-argument-trace-2026-10-31.json): identifica `HasBetterEquip(heroId, slot)`, `HasEmptyEquipSlotInstall(heroId, slot)` e os registradores de `GetOtherEquipListBySlot` (R1 ainda desconhecido); comprova que HeroWeaponManager passa `GetHeroXmlName()` para `LocalController.instance.visitTable` e filtra registros por servidor/dias.