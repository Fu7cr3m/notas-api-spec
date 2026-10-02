---

description: "Tarefas para implementar o contrato da API de notas"
---

# Tasks: Baseline da API de Notas

**Input**: Documentos de design em `specs/001-notes-api-baseline/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/openapi.yaml`, `quickstart.md`

**Tests**: Não foram solicitadas tarefas de criação de testes automatizados. A
validação do contrato e dos exemplos é obrigatória pela constituição do projeto.

**Organization**: As tarefas estão agrupadas pelas histórias da especificação. Este
repositório entrega documentação de API, não um runtime de servidor.

## Formato

- Todas as tarefas usam checkbox, identificador sequencial e caminho de arquivo.
- `[P]` marca somente tarefas que alteram arquivos diferentes e não dependem de
  trabalho incompleto.
- `[US1]`, `[US2]` e `[US3]` identificam as histórias da especificação.
- Não há tarefas de aplicação, persistência, implantação ou autenticação de usuários;
  essas decisões estão fora do escopo do contrato.

## Phase 1: Setup

**Purpose**: Confirmar o escopo dos artefatos da feature.

Nenhuma tarefa de scaffolding de runtime: o diretório da feature e o documento OpenAPI
já existem, e a decisão de projeto é entregar apenas a especificação do contrato.

---

## Phase 2: Foundational

**Purpose**: Concluir definições compartilhadas que as operações das histórias usam.

**Checkpoint**: Metadados, autenticação, schemas e respostas comuns definidos antes de
completar as operações de cada história.

- [x] T001 Confirmar título, versão OpenAPI 3.1.1, namespace `/v1` e URL de servidor ilustrativa no domínio reservado `.invalid` em `specs/001-notes-api-baseline/contracts/openapi.yaml`.
- [x] T002 Definir autenticação bearer global e schemas compartilhados `NoteInput`, `Note` e `NotePage` em `specs/001-notes-api-baseline/contracts/openapi.yaml`; preservar estas restrições do modelo: “Required; MUST NOT be empty or whitespace-only”, “Required; exactly one owner; immutable through note operations”, “stable after creation” e “changes when title or content changes”; a identidade do proprietário não pode vir do corpo da solicitação.
- [x] T003 Definir `Problem` e respostas reutilizáveis 400, 401, 404 e 500 em `specs/001-notes-api-baseline/contracts/openapi.yaml`, sem revelar conteúdo nem existência de notas que pertencem a outro usuário.

---

## Phase 3: User Story 1 - Criar e listar notas próprias (Priority: P1) 🎯 MVP

**Goal**: Permitir que usuários autenticados criem notas e consultem uma lista paginada
que contenha somente suas próprias notas.

**Independent Test**: Com duas identidades autenticadas, criar uma nota como User A,
confirmar que ela consta na listagem paginada de A e confirmar que não aparece na
listagem de B; uma solicitação sem autenticação não pode revelar notas.

### Implementation for User Story 1

- [x] T004 [US1] Definir `POST /notes` em `specs/001-notes-api-baseline/contracts/openapi.yaml` com `NoteInput`, título e conteúdo obrigatórios e não vazios nem compostos apenas por espaços, associação automática à identidade autenticada, resposta 201 com `Note` e `Location`, e respostas 400, 401 e 500.
- [x] T005 [US1] Definir `GET /notes` em `specs/001-notes-api-baseline/contracts/openapi.yaml` com `limit` padrão 50 e máximo 100, `offset` padrão 0, ordenação estável por `createdAt` e `id` crescentes, paginação apenas sobre notas próprias e `NotePage` contendo `data`, `total`, `limit` e `offset`; documentar respostas 200, 400, 401 e 500.

**Checkpoint**: O contrato permite criar e listar notas privadas com validação e
paginação; a lista e seu total excluem notas de outras identidades.

---

## Phase 4: User Story 2 - Consultar e atualizar uma nota própria (Priority: P2)

**Goal**: Permitir que o proprietário consulte e substitua os campos editáveis de uma
nota sem revelar nem alterar notas de outros usuários.

**Independent Test**: Com uma nota própria já existente, consultar e atualizar título
e conteúdo, verificar as datas de criação e atualização e confirmar que um usuário
distinto recebe 404 sem conteúdo ao tentar consultar ou atualizar a nota.

### Implementation for User Story 2

- [x] T006 [US2] Definir `GET /notes/{noteId}` em `specs/001-notes-api-baseline/contracts/openapi.yaml` para retornar somente nota pertencente à identidade autenticada, incluindo `createdAt` e `updatedAt` como RFC 3339; retornar o mesmo 404 para nota ausente, excluída ou não pertencente ao usuário, além das respostas 200, 401 e 500.
- [x] T007 [US2] Definir `PUT /notes/{noteId}` em `specs/001-notes-api-baseline/contracts/openapi.yaml` como substituição conjunta de título e conteúdo; rejeitar campos ausentes, vazios ou compostos apenas por espaços sem alterar nenhum campo existente; preservar a data de criação, avançar a data de atualização e retornar 200, 400, 401, 404 ou 500 conforme o resultado.

**Checkpoint**: Consulta e atualização individual são restritas ao proprietário; uma
atualização inválida não altera parcialmente a nota.

---

## Phase 5: User Story 3 - Excluir uma nota própria (Priority: P3)

**Goal**: Permitir que o proprietário remova uma nota das consultas normais.

**Independent Test**: Com uma nota própria existente, excluí-la e verificar resposta
204; confirmar que a consulta, a listagem e uma repetição da exclusão a tratam como
indisponível, sem afetar notas de outro proprietário.

### Implementation for User Story 3

- [x] T008 [US3] Definir `DELETE /notes/{noteId}` em `specs/001-notes-api-baseline/contracts/openapi.yaml` para excluir somente notas da identidade autenticada, retornar 204 sem corpo em sucesso e retornar o mesmo 404 para nota ausente, excluída ou pertencente a outro usuário; documentar também 401 e 500.

**Checkpoint**: Exclusão completa o ciclo de vida da nota e não revela nem afeta notas
de outras identidades.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Alinhar os documentos de apoio ao contrato final e cumprir a validação
obrigatória.

- [x] T009 [P] Alinhar entidades, relações, ciclo de vida, ordenação da listagem e restrições documentadas ao contrato final em `specs/001-notes-api-baseline/data-model.md`, sem escolher limites de tamanho, retenção ou implementação que não estejam especificados.
- [x] T010 [P] Alinhar o roteiro HTTP às operações, autenticação, validação, paginação e status definidos no contrato em `specs/001-notes-api-baseline/quickstart.md`; distinguir cenários verificáveis contra um serviço implantado daqueles que podem ser validados estaticamente.
- [x] T011 Validar `specs/001-notes-api-baseline/contracts/openapi.yaml` com `npx --yes @redocly/cli@2.57.0 lint --skip-rule=info-license`, conferir referências e exemplos, confirmar a cobertura dos FR-001 a FR-011 em `specs/001-notes-api-baseline/spec.md` e registrar comando e resultado da validação em `specs/001-notes-api-baseline/quickstart.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Não requer trabalho; o diretório e o contrato inicial já existem.
- **Foundational (Phase 2)**: T001 → T002 → T003; as operações das histórias dependem
  dos schemas e respostas compartilhados.
- **User Stories (Phase 3+)**: Dependem de T001–T003 e devem seguir a prioridade P1 →
  P2 → P3 para entregar o MVP primeiro.
- **Polish (Phase 6)**: T009 e T010 dependem da conclusão das operações T004–T008;
  T011 depende de T009 e T010.

### User Story Dependencies

- **User Story 1 (P1)**: Depende da fundação; entrega o MVP de criação e listagem.
- **User Story 2 (P2)**: Depende dos schemas compartilhados e de uma nota própria
  disponível para consulta e atualização; deve ser validável de forma independente
  com uma nota existente.
- **User Story 3 (P3)**: Depende dos schemas compartilhados e de uma nota própria
  disponível; deve ser validável de forma independente com uma nota existente.
- As histórias editam o mesmo arquivo de contrato e, portanto, suas tarefas não são
  paralelizáveis apesar de serem incrementos de comportamento distintos.

### Parallel Opportunities

- Após T004–T008, T009 (`data-model.md`) e T010 (`quickstart.md`) podem ser feitos em
  paralelo: alteram arquivos diferentes e dependem apenas do contrato concluído.
- T011 deve começar somente após as duas tarefas de alinhamento terminarem.

### Parallel Example: Polish

```text
Task: T009 Alinhar o modelo de dados em specs/001-notes-api-baseline/data-model.md
Task: T010 Alinhar o roteiro HTTP em specs/001-notes-api-baseline/quickstart.md
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Concluir T001–T003 para estabelecer os componentes compartilhados do contrato.
2. Concluir T004–T005 para entregar criação e listagem privadas e paginadas.
3. Validar independentemente os critérios da User Story 1.
4. Prosseguir às histórias P2 e P3 sem adicionar runtime ao repositório.

### Incremental Delivery

1. Fundação compartilhada → contrato pronto para receber operações.
2. User Story 1 → fluxo MVP de criar e listar notas.
3. User Story 2 → consulta e edição de nota própria.
4. User Story 3 → exclusão de nota própria.
5. Alinhar documentos auxiliares e executar T011 antes de considerar o contrato pronto.

## Notes

- `[P]` indica tarefas em arquivos diferentes, sem dependência de trabalho pendente.
- Cada tarefa de história tem o rótulo correspondente para manter rastreabilidade à
  especificação.
- O contrato não implementa autenticação, armazenamento, retenção nem servidor HTTP.
- A validação de contrato é exigida pela constituição; não foram incluídas tarefas de
  criação de testes automatizados porque não foram solicitadas na especificação.
- T001–T011 estão concluídas para o escopo contratual desta feature. Uma implementação
  de servidor e seus testes end-to-end exigem uma feature separada.
