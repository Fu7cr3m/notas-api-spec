# Notas API

Servidor HTTP em TypeScript/Fastify para a API de notas privadas. O contrato
autoritativo continua em
[`specs/001-notes-api-baseline/contracts/openapi.yaml`](./specs/001-notes-api-baseline/contracts/openapi.yaml).
A implementação e os testes da primeira versão executável estão descritos em
[`specs/002-notes-api-server/`](./specs/002-notes-api-server/).

## Requisitos locais

- Node.js 24 LTS e npm.
- Docker Desktop com o engine Linux em execução para PostgreSQL e Supabase Auth.
- Nenhuma credencial de produção; a confirmação de e-mail é desabilitada apenas na
  configuração da stack Supabase local.

## Iniciar localmente

No PowerShell, a partir da raiz do repositório:

```powershell
npm ci
npm run db:start
Copy-Item .env.example .env
npx supabase status
```

Edite `.env` e preencha `SUPABASE_URL` com a URL local da API e
`SUPABASE_ANON_KEY` com a chave pública `anon`/publishable mostrada pelo Supabase.
Não use nem copie a chave `service_role`. O arquivo `.env` é ignorado pelo Git.

Prepare a base local e execute a API:

```powershell
npm run db:reset
npm run dev
```

O servidor escuta em `http://127.0.0.1:3000` por padrão. `GET /health/live` verifica
o processo e `GET /health/ready` verifica Auth e Data API locais. `npm run db:reset`
recria o banco e apaga os dados locais; não o execute se quiser preservar os dados.
O roteiro de aceitação no quickstart demonstra a criação de duas identidades
temporárias locais para conferir o isolamento entre usuários.

## Validar

```powershell
npm run typecheck
npm run contract:lint
npm test
npm run test:integration
```

Os testes de integração precisam da stack Supabase local iniciada e exercitam
autenticação, CRUD, persistência, validação, paginação, isolamento entre usuários e
privacidade dos logs. Para mais detalhes e um roteiro de aceitação, consulte
[`specs/002-notes-api-server/quickstart.md`](./specs/002-notes-api-server/quickstart.md).

## Validação desta implementação

Verificado com Node.js 24 e Supabase local: `npm run typecheck`, `npm test` (4 testes),
`npm run contract:lint` e `npm run test:integration` (17 testes) passaram. Os testes de
integração usam apenas identidades e dados locais descartáveis; nenhuma credencial de
produção é necessária.
