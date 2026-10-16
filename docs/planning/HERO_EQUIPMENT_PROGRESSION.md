# Progressão de heróis, equipamentos e Industrial

## Objetivo

Implementar uma progressão original para **Guerra Infinita**, usando Dark War: Survival apenas como referência funcional. Não reutilizar código, nomes, arte ou textos proprietários. Separar fatos observados em capturas, dados de fontes secundárias e decisões de design do nosso protótipo.

## Hierarquia de conta

1. **Industrial/base:** faixa de progressão independente, planejada do nível 1 ao 10. O jogador começa no nível 1; requisitos de construção, recursos e desbloqueios devem ser definidos e testados antes de liberar cada nível. O nível 4 do usuário e o nível 10 dos líderes do servidor são contexto de comparação, não prova dos requisitos internos.
2. **Herói:** recrutamento/desbloqueio, nível, estrelas com cinco etapas internas por estrela, fragmentos específicos/universais e habilidades.
3. **Equipamento comum:** aquisição, nível próprio, qualidade e bônus; separado das estrelas do herói.
4. **Ascensão de equipamento:** sistema separado com materiais e custos próprios. Não deve aumentar a estrela do herói.
5. **Equipamento exclusivo/avançado:** sistema tardio opcional, liberado por requisitos explícitos; não concedido a contas novas.

## Estrelas do herói — baseline provisório

A implementação usa cinco níveis de estrela e cinco etapas internas por nível. O custo de cada etapa está centralizado em `HERO_STAR_FRAGMENT_COSTS` para poder ser ajustado sem reescrever a lógica.

| Estrela atual | Custos das cinco etapas (fragmentos) |
|---|---|
| 1★ | 1, 1, 2, 3, 3 |
| 2★ | 5, 5, 5, 5, 15 |
| 3★ | 15, 15, 15, 15, 50 |
| 4★ | 50, 50, 50, 50, 100 |
| 5★ | 100, 100, 100, 100, 100 |

- O herói começa com 1★ e 0/5 etapas concluídas; cada promoção consome fragmentos antes de atualizar o estado.
- Ao concluir a quinta etapa, avança uma estrela e reinicia a contagem interna. A última etapa de 5★ leva ao estado máximo 5★, 5/5.
- Fragmentos específicos são usados primeiro; os fragmentos universais permitidos pela raridade cobrem o restante.
- O estado antigo é migrado com `starStep: 0` quando não possui esse campo. O carregamento não deve apagar o restante do progresso salvo.
- A interface exibe o custo antes da ação e impede a promoção quando o herói está no máximo ou os fragmentos são insuficientes.

**Confiabilidade:** a tabela é uma referência provisória baseada em guias comunitários secundários, não uma confirmação definitiva da versão exata do jogo do usuário. Atualizar os custos se uma captura direta legível mostrar valores diferentes.

## Regras de implementação

- Conta nova não herda Industrial avançado, heróis avançados, equipamento, estrelas, fragmentos ou habilidades evoluídas.
- Nível do herói, estrela, habilidade, nível do equipamento e estrela do equipamento são eixos independentes.
- Custos, limites e requisitos ficam em configurações centralizadas, não espalhados por handlers de UI.
- Salvar/reabrir deve preservar estrelas e etapas sem duplicar nem consumir fragmentos duas vezes.
- Cada alteração de economia deve ter testes de insuficiência de recursos, custo exato, transição entre estrelas, estado máximo e compatibilidade com saves antigos.
- Não mesclar esta pull request automaticamente.

## Estado atual

- **Implementado nesta etapa:** progressão de estrela do herói com cinco etapas internas, custos configuráveis, migração de save e indicação de progresso na interface.
- **Próxima etapa:** Industrial 1–10 com requisitos explícitos e bloqueios; progressão de nível/qualidade/ascensão de equipamento em sistema separado; validar custos de referência com capturas diretas.
- **Não alegar como validado:** custos exatos do jogo de referência, requisitos por nível Industrial ou probabilidades completas sem evidência direta.
