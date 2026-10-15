# Relatório técnico — recursos autoritativos e coleta temporizada

**Branch:** `feature/server-authoritative-gathering`  
**Escopo:** primeira entrega de coleta no backend do Infinit War.

## Auditoria inicial

- O cliente Electron salva o estado local em `localStorage` e envia snapshots pelo endpoint legado `PUT /player/state`.
- O endpoint `POST /v1/player/sync` chamava `syncState()`, que aceitava saldos de recursos enviados pelo cliente.
- `POST /v1/world/marches/start` existia, mas criava apenas um objeto de marcha em memória da requisição e não persistia o resultado.
- Já havia uma suíte Node.js de integração em `backend/test/integration.test.js` e o workflow `.github/workflows/backend-integration.yml`.

## Alterações nesta branch

1. **Autoridade do servidor:** `syncState()` não aplica mais valores de recursos recebidos em snapshots do cliente.
2. **Compatibilidade legada:** `GET /player/state` retorna os recursos canônicos do servidor; `PUT /player/state` preserva os campos de progresso enviados, mas substitui o saldo de recursos pelo saldo mantido no servidor.
3. **Expedições persistidas:** `POST /v1/world/marches/start` valida o tipo de recurso, cria uma marcha persistida e limita a três marchas simultâneas.
4. **Recuperação do temporizador:** `GET /v1/world/marches` e `pendingTimers` em `/v1/player/sync` expõem as marchas ativas para reidratar o estado após reabrir o jogo.\n5. **Temporizador e recompensa:** `POST /v1/world/marches/collect` só permite resgate após a chegada e marca a marcha como coletada antes de devolver a recompensa. Resgates repetidos são recusados.
5. **Recompensas iniciais de protótipo:** cada marcha dura 60 segundos; ouro concede 500, madeira 800, aço 300 e comida 1.000. Duração e recompensa são definidas pelo servidor, não pelo cliente.
6. **Persistência MySQL:** as marchas são incluídas nos metadados do jogador para manter o temporizador entre reinicializações.
7. **Cliente API:** adicionados `startMarchV1()` e `collectMarchV1()` em `api/client.js`.
8. **Testes:** adicionados testes de API para tentativas de alterar saldos, validação do temporizador e teste determinístico da recompensa/resgate único.

## Comandos de validação

Execute na pasta `backend`:

```bash
npm ci
npm run test:integration
```

O workflow de CI também instala as dependências e executa `npm run test:integration` em push e pull request. O teste de idempotência existente depende de Redis; a suíte pode ignorá-lo quando Redis não estiver disponível localmente.

## Estado de verificação

- **Inspeção remota do código:** concluída antes das alterações.
- **Arquivos modificados nesta branch:** serviço de domínio, rotas V1 e legadas, estado/persistência, cliente API e testes de integração.
- **Testes locais executados nesta sessão:** nenhum. As alterações foram gravadas no GitHub, mas não afirmo que os testes passaram até haver resultado real de execução.
- **Pendente:** aguardar o workflow do GitHub Actions para esta branch e corrigir qualquer falha observada.
- **Pendente:** conectar a coleta às interações visuais do `engine/game.js`. Esta entrega fornece os endpoints e métodos do cliente, mas não afirma que a interface do jogo já exibe o temporizador/resgate.
- **Pendente:** revisar a sincronização completa do save local para que o HUD reflita imediatamente os saldos canônicos retornados pelo servidor.
- **Pendente:** a autenticação atual ainda contém fluxos de protótipo; antes de multiplayer público, validar tokens reais de provedores, limites de requisição e concorrência/atomicidade de persistência.
- **Pendente:** calibrar duração, quantidade de marchas e recompensas com testes de economia. Os valores de 60 segundos são para o protótipo, não balanceamento final.

## Critérios de aceite

- [ ] Snapshot malicioso não aumenta recursos no servidor.
- [ ] Save legado não substitui o saldo canônico de recursos.
- [ ] Marcha não pode ser coletada antes da chegada.
- [ ] Duração e recompensa enviadas pelo cliente são ignoradas.
- [ ] Uma marcha concede recompensa no máximo uma vez.
- [ ] Testes de integração e workflow CI passam.
- [ ] Interface mostra o estado e o resultado da coleta.

