---

description: "Task list for Interface Web para Notas"
---

# Tasks: Interface Web para Notas

**Input**: Design documents from `/specs/003-notes-web-interface/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md

**Tests**: Incluídos (Vitest + Testing Library + MSW), escritos antes da implementação de cada história.

**Format**: `- [ ] T### [P?] [US?] Descrição com caminho`. `[P]` = paralelizável (arquivos diferentes, sem dependência pendente).

## Phase 1: Setup

- [X] T001 Criar o pacote `web/` com `web/package.json` (scripts `dev`, `build`, `preview`, `test`, `typecheck`; dependências react, react-dom, react-router-dom, @supabase/supabase-js; dev: vite, @vitejs/plugin-react, typescript, vitest, jsdom, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, msw, ajv, ajv-formats, yaml) e instalar
- [X] T002 [P] Criar `web/tsconfig.json`, `web/index.html` (lang `pt-BR`, viewport) e `web/src/main.tsx` mínimo
- [X] T003 [P] Criar `web/vite.config.ts` com proxy `/api` → `http://127.0.0.1:3000` (dev e preview, removendo o prefixo `/api`), porta 5173 e configuração do Vitest (jsdom, setup `web/tests/setup.ts`)
- [X] T004 [P] Criar `web/.env.example` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL=/api`), garantir `web/.env` e `web/dist` no `.gitignore` e criar `web/tests/setup.ts` (jest-dom, MSW server); documentar em `web/.env.example` que a chave pública local vem de `npx supabase status` (ver quickstart.md)

## Phase 2: Foundational (bloqueia todas as histórias)

- [X] T005 [P] Criar `web/src/api/types.ts` com `Note`, `NotePage`, `NoteInput`, `ProblemDetails` conforme `specs/001-notes-api-baseline/contracts/openapi.yaml`
- [X] T006 [P] Criar `web/tests/contract/schemas.ts` que carrega `../specs/001-notes-api-baseline/contracts/openapi.yaml` (caminho relativo ao repositório; yaml + Ajv) e expõe validadores de `NoteInput`, `Note`, `NotePage` e `Problem`
- [X] T007 Criar `web/src/api/client.ts`: `fetch` tipado com base `VITE_API_BASE_URL`, header `Authorization: Bearer <access_token>`, parse de `application/problem+json`, 204 sem corpo, erros tipados (`validation`, `unauthorized`, `not-found`, `unavailable`, `invalid-response`) e verificação mínima de formato de respostas de sucesso
- [X] T008 [P] Criar `web/src/auth/supabase.ts` (cliente com URL e chave pública; falhar com mensagem clara se variáveis ausentes; nunca service_role) e `web/src/auth/AuthProvider.tsx` com `onAuthStateChange` expondo `status` (`loading|anonymous|authenticated|recovery`), `session`, `signOut`
- [X] T009 [P] Criar componentes de estado acessíveis em `web/src/components/` (`LoadingState.tsx`, `EmptyState.tsx`, `ErrorState.tsx` com "Tentar novamente", `Alert.tsx` com `role="alert"`) e `web/src/styles.css` fluido a partir de 360 px
- [X] T010 Criar `web/src/App.tsx` com React Router, rotas do `contracts/ui-contract.md`, guarda `RequireAuth` (anônimo → `/login`) e layout com botão de sair; ligar em `web/src/main.tsx`

**Checkpoint**: base pronta.

## Phase 3: User Story 1 - Criar conta e acessar a área pessoal (P1) 🎯 MVP

**Goal**: cadastro, login, logout, recuperação e redefinição de senha.

**Independent Test**: criar conta, entrar, recarregar, sair; área de notas só com sessão.

- [X] T011 [P] [US1] Teste de login (sucesso, credenciais inválidas com mensagem genérica) em `web/tests/auth/login.test.tsx`
- [X] T012 [P] [US1] Teste de cadastro (com sessão; sem sessão → próximos passos de confirmação) em `web/tests/auth/signup.test.tsx`
- [X] T013 [P] [US1] Teste de recuperação (mensagem neutra, igual para e-mail existente ou não) e redefinição em `web/tests/auth/recovery.test.tsx`
- [X] T014 [P] [US1] Teste da guarda de rota e logout (conteúdo privado some, retorno ao login) em `web/tests/auth/guard.test.tsx`
- [X] T015 [P] [US1] Implementar `web/src/auth/LoginPage.tsx` (rótulos associados, erro em `role="alert"`, links para cadastro e recuperação)
- [X] T016 [P] [US1] Implementar `web/src/auth/SignUpPage.tsx`
- [X] T017 [P] [US1] Implementar `web/src/auth/ForgotPasswordPage.tsx` (`resetPasswordForEmail` com `redirectTo` = `<origem>/reset-password`, resposta sempre neutra)
- [X] T018 [US1] Implementar `web/src/auth/ResetPasswordPage.tsx` (evento `PASSWORD_RECOVERY`, `updateUser({ password })`) e integrar guarda/logout em `web/src/App.tsx`

**Checkpoint**: US1 funcional e testável sozinha.

## Phase 4: User Story 2 - Consultar minhas notas (P1)

**Goal**: listar com paginação, abrir detalhe, estados vazio/erro.

**Independent Test**: conta com notas lista, abre, pagina; conta vazia e API fora tratadas distintamente.

- [X] T019 [P] [US2] Teste de contrato do cliente `listNotes`/`getNote` (requisições e respostas MSW validadas contra os schemas) e resposta de sucesso com formato inválido em `web/tests/contract/notes-read.test.ts`
- [X] T020 [P] [US2] Teste da lista (carregando, vazia com ação "Nova nota", erro com retry sem parecer vazia, paginação via `total/limit/offset`) em `web/tests/notes/list.test.tsx`
- [X] T021 [P] [US2] Teste do detalhe (conteúdo completo, 404 → aviso e volta à lista, 401 → login) em `web/tests/notes/detail.test.tsx`
- [X] T022 [US2] Adicionar `listNotes` e `getNote` em `web/src/api/client.ts`
- [X] T023 [US2] Implementar `web/src/notes/NotesListPage.tsx` (limit 50, anterior/próxima, ordem do servidor, estados distintos)
- [X] T024 [US2] Implementar `web/src/notes/NoteDetailPage.tsx` (título e conteúdo integrais, quebras de linha preservadas, tratamento de 401/404)
- [X] T025 [US2] Tratar 401 globalmente: `client.ts` recebe um callback `onUnauthorized` injetado pelo `AuthProvider`, que encerra a sessão local e redireciona ao `/login` com aviso (`web/src/api/client.ts`, `web/src/auth/AuthProvider.tsx`)

## Phase 5: User Story 3 - Criar, editar e excluir (P1)

**Goal**: ciclo completo de gerenciamento com validação e preservação de rascunho.

**Independent Test**: criar → ver na lista → editar → excluir; entradas inválidas e falhas simuladas.

- [X] T026 [P] [US3] Teste de contrato `createNote`/`replaceNote`/`deleteNote` (corpo conforme `NoteInput` contendo apenas `title` e `content`, sem campo de proprietário — FR-003; 204 no delete; resposta inválida tratada) em `web/tests/contract/notes-write.test.ts`
- [X] T027 [P] [US3] Teste do formulário (vazio/só espaços bloqueia envio por campo, 400 com `errors[].pointer` `#/campo`, falha preserva rascunho) em `web/tests/notes/form.test.tsx`
- [X] T028 [P] [US3] Teste de exclusão (confirmação, remoção só após 204, falha mantém a nota) em `web/tests/notes/delete.test.tsx`
- [X] T029 [US3] Adicionar `createNote`, `replaceNote`, `deleteNote` em `web/src/api/client.ts`
- [X] T030 [US3] Implementar `web/src/notes/NoteForm.tsx` (validação `trim()` não vazio, erros por campo acessíveis, rascunho preservado) e `web/src/notes/NewNotePage.tsx`
- [X] T031 [US3] Adicionar edição em `web/src/notes/NoteDetailPage.tsx` usando `NoteForm`, com confirmação de sucesso
- [X] T032 [US3] Implementar `web/src/notes/DeleteNoteDialog.tsx` (confirmação, foco gerenciado) e atualização da lista após criar/editar/excluir
- [X] T033 [US3] Resultado incerto em falha de rede/5xx: mensagem "não confirmado" e orientação para atualizar a lista antes de repetir, em `web/src/notes/NoteForm.tsx` e `web/src/notes/DeleteNoteDialog.tsx`

## Phase 6: Polish & Cross-Cutting

- [X] T034 [P] Revisar acessibilidade (rótulos, foco, `aria-live`, teclado) e layout a 360 px em `web/src/styles.css` e componentes
- [X] T035 [P] Criar `web/README.md` e atualizar `README.md` da raiz com execução da interface, variáveis e proxy
- [X] T036 Rodar `npm run typecheck`, `npm test` e `npm run build` em `web/` e `npm run contract:lint` na raiz; confirmar `git diff` sem alteração em `specs/001-notes-api-baseline/contracts/openapi.yaml`
- [X] T037 Executar o fluxo manual (incluindo duas contas para SC-001 e avaliação de uso SC-005 quando possível) de `specs/003-notes-web-interface/quickstart.md` (reiniciar Supabase para aplicar `additional_redirect_urls`) e registrar resultado

## Dependencies & Execution Order

- Setup (T001–T004) → Foundational (T005–T010) → histórias → Polish.
- US1 não depende de US2/US3. US2 usa a guarda/auth de US1 (T018) para fluxo completo, mas seus testes usam sessão simulada. US3 estende `client.ts` (T029 após T022) e `NoteDetailPage.tsx` (T031 após T024).
- Em cada história, testes (falhando) antes da implementação.

## Parallel Examples

- US1: T011–T014 juntos; depois T015–T017 juntos.
- US2: T019–T021 juntos. US3: T026–T028 juntos.

## Implementation Strategy

1. MVP: Setup + Foundational + US1 (acesso seguro).
2. Incremento: US2 (consulta) e depois US3 (gerenciamento).
3. Polish e validação manual ao final.






