# Fontes externas — sistema de chips e garagem

**Projeto de destino:** Guerra Infinita  
**Data da consulta:** 2026-10-15  
**Uso permitido:** triangulação de hipóteses e identificação de perguntas para teste.  
**Regra:** fontes de comunidade não substituem as capturas catalogadas, nem provam a implementação interna do jogo.

## Matriz de evidências

| Fonte | Tipo | O que relata | Confiança para descrever o original | Como usar no projeto |
|---|---|---|---|---|
| [Reddit — Chips & chip factory](https://www.reddit.com/r/darkwarsurvival/comments/1rw61la/chips_chip_factory/) | Relato de jogadores, março de 2026 | Quatro chips em uma configuração de veículo; foco em tipo de tropa e ressonância; caixas aleatórias e materiais de fabricação. | Média/baixa: relato comunitário, contexto de versão limitado. | Criar perguntas de validação sobre quatro posições, correspondência de tropa, ressonância e fontes de obtenção. Não copiar conselhos de gasto. |
| [DC Inside — chip system](https://gall.dcinside.com/mini/board/view/?id=darkwar&no=4953) | Fórum de comunidade, setembro de 2025 | Relata quatro posições de chip por formação/viatura, tipos de chip, fabricação e duplicatas para evolução. | Média/baixa: inclui interpretações do autor e alguns termos explicitamente incertos. | Cruzar com WA0155/WA0180 e WA0172–WA0178; registrar divergências, não assumir nomenclatura ou fórmula. |
| [RDRZ Team — Chip System Guide (2026)](https://rdrzteam.com/dark-war-survival-chip-system-guide-2026/) | Guia comunitário, março de 2026 | Relata quatro slots por veículo, configuração por formação, raridades e ressonância. | Média/baixa: guia secundário; afirmações de mecânica não são documentação oficial. | Usar como lista de tópicos a investigar. Não usar números não corroborados como valores de produção. |
| [Treyex Gaming — Chip factions, skills](https://www.treyexgaming.com/dark-war-survival-chip-system-guide-chip-factions-skills/) | Guia comunitário | Relata tipos de tropa, quatro posições, raridades e habilidades de chips. | Média/baixa: secundária; pode descrever versão ou contexto diferente. | Comparar rótulos e estrutura com capturas; não copiar nomes, texto ou valores específicos. |
| [ATLANTIS HUB — Chips & Resonance](https://atlantisdws.com/dark-war-survival/chips) | Guia/calculadora comunitária | Relata evolução por cópias e ressonância vinculada ao menor nível do conjunto. | Média/baixa: fonte comunitária com números que exigem conferência visual e de versão. | Tratar a regra de ressonância como hipótese a testar; não implementar a fórmula sem capturas/teste independente. |
| [YouTube traduzido — uso de chips e caixas](https://www.youtubetranslate.net/en/watch?v=F7xblHuCq4U) | Transcrição de vídeo comunitário | A transcrição relata para um baú verde 65% verde, 30% azul, 4,8% roxo e 0,2% laranja; para baú roxo, 15% laranja e 85% roxo; baú seletor com 100% laranja. | Média/baixa: transcrição secundária; tradução pode alterar termos e o contexto da versão precisa ser verificado. | Comparar somente com capturas do MESMO tipo de baú. Não transferir esses valores para o Baú de Módulos original sem confirmar que é o mesmo pool. |

## Divergências e limites importantes

1. As capturas WA0185–WA0186 mostram 0,2% para chip laranja e um grupo azul com 30%/quatro resultados de 7,5%. Isso **não prova** que seja o mesmo baú verde descrito na transcrição de vídeo, nem que todas as probabilidades daquele baú estejam transcritas.
2. Os relatos de comunidade concordam em termos gerais sobre quatro posições e chips associados a veículos/formações, mas os nomes das posições, as regras de ressonância e a progressão precisam ser comparados com as telas e a versão observada.
3. O valor “233/800” em WA0178 é disponibilidade versus requisito na tela de receita observada; não prova sozinho que todas as receitas ou raridades custem 800.
4. A captura WA0173 mostra uma projeção +71% → +80,6%, progresso 4/10 e requisito 1/5. WA0175 mostra +45,2% → +54,8%, progresso 4/10 e requisito 0/3. Não extrapolar a fórmula para outros níveis nem concluir que o custo seja sempre igual.
5. Os números e sistemas descritos pelos guias podem variar por versão, tipo de baú, formação, raridade ou evento. Registrar versão/data quando for possível.

## Próximas verificações orientadas por evidência

- [ ] Identificar, em cada captura WA0185–WA0193, o tipo exato de baú e transcrever o pool completo com nome, chance e quantidade.
- [ ] Cruzar as quatro posições visíveis em WA0155/WA0180 com as posições descritas nos fóruns, sem presumir equivalência apenas pela posição na tela.
- [ ] Verificar se a ressonância depende do menor nível/estrela do conjunto, do conjunto completo ou de outra condição; até lá, deixar como desconhecido.
- [ ] Separar nível e estrela/avanço em campos distintos; não unificar progressões que as fontes descrevem de maneiras diferentes.
- [ ] Registrar toda divergência em `data-dictionary.md` com arquivo, fonte externa, data e estado da afirmação.

## Política de implementação

- Valores diretamente visíveis nas capturas podem ser registrados como “relatados na interface”.
- Uma regra repetida em mais de uma fonte secundária continua sendo uma alegação de fonte, não uma confirmação do código interno.
- Só promover uma hipótese a requisito implementável depois de haver evidência visual suficiente ou teste controlado documentado.
- As probabilidades atuais do protótipo Guerra Infinita permanecem explicitamente provisórias e próprias do projeto; não são apresentadas como reprodução do pool original.
