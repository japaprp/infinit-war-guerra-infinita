# Pacote público do frontend — Infinit War

## Escopo

A pasta `frontend/public/` é uma cópia explícita dos arquivos necessários às duas páginas do navegador. Ela **não é ainda uma implantação** e não deve ser publicada até que os testes, a configuração Firebase e os endereços de API/CSP sejam revisados.

## Publicação permitida

O diretório público contém apenas:
- `index.html`, `game.html`, `style.css`, `main.js`
- `api/client.js`, `api/config.js`
- `auth/auth.js`, `auth/firebase-config.js`
- `engine/game.js`, `engine/ui.js`
- `entities/player.js`

O teste `tests/public-frontend-package.test.mjs` exige que a lista corresponda exatamente a essa allowlist, que os arquivos publicados sejam cópias idênticas das fontes e que as dependências locais de HTML existam.

## Blueprint do frontend no Render

O arquivo `render-frontend.yaml` descreve um site estático separado chamado `infinit-war-web` e publica **somente** `frontend/public/`. O blueprint não contém banco, chaves privadas nem configuração da API; ele é apenas preparação versionada e **não foi aplicado ao Render**. Não criar/aplicar o Blueprint nem publicar o site até a revisão e autorização explícita.

O teste de pacote também verifica que o caminho de publicação não pode ser a raiz do repositório. O blueprint usa um comando sem etapa de build porque os arquivos são HTML/CSS/JavaScript estáticos.

## Bloqueios antes de publicar

1. A configuração Firebase contém valores de projeto. Antes de publicar, confirmar no Console Firebase o projeto correto, os domínios autorizados, os provedores de login habilitados e as restrições da chave de API; esses valores de cliente não substituem essa validação.
2. As páginas agora apontam para `https://infinit-war-api.onrender.com` e incluem esse host exato em `connect-src`. A API ainda precisa inicializar com banco e variáveis válidas antes de testar a comunicação real.
3. O endereço da API está confirmado; a origem pública do frontend ainda não foi definida.
4. Rodar os testes de pacote, persistência, integração e backend e corrigir falhas antes de tornar a PR pronta.
5. Hospedar apenas `frontend/public`; nunca a raiz do repositório.

Nenhum banco, serviço de hospedagem, DNS ou recurso pago é criado por esta preparação.
