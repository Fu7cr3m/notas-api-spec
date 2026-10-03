---

description: "Tarefas para implementar o servidor executável da API de notas"
---

# Tasks: Servidor Executável da API de Notas

**Input**: Documentos de design em `specs/002-notes-api-server/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/README.md`, `quickstart.md`

**Tests**: Testes automatizados são obrigatórios por FR-011 e FR-012. Escrever e
executar cada teste de história antes de sua implementação, confirmando que falha pelo
comportamento ainda ausente.

**Organization**: Tarefas agrupadas pelas histórias de usuário, com fundação comum
concluída antes das histórias dependentes.

## Convenções

- `[P]` marca somente trabalho em arquivos diferentes, sem dependência incompleta.
- `[US1]`, `[US2]` e `[US3]` rastreiam as histórias da especificação.
- A API pública deve permanecer compatível com
  `specs/001-notes-api-baseline/contracts/openapi.yaml`.
- A suíte de integração requer Docker Desktop ativo e a stack Supabase local iniciada.
- Nenhuma tarefa pode usar a chave `service_role` para operações de usuário ou
  gravá-la em arquivos versionados.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar projeto TypeScript, configuração local e Supabase CLI.

- [X] T001 Criar ou ampliar `.gitignore` para ignorar `node_modules/`, `dist/`, `coverage/`, `.env` e `.env.*` preservando `.env.example`, além de `.supabase/`, sem ignorar migrações em `supabase/`.
- [X] T002 Inicializar `package.json`, `package-lock.json` e `tsconfig.json` com TypeScript, Fastify, `@supabase/supabase-js`, Supabase CLI, Redocly CLI 2.57.0 e parser YAML de desenvolvimento; criar scripts `dev`, `build`, `start`, `typecheck`, `test`, `test:integration`, `db:start`, `db:reset` e `contract:lint` apontando para os caminhos definidos no plano.
- [X] T003 Inicializar e configurar `supabase/config.toml` para a stack local, portas locais documentadas e confirmação por e-mail desabilitada apenas no ambiente local de teste.
- [X] T004 Criar `src/config/env.ts` para validar variáveis obrigatórias na inicialização e `.env.example` apenas com nomes e valores de exemplo não secretos; reportar nomes ausentes sem imprimir valores.

**Checkpoint**: Projeto npm, configuração TypeScript, Supabase local e esquema de
configuração versionável estão prontos.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Estabelecer autenticação tipada, respostas de erro, banco com RLS e
utilitários locais de teste compartilhados.

**Checkpoint**: Nenhuma história começa até que fundação, migração e testes locais
compartilhados estejam prontos.

- [X] T005 Criar `src/schemas/problem.ts` com o schema RFC 9457 usado nas respostas `application/problem+json`, incluindo a extensão de erros por campo, e o tratamento Fastify para erros esperados e falhas internas sem detalhes sensíveis.
- [X] T006 Criar `src/plugins/supabase.ts` com cliente público Supabase configurado sem persistência de sessão no servidor e fábrica de cliente por solicitação que encaminhe somente o bearer token verificado; não incluir nem ler chave `service_role`.
- [X] T007 Criar migração em `supabase/migrations/20261001000000_create_notes.sql` para `public.notes` com UUID `id`, `owner_id` referenciando `auth.users(id)`, título e conteúdo `NOT NULL` com `CHECK` que rejeite valores compostos apenas por espaços, `created_at` e `updated_at` UTC, RLS obrigatória, privilégios apenas para `authenticated`, políticas CRUD condicionadas por `auth.uid() = owner_id` e trigger que atualize `updated_at`.
- [X] T008 Criar `tests/integration/helpers/supabase.ts` para obter configuração da stack local, registrar dois usuários de teste com endereços únicos por execução, devolver tokens de usuário e limpar notas de cada identidade ao final dos testes sem exigir conta ou segredo de produção.

---

## Phase 3: User Story 1 - Executar a API localmente e autenticar (Priority: P1)

**Goal**: Desenvolvedores iniciam a API localmente, verificam prontidão e autenticam
identidades de teste com Supabase Auth.

**Independent Test**: Seguir a configuração local sem credenciais de produção; iniciar
a stack e a API; verificar prontidão; confirmar que tokens locais válidos identificam
seus sujeitos e que tokens ausentes, inválidos, expirados ou com emissor incorreto
recebem 401 sem dados.

### Tests for User Story 1

- [X] T009 [P] [US1] Escrever testes em `tests/integration/health.test.ts` para `/health/live` e `/health/ready`: estado saudável, dependência local indisponível retornando não pronto e respostas sem segredos nem conteúdo privado.
- [X] T010 [P] [US1] Escrever testes em `tests/integration/auth.test.ts` para autenticação com token Supabase válido, ausência de token, token inválido, token expirado e token de emissor/projeto diferente; verificar 401 e ausência de dados em todas as falhas.

### Implementation for User Story 1

- [X] T011 [US1] Criar `src/app.ts` para construir a instância Fastify separada do listener, registrar plugins compartilhados e schema de erro, e configurar logger para redigir `authorization`, tokens e segredos sem registrar corpos de notas.
- [X] T012 [US1] Criar `src/plugins/authentication.ts` para exigir bearer token, verificá-lo com `supabase.auth.getClaims(token)`, validar emissor/projeto esperado e prazo de expiração, e anexar apenas o sujeito verificado à identidade tipada da solicitação.
- [X] T013 [US1] Criar `src/routes/health.ts` com `GET /health/live` e `GET /health/ready`; retornar somente status, usar 503 quando dependência essencial não estiver pronta e nunca incluir configuração ou dados de notas.
- [X] T014 [US1] Criar `src/server.ts` para carregar e validar configuração, registrar a aplicação, iniciar listener em `127.0.0.1`/porta configurável e encerrar Fastify e dependências de forma limpa em sinais de término.

**Checkpoint**: A API local inicia, reporta disponibilidade sem expor dados, verifica
tokens Supabase e rejeita credenciais inválidas.

---

## Phase 4: User Story 2 - Criar e listar notas privadas (Priority: P1)

**Goal**: Usuários autenticados criam notas persistentes e listam somente suas notas,
com total, paginação e ordenação do contrato.

**Independent Test**: Com dois usuários autenticados, User A cria notas, confirma
persistência após reiniciar somente o servidor e lista páginas em ordem estável; User
B recebe lista vazia e total zero para os mesmos dados.

### Tests for User Story 2

- [X] T015 [P] [US2] Escrever testes em `tests/integration/notes-crud.test.ts` para criar notas válidas e rejeitar título/conteúdo ausentes, vazios, somente espaços e propriedades extras; validar status, headers, `application/problem+json` e formato da resposta conforme `specs/001-notes-api-baseline/contracts/openapi.yaml`.
- [X] T016 [P] [US2] Escrever testes em `tests/integration/notes-pagination.test.ts` para coleção vazia, limite padrão 50, máximo 100, limite inválido, offset negativo, total restrito ao usuário e ordenação `createdAt ASC, id ASC` em páginas consecutivas.
- [X] T017 [P] [US2] Escrever teste em `tests/integration/notes-persistence.test.ts` que crie nota, encerre e reconstrua a aplicação mantendo Supabase local, e confirme que a nota segue disponível somente ao proprietário.

### Implementation for User Story 2

- [X] T018 [US2] Criar `src/schemas/notes.ts` com schemas Fastify de entrada e saída para `NoteInput`, `Note` e `NotePage`, exigindo título e conteúdo não vazios nem compostos apenas por espaços e rejeitando campos extras conforme o contrato base.
- [X] T019 [US2] Criar `src/services/notes.ts` com operações de criação e listagem usando cliente autenticado por solicitação; derivar `owner_id` apenas do sujeito verificado, aplicar escopo RLS, ordenação `created_at ASC, id ASC` antes da paginação, `limit` padrão 50/máximo 100, `offset` não negativo e contagem exata restrita ao proprietário.
- [X] T020 [US2] Implementar `POST /notes` e `GET /notes` em `src/routes/notes.ts`, vinculando schemas, autenticação, respostas 201/200 e erros 400/401/500 do contrato; criação retorna `Location` e nenhum handler aceita proprietário no corpo.

**Checkpoint**: Criação e listagem autenticadas persistem em PostgreSQL local, obedecem
ao RLS e correspondem aos schemas e à paginação da baseline.

---

## Phase 5: User Story 3 - Consultar, atualizar e excluir notas próprias (Priority: P2)

**Goal**: Permitir o ciclo de vida individual completo sem possibilitar acesso a notas
de outro usuário.

**Independent Test**: User A consulta, substitui campos e exclui sua nota; User B recebe
a mesma resposta 404 para notas próprias de A em consulta, atualização e exclusão; uma
atualização inválida preserva ambos os valores anteriores.

### Tests for User Story 3

- [X] T021 [P] [US3] Escrever testes em `tests/integration/notes-isolation.test.ts` para duas identidades tentarem GET, PUT e DELETE cruzados; exigir 404 idêntico a nota inexistente, nenhuma alteração e ausência de conteúdo privado.
- [X] T022 [P] [US3] Escrever testes em `tests/integration/notes-crud.test.ts` para consulta individual, PUT válido preservando criação e alterando atualização, PUT inválido atômico, DELETE 204 sem corpo e GET/DELETE posterior retornando o 404 do contrato.

### Implementation for User Story 3

- [X] T023 [US3] Adicionar consulta individual, atualização integral e exclusão a `src/services/notes.ts`, confiando no cliente usuário e RLS, preservando proprietário/ID/criação, atualizando horário de modificação e convertendo ausência ou falta de propriedade na mesma condição indisponível.
- [X] T024 [US3] Implementar `GET /notes/{noteId}`, `PUT /notes/{noteId}` e `DELETE /notes/{noteId}` em `src/routes/notes.ts` com schemas e respostas 200/204/400/401/404/500 compatíveis com o contrato; a resposta 204 não deve ter corpo.

**Checkpoint**: Os cinco endpoints passam cenários de proprietário, não proprietário,
validação, timestamps, exclusão e erros sem revelar existência de notas privadas.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Tornar ambiente local reproduzível, provar compatibilidade, segurança dos
logs e cobertura dos requisitos antes da entrega.

- [X] T025 [P] Criar teste em `tests/unit/config.test.ts` para configuração válida, variáveis ausentes, erros que listam apenas nomes de variáveis e ausência de gravação/impressão de seus valores.
- [X] T026 [P] Criar teste em `tests/integration/logging-redaction.test.ts` que envie bearer token e conteúdo identificável de nota, capture logs Fastify e confirme que nenhum dos valores aparece nos logs comuns.
- [X] T027 [P] Criar `tests/contract/openapi-compatibility.test.ts` para carregar o contrato OpenAPI canônico com o parser YAML de desenvolvimento e verificar as cinco rotas/operações, schemas, status de sucesso e erros observáveis implementados, sem modificar ou copiar a definição canônica.
- [X] T028 Configurar `package.json` para executar `contract:lint` com Redocly CLI 2.57.0 e validar o documento canônico `specs/001-notes-api-baseline/contracts/openapi.yaml`, sem adicionar uma segunda cópia do contrato.
- [X] T029 Atualizar `README.md` com requisitos, setup Supabase, comandos npm, configuração `.env.example`, geração de dois usuários de desenvolvimento, execução dos testes e avisos de segurança sem incluir credenciais.
- [X] T030 Atualizar `specs/002-notes-api-server/quickstart.md` e conferir a presença de comandos implementados para iniciar, testar, validar o contrato e testar isolamento; documentar que `db:reset` apaga os dados locais.
- [X] T031 Executar `npm run typecheck`, `npm test`, `npm run contract:lint` e `npm run test:integration` com Docker/Supabase locais ativos; resolver erros, validar compatibilidade e registrar resultados verificáveis em `README.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001–T004; antes de dependências, configuração local ou código.
- **Foundational (Phase 2)**: T005–T008; depende da configuração; bloqueia histórias.
- **User Stories (Phase 3+)**: histórias dependem da fundação. US2 usa autenticação e
  inicialização implementadas em US1, portanto executa após US1; US3 usa os schemas,
  serviço e rotas iniciados em US2, portanto executa após US2.
- **Polish (Phase 6)**: T025–T027 podem ocorrer após seus pontos de integração estarem
  disponíveis; T028–T031 ocorrem depois das histórias e da documentação inicial.

### User Story Dependencies

- **US1 (P1)**: depende de T001–T008; fornece ambiente, app Fastify, autenticação e
  saúde local.
- **US2 (P1)**: depende de US1 para identidade autenticada, app, configuração e
  stack local; fornece criação e listagem MVP.
- **US3 (P2)**: depende de US2 para nota persistente, schemas e rotas compartilhadas;
  completa consulta, atualização e exclusão.

### Parallel Opportunities

- T001 pode ser feito em paralelo com T003; T002 e T004 dependem da configuração de
  projeto e devem seguir conforme seus arquivos.
- T005, T006 e T007 alteram arquivos diferentes e podem ser feitos em paralelo após
  setup; T008 depende de Supabase local/T003 e da configuração concluída.
- Dentro de cada história, testes que alteram arquivos diferentes são paralelos entre
  si; executar todos os testes definidos antes da implementação correspondente.
- No Polish, T025, T026 e T027 alteram arquivos diferentes e podem ocorrer em
  paralelo após app, integração e dependências existirem.
- US1, US2 e US3 são incrementais e dependentes; não paralelizar alterações às mesmas
  rotas ou serviços.

### Parallel Example: User Story 2 Tests

```text
Task: T015 tests/integration/notes-crud.test.ts
Task: T016 tests/integration/notes-pagination.test.ts
Task: T017 tests/integration/notes-persistence.test.ts
```

### Parallel Example: Final Verification Assets

```text
Task: T025 tests/unit/config.test.ts
Task: T026 tests/integration/logging-redaction.test.ts
Task: T027 tests/contract/openapi-compatibility.test.ts
```

## Implementation Strategy

### MVP First (US1 and US2)

1. Complete Setup and Foundational phases; start Docker Desktop and `supabase start`.
2. Complete US1 and verify local readiness and Supabase token authentication.
3. Complete US2 and verify authenticated create/list, validation, ownership scope,
   count, stable pagination, and persistence.
4. Run the US1/US2 test subsets and canonical OpenAPI lint before proceeding.

### Incremental Delivery

1. Local project/configuration and Supabase migration foundation.
2. US1 local server, operational health, and verified authentication.
3. US2 create/list notes with persistence and row-level ownership security.
4. US3 get/update/delete with uniform non-disclosing 404 behavior.
5. Cross-cutting logging/config/contract tests, quickstart, and full verification.

## Notes

- Every implementation task names at least one concrete repository path.
- Story test tasks precede their corresponding implementation tasks (T009–T010 before
  T011–T014; T015–T017 before T018–T020; T021–T022 before T023–T024).
- `src/services/notes.ts` and `src/routes/notes.ts` intentionally span US2 and US3;
  US3 work must not begin until US2 establishes their shared foundation.
- Docker Desktop was installed but its Linux daemon was unavailable during planning;
  integration tests cannot pass until the user starts the daemon.
- Tests must not require an externally hosted project or production Supabase secrets.
