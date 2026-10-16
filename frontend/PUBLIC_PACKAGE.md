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

## Bloqueios antes de publicar

1. A configuração Firebase atualmente é um modelo sem chaves; login Google/Facebook não estará operacional até a configuração explícita.
2. As políticas CSP ainda contêm localhost e não incluem o host final da API. Não inventar ou preencher URL antes de existir um endereço confirmado.
3. O endereço da API e a origem pública do frontend ainda não foram definidos.
4. Rodar os testes de pacote, persistência, integração e backend e corrigir falhas antes de tornar a PR pronta.
5. Hospedar apenas `frontend/public`; nunca a raiz do repositório.

Nenhum banco, serviço de hospedagem, DNS ou recurso pago é criado por esta preparação.
