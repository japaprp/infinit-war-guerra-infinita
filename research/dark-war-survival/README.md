# Referência visual — Dark War: Survival

Esta pasta reúne evidências visuais usadas para análise comportamental e técnica de referência para o projeto original **Guerra Infinita**.

## Conteúdo

- `screenshots/`: capturas de tela originais usadas como evidência.
- `index.md`: catálogo inicial das observações por arquivo, sistema, evidência e perguntas em aberto.
- Auditoria da pasta `screenshots/` na branch: **94 arquivos de imagem** (`.jpg`), mais `.gitkeep`. A referência histórica era de 96 imagens; portanto, **2 imagens previstas não aparecem na pasta atual** e ainda precisam ser localizadas. O maior identificador é `WA0288`, não o total de imagens.
- Cruzamento com `index.md`: **94 nomes únicos catalogados**, sem arquivos da pasta fora do catálogo e sem nomes catalogados ausentes da pasta. O inventário menciona `WA0288` duas vezes; isso é repetição no texto, não um arquivo adicional. Existe também `IMG-20261015-WA0213(1).jpg`, que deve ser preservado como nome original.

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
