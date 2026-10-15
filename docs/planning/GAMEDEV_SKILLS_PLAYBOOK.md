# Game-dev skills playbook — Guerra Infinita

**Objetivo:** usar práticas gratuitas e verificáveis de desenvolvimento de jogos sem trocar de tecnologia por suposição e sem transformar hipóteses de Dark War: Survival em fatos.

## 1. Diagnóstico real do projeto

No branch de implementação consultado, `package.json` identifica um aplicativo Electron e `engine/game.js` usa `HTMLCanvasElement` + Canvas 2D diretamente. Portanto, o runtime atual é um jogo web/canvas empacotado no Electron; não há evidência, nesses arquivos, de que a implementação jogável atual use Unity, Godot, Phaser, PixiJS ou Three.js.

O README também descreve uma arquitetura-alvo futura com Unity e serviços de backend, mas isso não substitui a detecção do runtime realmente presente. **Não migrar a engine nem instalar exemplos de outra engine sem uma decisão explícita e uma análise de custo/benefício.** Usar primeiro as práticas engine-agnostic e adaptar a APIs de Canvas/Electron existentes.

## 2. Skills de código aberto consultadas

Repositório de referência: [gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) — catálogo público de skills para agentes de desenvolvimento de jogos, com licença Apache-2.0 declarada no repositório. As skills abaixo foram lidas para orientar este projeto; não afirmamos que o pacote inteiro foi instalado no ambiente do usuário.

| Skill | Aplicação concreta em Guerra Infinita | Regra prática |
|---|---|---|
| [router](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/router/SKILL.md) | Detectar runtime e escolher a menor combinação de especialidades para cada tarefa. | Identificar arquivos/dependências antes de escolher a engine; não carregar skills em massa. |
| [game-ui-ux](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/disciplines/game-ui-ux/SKILL.md) | HUD, abas, inventário, módulos, menus e adaptação a celular/janelas diferentes. | Layout responsivo, estados de tela explícitos, atualizações dirigidas por eventos e teste em tamanhos reais. |
| [save-systems](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/disciplines/save-systems/SKILL.md) | Persistência de inventário, expedição, recompensa e reabertura do jogo. | Versionar estado, validar dados, planejar migração e evitar que estado local antigo restaure uma expedição já resgatada. |
| [rpg](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/genres/rpg/SKILL.md) | Heróis, atributos derivados, equipamento, inventário e progressão. | Manter atributos-base separados de modificadores; recalcular atributos derivados e definir conteúdo como dados. |
| [create-game-assets](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/disciplines/create-game-assets/SKILL.md) | Personagens, ícones, retratos, cenários e famílias visuais coerentes. | Conferir assets existentes, dimensões, transparência, escala real, proveniência/licença e visualização dentro do jogo. |
| [game-ai](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/disciplines/game-ai/SKILL.md) | Inimigos, patrulha, perseguição, navegação e decisões de combate. | Separar decisão, navegação e movimento; usar estados explícitos e testes observáveis. |
| [prototype-fast](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/workflows/prototype-fast/SKILL.md) | Testar uma mecânica isolada antes de investir em arte e sistemas completos. | Definir uma pergunta e critérios de aprovação/reprovação; manter experimentos descartáveis fora da lógica de produção. |

## 3. Fluxo de trabalho obrigatório para engenharia reversa

Cada regra observada deve ter um estado explícito:

- **CONFIRMADO VISUALMENTE:** o que a captura mostra diretamente, com arquivo e região quando possível.
- **RELATADO NA INTERFACE:** número, texto ou chance exibida; não prova por si só a implementação interna ou o comportamento real de RNG.
- **CORROBORADO POR FONTE SECUNDÁRIA:** relato de fórum/guia, com URL, data e ressalva de versão.
- **PRECISA DE TESTE:** fórmula, custo em níveis não mostrados, efeito causal, persistência, regra de ressonância, sorteio ou comportamento fora da captura.
- **DECISÃO ORIGINAL DE GUERRA INFINITA:** mecânica própria, identificada como tal e nunca descrita como reprodução confirmada.

Antes de implementar uma mecânica referenciada:
1. Localizar e catalogar as capturas relevantes.
2. Procurar fonte oficial ou fontes comunitárias independentes; registrar divergências.
3. Separar o que é diretamente observável do que é inferência.
4. Escrever a especificação mínima e os casos desconhecidos.
5. Implementar apenas o que tem evidência suficiente; placeholders próprios ficam claramente rotulados.
6. Adicionar testes para as propriedades verificáveis, não para “provar” hipóteses sobre o original.
7. Executar os testes e relatar commit, resultado e limitações reais.
8. Validar a interação dentro do jogo em tamanhos de janela e após fechar/reabrir quando a funcionalidade envolver UI ou persistência.

## 4. Próxima sequência técnica

1. **Fechar CI da PR de módulos** e verificar persistência real no navegador, sem alegar sucesso antes do resultado.
2. **Auditar o sistema de módulos**: manter os dois pontos visuais documentados (+71% → +80,6%; +45,2% → +54,8%), mas não extrapolar a fórmula nem os custos para níveis não capturados.
3. **Catalogar o pool de cada baú separadamente**. Os 0,2% e 30% observados não devem ser atribuídos a qualquer outro tipo de baú sem confirmar a tela correspondente e transcrever o pool inteiro.
4. **Separar dados e regras**: catálogo de itens, modificadores, chances provisórias e regras de evolução devem ser dados versionados; a lógica de combate calcula atributos derivados a partir de base + modificadores.
5. **Validar UI responsiva e save/recovery** com testes automatizados e verificação visual documentada.
6. **Só então expandir** IA inimiga, mapa, combate e assets em pequenos incrementos com critérios de aceitação.

## 5. Limites e custo

- Priorizar skills, documentação, testes locais e GitHub Actions gratuitos já disponíveis.
- Não adicionar serviço pago, chave de API ou dependência paga.
- Não baixar/copiar código, arte, nomes distintivos, narrativa ou assets proprietários do jogo de referência.
- Skills de Godot/Unity/Unreal não devem ser aplicadas como se o runtime atual fosse uma dessas engines; se houver migração futura, ela precisa de decisão separada.
- PRs permanecem abertas até revisão explícita; não mesclar sem aprovação do usuário.
