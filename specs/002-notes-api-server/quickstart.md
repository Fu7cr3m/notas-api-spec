# Quickstart: Servidor Executável da API de Notas

This guide describes the intended local workflow. Docker Desktop must be running
before starting the local Supabase stack. No production credentials are required.

## Prerequisites

- Node.js 24 LTS and npm.
- Docker Desktop with the Linux container engine running.
- PowerShell on Windows, or equivalent shell commands on other supported developer
  platforms.

## Setup

From the repository root:

```powershell
npm ci
npm run db:start
Copy-Item .env.example .env
npx supabase status
```

Set `SUPABASE_URL` to the displayed local `API_URL` and `SUPABASE_ANON_KEY` to the
displayed public `ANON_KEY` or publishable key. Do not copy the `SERVICE_ROLE_KEY`.
The values in `.env.example` are placeholders; the server reports missing settings
without printing their values. `.env` is ignored by Git; never commit local keys or
credentials.

Apply database migrations and start the service:

```powershell
npm run db:reset
npm run dev
```

`npm run db:reset` rebuilds the local database from migrations and removes local
database contents; run it only when a clean local database is intended. To verify
persistence, restart the API process without resetting the Supabase database.

The service listens on `http://127.0.0.1:3000` by default. The health routes
`GET /health/live` and `GET /health/ready` return a small status object without
credentials or note data.

## Automated Validation

Run from the repository root:

```powershell
npm run typecheck
npm run contract:lint
npm test
npm run test:integration
```

- `typecheck` checks the TypeScript project.
- `build` compiles the service to `dist/`; `npm start` runs the compiled server.
- `contract:lint` validates the baseline OpenAPI document without requiring a server.
- `test` runs unit and canonical-contract compatibility tests.
- `test:integration` exercises auth, persistence, ownership isolation, validation,
  pagination, log privacy, and errors against local Supabase. Ensure Docker and
  `npm run db:start` are ready first.

## Acceptance Walkthrough

Set two local user access tokens issued by the local Supabase Auth service:

```powershell
$BaseUrl = "http://127.0.0.1:3000"
$SupabaseUrl = "http://127.0.0.1:54321"
$SupabaseAnonKey = "<local anon key from .env>"
$RunId = [guid]::NewGuid().ToString("N")
$LocalPassword = [guid]::NewGuid().ToString("N") + "Aa1!"
$AuthHeaders = @{ apikey = $SupabaseAnonKey }
$UserA = Invoke-RestMethod -Method Post -Uri "$SupabaseUrl/auth/v1/signup" -Headers $AuthHeaders -ContentType "application/json" -Body (@{ email = "notes-a-$RunId@example.test"; password = $LocalPassword } | ConvertTo-Json)
$UserB = Invoke-RestMethod -Method Post -Uri "$SupabaseUrl/auth/v1/signup" -Headers $AuthHeaders -ContentType "application/json" -Body (@{ email = "notes-b-$RunId@example.test"; password = $LocalPassword } | ConvertTo-Json)
$UserAToken = $UserA.access_token
$UserBToken = $UserB.access_token
```

Create a note as User A:

```powershell
curl.exe -i -H "Authorization: Bearer $UserAToken" -H "Content-Type: application/json" --data-binary '{"title":"Teste local","content":"Verificar persistência e isolamento."}' "$BaseUrl/notes"
```

Expect `201 Created`. Use the returned note identifier to list and read as User A;
confirm it is absent from User B's list and that User B receives the same 404
behavior as a nonexistent note when trying to read, update, or delete it.

Run the integration suite for complete verification. All valid operations and errors
must match the canonical contract in
[`contracts/README.md`](./contracts/README.md).
