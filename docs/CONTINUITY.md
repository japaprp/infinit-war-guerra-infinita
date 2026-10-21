# Guerra Infinita — continuidade técnica

Atualizado em: 2026-10-18 (consulta ao GitHub; horário local aproximado)

## Projeto e limites
- Repositório: `japaprp/infinit-war-guerra-infinita`
- Firebase: `guerra-infinita-dd9dd`
- Render API: `infinit-war-api`
- Redis/Valkey: `infinit-war-redis`
- Não misturar com EventosRP ou Perifa-Pro.
- Sem deploy de produção, merge automático, migração destrutiva ou exposição de credenciais.

## Estado observado no GitHub
- PR #31: [Integrate PostgreSQL persistence with auth baseline](https://github.com/japaprp/infinit-war-guerra-infinita/pull/31), branch descrita no workflow como `integration/postgres-auth-isolated`. PR está descrita como draft no corpo consultado; verificar estado e HEAD atuais antes de agir.
- PR #28: [Harden mutation recovery and persistent march operations](https://github.com/japaprp/infinit-war-guerra-infinita/pull/28), alterações descritas para marchas persistidas, idempotência e locks PostgreSQL em desconexões.
- PR #26: [Serialize PostgreSQL state mutations across players](https://github.com/japaprp/infinit-war-guerra-infinita/pull/26), serialização de mutações por advisory lock.
- A listagem de branches mostrou `fix/concurrency-lock-and-march-persistence`, `fix/postgres-concurrent-state-updates`, `fix/postgres-atomic-snapshot-write`, `fix/postgres-driver-env-priority`, `fix/postgres-supabase-migration`, `feat/supabase-postgres-persistence` e `integration/postgres-auth-isolated`. Confirmar heads e relações atuais antes de criar/rebasear branches.
- A busca de PRs retornou PR #31 com resultados de CI relatados como aprovados no texto da PR, mas isso não substitui conferir o estado dos workflows do HEAD atual.
- Revisões formais consultadas para PR #31 e #28 não retornaram reviews.

## Inspeção de código concluída
- `backend/package.json` declara `pg` e `mysql2`; os scripts incluem `test:integration`, `test:config` e `test:deploy`.
- `backend/package-lock.json` existe na branch de integração e registra `pg` e `mysql2`. O arquivo `package-lock.json` na raiz não foi encontrado, o que é compatível com a instalação npm executada em `backend/`.
- `backend/src/postgresCompat.js` implementa tradução de placeholders/upserts e pool `pg` com TLS `rejectUnauthorized: true`, timeout de conexão de 10s e pool máximo 8.
- `backend/src/repositories/dbRepository.js` mantém fallback JSON e tem inicialização SQL específica para MySQL; o caminho PostgreSQL retorna sem executar o esquema MySQL. Confirmar o esquema PostgreSQL e a compatibilidade de todas as consultas antes de considerar integração completa.
- `backend/test/postgres-compat.test.js` cobre placeholders, upserts e timestamps; `backend/test/concurrency.test.js` cobre locks locais e liberação por desconexão. Ler os testes PostgreSQL específicos e verificar se há um teste real de pool/transaction e persistência após reinicialização.
- O esquema `backend/sql/001_init.sql` na branch padrão é MySQL/InnoDB e não deve ser tratado como migração PostgreSQL. Confirmar o arquivo/migração PostgreSQL exato na branch de integração.

## Bloqueio prioritário — credencial PostgreSQL
Workflow encontrado: `.github/workflows/postgres-connection-check.yml`.
- Espera o segredo `GAME_SUPABASE_DATABASE_URL`.
- Faz checkout de `integration/postgres-auth-isolated`, instala `backend/package-lock.json`, verifica sintaxe e executa `backend/scripts/check-postgres-connection.mjs`.
- O script valida protocolo PostgreSQL, exige TLS validado e executa somente `SELECT 1` e `to_regclass('public.app_state')`; não imprime URL nem detalhes da conexão.
- **Falha importante no gate:** quando o segredo está ausente, o script imprime `PG_CONNECTION_CHECK_SKIPPED` e sai com código 0. Assim, uma execução verde pode significar que nenhuma conexão ocorreu. Corrigir esse comportamento para falhar explicitamente se o segredo não estiver configurado e adicionar validação correspondente.
- Não foi possível consultar a existência/valor do segredo nem disparar manualmente o workflow por meio das ferramentas disponíveis nesta sessão. Nunca pedir a URL no chat.
- A ação necessária do usuário, se ainda não configurado: GitHub → repositório → Settings → Secrets and variables → Actions → New repository secret; nome exato `GAME_SUPABASE_DATABASE_URL`, valor da connection string PostgreSQL privada. Depois abrir Actions → PostgreSQL connection check e executar em `integration/postgres-auth-isolated`. Não copiar o valor para conversa, logs ou commits.

## Validação real ainda necessária
1. Confirmar existência do segredo sem revelar seu valor e corrigir o falso sucesso de segredo ausente.
2. Rodar conexão Node.js real e confirmar TLS, autenticação e presença do esquema.
3. Em banco isolado/teste, gravar um registro exclusivo, commit, fechar conexão, reconectar e ler de volta; comparar payloads e limpar com segurança.
4. Testar rollback, falha de conexão, desconexão do cliente, liberação de advisory lock e pool sem vazamento.
5. Confirmar atomicidade de `app_state` com tabelas normalizadas e ausência de lost updates concorrentes.
6. Verificar todos os fluxos de batalha/marchas e persistência após reinício usando o PostgreSQL real, não apenas mocks ou JSON.
7. Reexecutar CI no HEAD final e revisar a cadeia de PRs antes de pedir autorização para publicação.

## Segurança e entrega
- Não fazer deploy, merge ou alteração de dados reais sem autorização explícita.
- Não presumir que resultados anteriores valem para HEADs mais novos.
- Não afirmar conexão PostgreSQL real aprovada enquanto o workflow de conexão Node.js não provar isso e enquanto não houver teste de persistência pós-reconexão.
- Próxima ação: corrigir o gate de segredo ausente em branch isolada e revisar a cadeia PR #26 → #28 → #29 / PR #31; em paralelo, identificar a migração PostgreSQL real e seus testes. Antes de qualquer commit, conferir estado e diff atuais.
