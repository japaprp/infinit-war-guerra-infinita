# Seguranca e Vinculacao Social

## O que foi adicionado
- Vinculacao Google/Facebook via Firebase Auth (`auth/auth.js`).
- Bloqueio de entrada sem conta vinculada (`main.js`).
- Save assinado com checksum + ownerUid (`engine/game.js`).
- Verificacao de integridade do save ao carregar.
- Cooldown anti-spam para coleta/combate/compra.
- Hardening no Electron:
  - `nodeIntegration: false`
  - `contextIsolation: true`
  - `sandbox: true`
  - bloqueio de `window.open`, navegacao externa e permissao de runtime.
- CSP basica em `index.html` e `game.html`.

## Configuracao do Firebase
1. Crie um projeto no Firebase.
2. Ative os provedores Google e Facebook em Authentication.
3. Preencha `auth/firebase-config.js` com as chaves do projeto.
4. Em Facebook, configure App ID/Secret e URL de callback no Firebase.

## Limites de seguranca (importante)
- Como o jogo ainda roda localmente no cliente, nenhuma protecao client-side impede engenharia reversa total.
- Para seguranca real de economia e loja virtual:
  - Backend autoritativo.
  - Validacao de compra no servidor.
  - Save/progresso em banco remoto com token assinado.
