# Mapa de incursões, caça e chefes — proposta original

**Status:** especificação inicial; não representa comportamento confirmado do jogo de referência.  
**Regra global:** novas contas começam no nível 1. Não importar personagens, nomes, coordenadas, custos, taxas de drop ou poderes transcritos dos vídeos de referência.

## Objetivos

- Fazer do mapa um espaço de exploração com alvos e eventos compreensíveis.
- Permitir caça solo com custo, resultado e recompensa auditáveis.
- Permitir que uma aliança organize incursões com estados claros.
- Garantir que reenvio de requisições, reconexão ou cliques repetidos não dupliquem custo, tropas ou prêmio.

## Entidades propostas

### Alvo do mapa

Campos mínimos:
- `id`: identificador estável do alvo.
- `kind`: categoria interna, por exemplo `roaming_enemy` ou `world_boss`.
- `level`: nível do alvo.
- `position`: coordenadas do mapa do Guerra Infinita.
- `recommendedPower`: orientação informativa, não garantia de vitória.
- `energyCost`: custo explícito da tentativa.
- `rewardTableId`: referência à tabela de recompensa original.
- `status`: disponível, reservado, derrotado, expirado.

### Formação salva

- `id`, `ownerId`, `name`, lista ordenada de heróis, quantidade de tropas por tipo.
- Deve validar heróis desbloqueados, limites de tropas e ausência de duplicação não permitida.
- Salvar uma formação não despacha tropas nem reserva energia.

### Marcha solo

- `id`, `ownerId`, `targetId`, `formationSnapshot`, `startedAt`, `endsAt`, `status`, `costReceiptId`.
- A formação é copiada como snapshot no momento da partida; mudanças posteriores no elenco não alteram uma marcha em curso.
- Estados sugeridos: `prepared` → `marching` → `resolving` → `completed` ou `failed`; cancelamento apenas se uma regra explícita permitir.

### Incursão de aliança

- `id`, `allianceId`, `targetId`, `leaderId`, `capacity`, `joinDeadline`, `status`, `participants`, `resultId`.
- Participante: `playerId`, snapshot da formação, tropas comprometidas, recibo de custo e estado de validação.
- Estados: `recruiting` → `assembling` → `marching` → `resolving` → `completed`; `cancelled` pode ocorrer antes da partida sob regras publicadas.
- Depois do fechamento da entrada, novos participantes são recusados com mensagem clara.

## Operações transacionais

### Iniciar caça solo

1. Validar alvo, energia, formação e disponibilidade de tropas.
2. Criar identificador idempotente para a operação.
3. Reservar/consumir custo e registrar recibo uma única vez.
4. Persistir snapshot da formação e estado da marcha na mesma transação.
5. Se qualquer validação falhar, não alterar energia, tropas ou marcha.

### Entrar em uma incursão

1. Confirmar estado `recruiting` e prazo de entrada.
2. Validar membro, tropas disponíveis, formação e custo de participação.
3. Impedir o mesmo jogador de entrar duas vezes na mesma incursão.
4. Registrar snapshot, custo e tropas de forma atômica.
5. Se falhar, não cobrar nem reservar parcialmente.

### Fechar e despachar

1. O líder ou regra automática fecha o recrutamento no prazo.
2. Revalidar participantes e capacidade.
3. Se não atingir condições mínimas previamente definidas, cancelar ou seguir a regra explícita da incursão.
4. Congelar a lista de participantes e snapshots.
5. Mudar para `marching` uma única vez.

### Resolver combate e pagar recompensa

1. Resolver um único resultado por `resultId`.
2. Registrar vitória/derrota, dano, baixas e resultado com algoritmo determinístico ou semente registrada.
3. Calcular prêmios conforme uma tabela versionada.
4. Emitir recompensas de forma idempotente: uma concessão por jogador e por resultado.
5. Repetir a chamada de resgate retorna o resultado já registrado, sem duplicar itens.

## Protótipo de combate implementado

**Versão de regras:** `combat-v1` (balanceamento provisório; não é uma fórmula do jogo de referência).

- Alvos originais: Rastreador da Floresta (260.000 HP; custo 15 energia; viagem de 30 s) e Bruto das Ruínas (520.000 HP; custo 15 energia; viagem de 45 s).
- Poder da formação: soma de poder, 2× ataque, defesa, 500 por nível e 1.000 por estrela, por herói.
- Tropas: cada tropa comprometida adiciona 40 de poder. O servidor começa com 1.000 tropas por conta; quantidade é validada e reservada na partida/entrada.
- Dano: poder total × multiplicador determinístico entre 0,90 e 1,10 derivado do ID da operação; resultado fica estável em novas tentativas.
- Vitória quando dano ≥ HP do alvo; caso contrário, derrota. Sem rounds, habilidades, buffs ou simulação de combate tático nesta primeira versão.
- Recompensas por vitória: Rastreador +1.200 ouro, +800 alimento, +50 aço; Bruto +2.400 ouro, +1.600 alimento, +100 aço. Derrota concede 20% desses valores, arredondado para baixo.
- Baixas de tropas: 2% das tropas comprometidas em vitória e 25% em derrota, arredondadas para baixo; sobreviventes retornam ao saldo.
- Cada resolução gera um único ID de resultado e recibos por jogador. Repetir a resolução retorna o recibo existente sem conceder recursos ou tropas novamente.
- Marchas não podem ser resolvidas antes do horário de chegada registrado pelo servidor.

Esses valores são **decisões originais temporárias**, precisam de playtests e balanceamento. O protótipo não inclui ainda habilidades de herói, atributos de viatura/chips/acessórios, bônus de pesquisa, tropas feridas, saque aleatório ou combate contínuo em rounds.

## Regras que ainda precisam ser decididas antes do combate de produção

- Como poder de heróis, tropas, viatura, acessórios, chips, pesquisa e efeitos temporários são combinados.
- Se a energia é cobrada ao entrar, ao despachar ou ao resolver; e se há reembolso no cancelamento.
- Como estimar duração de marcha e tratar alvo que desaparece ou é derrotado durante o trajeto.
- Limites por aliança, participantes mínimos/máximos e prazos de preparação.
- Se as tropas sofrem baixas, ficam feridas ou retornam integralmente.
- Como calcular dano individual e coletivo, contribuição mínima e desempates.
- Como distribuir recompensas entre participantes e como tratar jogador desconectado.
- O que acontece quando o chefe sobrevive, o prazo termina ou o servidor falha.
- Regras de participação repetida, tentativas diárias e proteção contra manipulação do cliente.

Nenhuma dessas regras deve ser inferida somente a partir do número de tropas, do poder recomendado ou da tela de preparação relatados nos vídeos.

## Telemetria mínima para depuração

Registrar eventos com identificadores estáveis:
- `hunt.prepared`, `hunt.dispatched`, `hunt.resolved`
- `rally.created`, `rally.joined`, `rally.closed`, `rally.dispatched`, `rally.resolved`
- `reward.granted`, `operation.rejected`

Cada evento deve conter ID da operação, versão da regra, jogador/aliança quando aplicável, motivo de rejeição e timestamp do servidor. Não registrar tokens de autenticação nem dados pessoais desnecessários.

## Critérios de aceite

- Energia e tropas não ficam negativas nem são descontadas duas vezes.
- Uma formação salva não altera uma marcha já despachada.
- Um jogador só aparece uma vez em cada incursão.
- Não é possível entrar depois do fechamento.
- Falhas e reconexões não duplicam marchas nem recompensas.
- Cada resultado tem um único recibo e cada jogador recebe no máximo uma vez.
- Testes cobrem sucesso, falta de energia, tropas insuficientes, prazo expirado, concorrência de entrada, cancelamento, derrota, vitória, chefe sobrevivente e repetição de requisição.
- A interface informa custo, composição, destino, estado e motivo de recusa antes de confirmar.

## Próximo passo de engenharia

Antes de ligar estas entidades à interface ou ao backend, implementar funções puras para validar formação, criar snapshot, calcular custos e validar transições de estado. Cobrir as regras com testes unitários; só depois integrar persistência e combate.
