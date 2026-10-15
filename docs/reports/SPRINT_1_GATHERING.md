# Relatório técnico — expedições temporizadas e recursos autoritativos

**Branch:** `feature/server-authoritative-gathering`  
**Escopo:** ciclo jogável de expedição no protótipo do Infinit War, sem serviços pagos.

## Auditoria inicial

- O cliente Electron salva o estado local em `localStorage` e envia snapshots pelo endpoint legado `PUT /player/state`.
- O endpoint `POST /v1/player/sync` aceitava saldos de recursos enviados pelo cliente.
- A API de marchas não estava conectada à interface visual do jogo.
- Já havia uma suíte Node.js de integração em `backend/test/integration.test.js` e um workflow GitHub Actions.

## Alterações nesta branch

1. **Autoridade do servidor:** snapshots do cliente não podem sobrescrever os recursos canônicos.
2. **Compatibilidade legada:** os endpoints de leitura e gravação do save legado refletem os saldos do servidor.
3. **Expedições persistidas:** iniciar uma expedição cria uma marcha persistida e limita o jogador a três marchas simultâneas.
4. **Temporizador contínuo:** a chegada é armazenada como timestamp absoluto no servidor; fechar ou reabrir o jogo não pausa nem reinicia os 60 segundos.
5. **Rotas no mapa:** o servidor devolve destino e recompensa prevista; as rotas ativas são desenhadas no mapa principal e no minimapa.
6. **Painel/HUD:** a interface permite escolher ouro, madeira, aço ou alimento, iniciar a expedição, acompanhar a contagem regressiva, ver a recompensa e resgatar quando chegar.
7. **Saldo atualizado:** depois do resgate, o cliente busca novamente o save com os saldos canônicos e redesenha o HUD. O saldo local não é a fonte de verdade.
8. **Recompensas de protótipo:** 60 segundos por expedição; ouro +500, madeira +800, aço +300 e alimento +1.000. O servidor calcula a recompensa e rejeita resgates antecipados ou duplicados.
9. **Recuperação visual:** um cache local limitado ao estado de exibição permite manter a contagem visível offline; a lista do servidor substitui o cache quando a sessão volta a conectar. O cache não pode resgatar recompensas.
10. **Testes:** testes de integração cobrem saldos adulterados, temporizador/recompensa, resgate único e persistência do timestamp após reiniciar o backend.
11. **CI gratuito:** o workflow valida a sintaxe de `engine/game.js` e `api/client.js`, instala dependências do backend e executa a suíte de integração.

## Validação

Na pasta `backend`, os comandos são:

```bash
npm ci
npm run test:integration
```

O checkout local não ficou disponível nesta sessão porque o ambiente não conseguiu resolver `github.com`; por isso, os comandos acima não foram executados localmente. A sintaxe do `engine/game.js` foi validada por análise de parser sobre o conteúdo obtido do repositório. O workflow do GitHub Actions é a validação executável da branch; o resultado precisa ser conferido para o commit mais recente, após as alterações de interface e do teste de reinicialização.

## Estado de verificação

- **Código remoto:** alterações enviadas para a branch de feature; a `main` permanece sem merge.
- **Testes locais:** não executados, pois o ambiente de execução não conseguiu clonar o repositório.
- **CI no commit de implementação `c01f724`:** aprovado. O passo `node --check engine/game.js && node --check api/client.js` passou e a suíte de integração concluiu **7 testes, 7 aprovados, 0 falhas, 0 ignorados**.
- **Validação da rota/recompensa:** os testes confirmaram que destino e recompensa prevista são definidos pelo servidor, ignoram valores enviados pelo cliente e permanecem iguais após reiniciar o backend.
- **Teste de reinicialização:** passou no backend; após reiniciar o servidor, a expedição manteve o mesmo `departAtMs` e `arriveAtMs`, e o tempo restante diminuiu.
- **Validação de navegador/dispositivo:** ainda pendente; não há alegação de teste manual real da interface.
- **Pendente antes de considerar concluído:** validar a experiência visual em execução: iniciar, esperar, resgatar, confirmar o HUD e fechar/reabrir a aplicação.
- **Segurança antes de multiplayer público:** a autenticação ainda contém fluxos de protótipo; validar tokens reais de provedores, limites de requisição e atomicidade/concorrência da persistência.
- **Balanceamento:** duração e recompensas atuais são valores de protótipo e precisam de avaliação de economia.

## Critérios de aceite

- [x] Snapshot malicioso não aumenta recursos no servidor.
- [x] Save legado não substitui o saldo canônico de recursos.
- [x] Marcha não pode ser coletada antes da chegada.
- [x] Duração e recompensa enviadas pelo cliente são ignoradas.
- [x] Uma marcha concede recompensa no máximo uma vez.
- [x] Teste de integração para persistência do timestamp após reiniciar o backend.
- [x] Interface conectada à API para iniciar, acompanhar e resgatar expedições.
- [x] Rotas de expedição desenhadas no mapa e no minimapa.
- [x] Workflow de CI verde no commit de implementação verificado (7/7 testes; 0 falhas).
- [ ] Teste real em navegador/dispositivo: iniciar, esperar, resgatar, confirmar saldo e fechar/reabrir.
