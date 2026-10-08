# Research: Servidor Executável da API de Notas

## Decisions

### TypeScript, Node.js, and Fastify

- **Decision**: Implement a single Fastify service in TypeScript on Node.js 24 LTS.
- **Rationale**: This matches the user's selected framework, the available local Node.js
  24.19.0 runtime, and Fastify's documented TypeScript support.
- **Alternatives considered**: Other frameworks were not evaluated because the
  framework choice was explicitly made by the user. A separate frontend or multi-
  service layout is unnecessary for this API.
- **Sources**: [Fastify TypeScript reference](https://fastify.dev/docs/latest/Reference/TypeScript/);
  [Node.js release schedule](https://github.com/nodejs/release).

### Local PostgreSQL and Supabase Auth

- **Decision**: Run the Supabase local stack through its project-scoped CLI, which
  launches the local database, Auth, and API services together.
- **Rationale**: This supplies the selected PostgreSQL and Supabase Auth dependencies
  in a reproducible local environment and in CI. The Supabase CLI requires Docker and
  an initialized `supabase/` project. Local Auth e-mail confirmation is disabled only
  for the local stack so throwaway test identities do not require an e-mail service.
- **Alternatives considered**: An independent PostgreSQL container would omit the
  selected auth service and require additional local integration. A hosted Supabase
  project would require remote credentials and is not necessary for local tests.
- **Sources**: [Supabase CLI local development](https://supabase.com/docs/guides/local-development/cli/getting-started);
  [Supabase CLI Docker requirement](https://supabase.com/docs/guides/local-development/cli/getting-started).

### Supabase Auth token verification

- **Decision**: Use the Supabase JavaScript client's `auth.getClaims(token)` to verify
  each explicit bearer token and obtain the verified subject. Reject missing,
  expired, invalid, or wrong-project credentials before executing note operations.
- **Rationale**: Supabase documents `getClaims` as a token-verification API and
  advises using a maintained verifier rather than implementing JWT cryptography.
  Verified JWT claims carry the issuer, expiry, and user subject.
- **Alternatives considered**: Manually decoding tokens or implementing signature
  validation is not acceptable. An admin/service-role identity must not substitute
  for the caller's user identity.
- **Sources**: [Supabase JWT guide](https://supabase.com/docs/guides/auth/jwts);
  [Supabase JavaScript `getClaims`](https://supabase.com/docs/reference/javascript/auth-getclaims).

### PostgreSQL ownership enforcement

- **Decision**: Use user-scoped Supabase JavaScript clients for table operations and
  enable Postgres RLS on `public.notes`; authorize each CRUD action only when
  `auth.uid() = owner_id`. Never use a service-role key for request data access.
- **Rationale**: RLS provides defense in depth at the database boundary. Supabase
  documents that policies are applied to each row but grants must also be configured;
  service-role bypasses RLS and must stay outside user-scoped paths.
- **Alternatives considered**: Filtering only in application code would make an
  omitted predicate a cross-user disclosure. Passing a service-role credential would
  bypass the selected row policies.
- **Sources**: [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security);
  [Supabase JWT guide](https://supabase.com/docs/guides/auth/jwts).

### Database client and query safety

- **Decision**: Use `@supabase/supabase-js` and PostgREST rather than direct `pg`
  connections in application code; keep every request's access token attached to its
  database client.
- **Rationale**: The user-selected Supabase provider and RLS policy are integrated
  with PostgREST request JWT claims. This avoids a second authentication context or
  implementing a custom transaction-local claim propagation layer for direct SQL.
  When SQL is required for migrations, keep it static and version-controlled.
- **Alternatives considered**: `pg` is appropriate for direct PostgreSQL access and
  supports parameterized queries and pooling, but direct connections do not
  automatically carry a Supabase user's JWT/RLS context.
- **Sources**: [Supabase RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security);
  [node-postgres parameterized queries](https://node-postgres.com/features/queries).

### Schema migration and timestamps

- **Decision**: Create a UUID-keyed `notes` table with `owner_id` referencing
  `auth.users`, required nonblank `title` and `content`, immutable creation time, and
  an update trigger for `updated_at`. Apply migrations with the Supabase CLI.
- **Rationale**: Database constraints preserve invariants even if a request path
  bypasses application validation. A database-side timestamp trigger covers all
  update paths consistently.
- **Alternatives considered**: Generating update timestamps only in route code risks
  inconsistent behavior across update paths. The contract keeps the ID opaque and
  therefore accepts the database UUID.
- **Sources**: [Supabase database migrations](https://supabase.com/docs/guides/local-development/cli/migrations);
  [Supabase RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security).

### HTTP testing and logs

- **Decision**: Use Node.js built-in `node:test` and Fastify's in-process `inject`
  API for unit and HTTP integration tests; run integration tests against a started
  local Supabase stack. Configure Fastify/Pino redaction for authorization headers
  and do not log request bodies.
- **Rationale**: Fastify supports in-process request injection and Node provides a
  built-in test runner; these allow realistic HTTP tests without binding a test port.
  Request body suppression avoids accidental logging of note content.
- **Alternatives considered**: A separate test framework is not required for this
  first service. A hosted auth/database test environment would add secrets and
  network dependence to local development.
- **Sources**: [Fastify testing guide](https://fastify.dev/docs/latest/Guides/Testing/);
  [Node.js test runner](https://nodejs.org/api/test.html);
  [Supabase CLI local development](https://supabase.com/docs/guides/local-development/cli/getting-started).

## Repository and Environment Findings

- The repository is currently documentation-only; Node.js 24.19.0, npm 11.17.0,
  and Docker CLI 29.8.1 are installed in the development environment.
- The Docker CLI could not connect to the Docker Desktop Linux engine during planning.
  Starting the local Supabase stack will therefore require starting Docker Desktop.
- No npm manifest, application source, database migration, or test runner exists yet.
