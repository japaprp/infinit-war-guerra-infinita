# Backend Autoritativo - Infinit War (Opcao 1)

## Objetivo
- Sessao JWT no servidor
- Save/progresso sincronizado no backend
- Validacao de compra no servidor (fluxo de recibo)

## Estrutura
- `backend/src/app.js`: bootstrap da API Express
- `backend/src/routes/legacyRoutes.js`: endpoints legados usados pelo cliente atual (`/auth`, `/player`, `/shop`)
- `backend/src/routes/v1Routes.js`: stubs REST centrais (`/v1/*`) conforme plano tecnico
- `backend/src/services/*`: regras de negocio e stubs de dominio
- `backend/src/grpc/server.js`: stubs gRPC centrais
- `backend/src/repositories/dbRepository.js`: persistencia com `DATA_DRIVER=json|mysql` (MySQL normalizado em `users/heroes/buildings/inventory/alliances` + `app_state` para compatibilidade)
- `backend/sql/001_init.sql`: schema inicial MySQL
- `api/client.js`: cliente HTTP usado pelo jogo
- `api/config.js`: URL base da API

## Setup
1. (Raiz do projeto) valide ambiente:
   - `npm run check:env`
2. Copie `backend/.env.example` para `backend/.env`
3. Defina segredos fortes em:
   - `JWT_SECRET`
   - `RECEIPT_SECRET`
4. Se for usar MySQL (XAMPP), configure:
   - `DATA_DRIVER=mysql`
   - `MYSQL_HOST=127.0.0.1`
   - `MYSQL_PORT=3306`
   - `MYSQL_DATABASE=infinitwar`
   - `MYSQL_USER=root`
   - `MYSQL_PASSWORD=` (vazio no padrao XAMPP)
5. Instale dependencias do backend:
   - `cd backend`
   - `npm install`
6. Rode migracao SQL:
   - `npm run migrate:mysql`
7. Suba backend:
   - `npm run dev`
8. (Opcional) suba stubs gRPC:
   - `npm run dev:grpc`

## Setup rapido (somente JSON local)
1. Copie `backend/.env.example` para `backend/.env`
2. Defina segredos fortes em:
   - `JWT_SECRET`
   - `RECEIPT_SECRET`
3. Defina `DATA_DRIVER=json`
4. Instale dependencias do backend:
   - `cd backend`
   - `npm install`
5. Suba backend:
   - `npm run dev`
6. (Opcional) Suba stubs gRPC:
   - `npm run dev:grpc`

## Rodando o jogo com backend
- Em outra janela terminal (raiz do projeto):
  - `npm run dev`
- URL backend default: `http://localhost:4000`

## Endpoints principais
- `POST /auth/session`: troca sessao social por JWT do jogo
- `GET /player/state`: recupera estado do jogador
- `PUT /player/state`: atualiza estado do jogador
- `POST /shop/mock-receipt`: cria recibo assinado (simulacao de gateway)
- `POST /shop/purchase`: valida recibo e efetiva compra
- `POST /v1/auth/login` e `GET/POST /v1/*`: contratos REST centrais (stubs iniciais)

## Testes automatizados
- Local:
  - `npm --prefix backend run test:integration`
- CI (GitHub Actions):
  - Workflow: `.github/workflows/backend-integration.yml`
  - Dispara em `push` e `pull_request` quando houver alteracoes em `backend/**`

## Observacoes importantes
- Este backend ja e autoritativo para gemas na compra.
- Quando `DATA_DRIVER=mysql`, leitura e escrita principais usam tabelas normalizadas.
- `receipts` tambem esta normalizado em tabela dedicada.
- `app_state` continua sendo atualizado como camada de compatibilidade/rollback.
- Redis e opcional no desenvolvimento local (fallback em memoria para lock/idempotencia).
- Para producao real:
  - Banco transacional real (MySQL/Aurora)
  - HTTPS
  - Rate limiting no servidor (IP/uid)
  - Verificacao real de compra Google Play/App Store
  - Refresh token + revogacao de sessao

