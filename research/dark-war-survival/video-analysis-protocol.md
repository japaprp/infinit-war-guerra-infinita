# Protocolo de análise de vídeos — Dark War: Survival

**Projeto de destino:** Guerra Infinita (jogo original)  
**Estado:** protocolo preparado; os vídeos ainda precisam ser anexados ou fornecidos como arquivos acessíveis para análise.  
**Objetivo:** usar vídeos enviados originalmente por WhatsApp como evidência dinâmica complementar às 94 capturas catalogadas.

## Princípios

1. Não declarar que um vídeo foi visto se ele não foi disponibilizado no contexto de análise.
2. Preservar a origem: nome do arquivo, duração, resolução, data informada pelo usuário e trecho/tempo exato.
3. Não misturar telas ou tabelas diferentes só porque exibem itens semelhantes.
4. Distinguir observação direta, texto mostrado pela interface, hipótese mecânica e proposta original para Guerra Infinita.
5. Usar nomes, personagens, arte, texto narrativo e interface próprios no projeto de destino; analisar o original para compreender comportamentos, não copiar seus assets.
6. Ocultar nomes/IDs de jogadores, coordenadas, aliança, chat, notificações e outras informações privadas nos recortes que forem publicados.

## Procedimento por vídeo

1. Registrar metadados básicos e se o áudio contém narração relevante.
2. Criar uma linha do tempo com timestamps para cada tela, mudança de estado, toque, animação, resultado e mensagem.
3. Para cada sequência, registrar estado anterior → ação observada → estado posterior.
4. Transcrever exatamente textos, valores, percentuais, custos, temporizadores, quantidades, botões e requisitos legíveis.
5. Anotar transições que uma captura estática não prova: abertura/fechamento de modal, troca de preset, equipar/remover item, confirmar melhoria, consumir material, obter recompensa, entrar/sair de combate.
6. Comparar com as capturas já catalogadas e referenciar os nomes de arquivo; marcar divergências de versão ou contexto.
7. Classificar cada observação:
   - **CONFIRMADO NO VÍDEO** — ação/estado diretamente visível.
   - **RELATADO PELA INTERFACE** — fórmula, bônus ou probabilidade afirmados na tela.
   - **HIPÓTESE** — explicação possível, ainda não demonstrada.
   - **PRECISA DE TESTE** — comportamento que exige repetição controlada ou mais evidência.
8. Anotar confiança e limitações (corte do vídeo, texto ilegível, transição ausente, velocidade, sobreposição de notificações).
9. Converter somente conclusões suficientemente apoiadas em requisitos de produto e testes para Guerra Infinita.

## Modelo de registro por evento

| Campo | Descrição |
|---|---|
| video_file | Nome original do vídeo |
| timestamp_start / timestamp_end | Tempo exato no vídeo |
| screen_or_system | Sistema/tela observada |
| precondition | Estado visível antes da ação |
| action | Ação do usuário visível ou narrada |
| observed_result | Mudança de estado diretamente observada |
| interface_text | Texto literal legível |
| values_and_units | Valores, unidades, percentuais e custos |
| linked_screenshots | Capturas correlacionadas, sem assumir que sejam idênticas |
| evidence_class | Confirmado no vídeo / relatado pela interface / hipótese / precisa de teste |
| confidence | Alta / média / baixa com justificativa |
| open_question | O que ainda não pode ser concluído |
| original_game_decision | Regra própria proposta para Guerra Infinita, se houver |

## Perguntas técnicas a priorizar

- Chips: equipar/remover, slots válidos, quatro presets, ativação do preset, ressonância, evolução, materiais consumidos e persistência após reabrir a tela.
- Baús: tela exata de origem, tabela de probabilidades, número de recompensas por abertura, resultados e diferença entre probabilidade exibida e observada.
- Heróis/equipamento: slots, atributos antes/depois, limites, requisitos, duplicatas e bônus de conjunto.
- Viatura/garagem: acessórios, melhoria, evolução, custo, bônus concedidos e dependências de nível.
- Combate: formação usada, sequência de habilidades, alvos, duração de efeitos, relatório final e atributos aplicados.
- Base/indústria: requisitos de melhoria, filas/temporizadores, acelerações, custos e bloqueios.
- Economia/eventos: recurso consumido, pontuação/recompensa recebida, limites e reinicializações.

## Entrega esperada

Ao terminar cada vídeo, produzir:
1. linha do tempo com timestamps;
2. tabela de observações e confiança;
3. diferenças em relação ao catálogo de capturas;
4. lista de dúvidas ainda abertas;
5. requisitos e testes sugeridos para Guerra Infinita, com nomes/valores originais;
6. atualização dos documentos e issues pertinentes, sem alterar código de produção apenas com base em hipótese.

## Limite atual

Este protocolo é uma estrutura de trabalho, não um relatório de vídeos já analisados. A análise factual só começa quando os arquivos de vídeo ou segmentos relevantes estiverem acessíveis.
