# Implementation Plan: Servidor Executável da API de Notas

**Branch**: `agents/speckit-constitution-update` | **Date**: 2026-10-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-notes-api-server/spec.md`

## Summary

Implement the existing notes API contract as a local-development-ready TypeScript
service using Fastify. Use the Supabase local stack for Auth and PostgreSQL, verify
incoming access tokens with Supabase Auth, and forward the verified user's bearer
token for database requests so PostgreSQL Row Level Security (RLS) enforces ownership.
Keep the OpenAPI contract from feature 001 authoritative and add automated API
integration tests against the local Supabase stack.

## Technical Context

**Language/Version**: TypeScript on Node.js 24 LTS; the current development machine
has Node.js 24.19.0

**Primary Dependencies**: Fastify; `@supabase/supabase-js` for token verification and
user-scoped database access; Supabase CLI as a pinned development dependency;
TypeScript and Node.js built-in test runner

**Storage**: PostgreSQL from the Supabase local stack; SQL migrations define the notes
table, ownership policies, and update-time trigger

**Testing**: Node.js `node:test` with Fastify `inject`; integration tests use two
locally registered Supabase Auth users and the local PostgreSQL/RLS policies.
Redocly CLI 2.57.0 validates the canonical OpenAPI contract.

**Target Platform**: Local development and CI on Node.js 24 with Docker Engine; a
production hosting platform is out of scope

**Project Type**: Single TypeScript HTTP API service

**Performance Goals**: No production throughput or latency SLO is specified. Preserve
the baseline acceptance goal of completing the documented create-and-list flow within
one minute in the local quickstart.

**Constraints**: Preserve the contract in
`specs/001-notes-api-baseline/contracts/openapi.yaml`; all five note operations require
Supabase-authenticated identities. Do not use or expose a Supabase service-role key in
the API process. Keep `.env` and generated credentials untracked. Docker Desktop's
Linux daemon must be running to start Supabase locally.

**Scale/Scope**: One notes resource with title, content, owner and timestamps; five
contracted operations; local auth, persistent PostgreSQL, RLS, automated tests, and
health checks only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate for this feature | Status |
|-----------|----------------------|--------|
| Contract-First API Definition | Implement and test against the existing OpenAPI contract; document any proposed incompatibility before changing it. | PASS |
| Consistent and Explicit Contracts | Keep request/response schemas, status codes, authentication behavior, and errors aligned with the baseline. | PASS |
| Backward-Compatible Evolution | Add local operational health routes without changing the five note operation contracts; review any public API changes before adoption. | PASS |
| Validation and Quality Gates | Run OpenAPI lint, typecheck, automated tests, and reference/example validation before completion. | PASS |
| Usable API Documentation | Provide runnable local setup, configuration, test, and expected-result instructions without including secrets. | PASS |

No constitution violations or unjustified exceptions identified. Health endpoints are
operational routes additive to the existing public notes contract.

## Planning Decisions

- Use the Supabase CLI local stack for both PostgreSQL and Supabase Auth rather than
  running an independent PostgreSQL container; this keeps the local auth issuer and
  database aligned with production Supabase behavior. The CLI requires the Docker
  daemon; start Docker Desktop before running `supabase start`.
- Use `@supabase/supabase-js` to verify explicit bearer tokens with
  `auth.getClaims(token)`, then create a request-scoped client carrying that same
  token for PostgREST access. Database roles and RLS policies scope each query to the
  authenticated user. Do not trust a client-provided owner field or use the
  service-role key for request handling.
- Enable RLS on `public.notes`, grant only the operations needed by the
  `authenticated` role, and define select/insert/update/delete policies comparing
  `auth.uid()` to `owner_id`. Do not grant anonymous access to notes.
- Use a database UUID for the opaque note identifier. Map database snake_case fields
  to the baseline contract's camelCase representation in the service boundary.
- Apply exact-count list pagination with `limit` and `offset`; apply `created_at`
  ascending and then `id` ascending before the requested range.
- Keep Fastify route schemas and handlers aligned to the canonical OpenAPI contract.
  Convert framework validation errors and expected data errors to the baseline
  `application/problem+json` shape. Mask unexpected internal errors.
- Add unauthenticated `/health/live` and `/health/ready` operational routes. They
  return only process/readiness status and never configuration values, credentials,
  or note data; do not add them to the public notes OpenAPI contract.
- Extend the root `.gitignore` for `node_modules/`, build/test output, `.env*`
  (allowing `.env.example`), and local Supabase state before adding any environment
  files or dependencies.
- Create test identities by signing up through the local Supabase Auth endpoint.
  Disable e-mail confirmations only in local Supabase Auth configuration, use unique
  addresses per run, and never require production accounts, e-mail access, or a
  service-role secret.
- Use Node.js built-in `node:test` and Fastify `inject` for deterministic HTTP-level
  integration coverage against the local stack; avoid adding a second test framework.

## Project Structure

### Documentation (this feature)

```text
specs/002-notes-api-server/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── README.md
└── tasks.md                     # Created by /speckit-tasks
```

### Source Code (repository root)

```text
package.json
package-lock.json
tsconfig.json
.gitignore
.env.example
src/
├── app.ts
├── server.ts
├── config/
│   └── env.ts
├── plugins/
│   ├── authentication.ts
│   └── supabase.ts
├── routes/
│   ├── health.ts
│   └── notes.ts
├── schemas/
│   ├── problem.ts
│   └── notes.ts
└── services/
    └── notes.ts

supabase/
├── config.toml
├── migrations/
│   └── <timestamp>_create_notes.sql

tests/
├── contract/
│   └── openapi-compatibility.test.ts
├── integration/
│   ├── auth.test.ts
│   ├── health.test.ts
│   ├── logging-redaction.test.ts
│   ├── notes-crud.test.ts
│   ├── notes-isolation.test.ts
│   ├── notes-pagination.test.ts
│   └── notes-persistence.test.ts
└── unit/
    ├── config.test.ts
    └── problem.test.ts
```

**Structure Decision**: Use one npm project at repository root with a small
`src/` service tree, Supabase CLI configuration and migrations under `supabase/`,
and built-in Node tests under `tests/`. Do not create separate frontend/backend
projects or duplicate the canonical OpenAPI document.

## Complexity Tracking

No constitution violations; no complexity exceptions required.
