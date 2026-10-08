# Feature Specification: Baseline da API de Notas

**Feature Branch**: `not created (using agents/speckit-constitution-update)`

**Created**: 2026-10-01

**Status**: Draft

**Input**: User description: "cria a especificação base (baseline) da primeira feature do projeto"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Criar e listar notas próprias (Priority: P1)

Como usuário autenticado, quero criar notas e consultar minha lista de notas para
registrar e encontrar informações pessoais.

**Why this priority**: Criar e encontrar notas é o fluxo mínimo que entrega valor
central ao produto.

**Independent Test**: Autenticar um usuário, criar uma nota e confirmar que ela aparece
na lista desse usuário, sem aparecer na lista de outro usuário.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado sem notas, **When** cria uma nota com título e
   conteúdo válidos, **Then** a nota é criada e aparece na lista desse usuário.
2. **Given** um usuário autenticado com notas, **When** consulta suas notas, **Then**
   recebe somente as notas que lhe pertencem.
3. **Given** dados de uma nota sem título ou sem conteúdo, **When** o usuário tenta
   criar a nota, **Then** a operação é rejeitada com indicação dos campos inválidos.
4. **Given** uma solicitação sem identidade autenticada, **When** tenta criar ou listar
   notas, **Then** a operação é rejeitada sem revelar dados de notas.
5. **Given** um usuário com mais notas do que o limite de uma página, **When** consulta
   páginas consecutivas da lista, **Then** recebe apenas notas próprias e pode avançar
   pela coleção usando limite e deslocamento, em ordem estável de criação crescente
   com o identificador da nota como desempate crescente.

---

### User Story 2 - Consultar e atualizar uma nota própria (Priority: P2)

Como usuário autenticado, quero consultar e editar uma nota minha para manter seu
conteúdo correto e atualizado.

**Why this priority**: A consulta individual e a edição tornam as notas úteis além do
momento em que são criadas.

**Independent Test**: Criar uma nota, consultá-la, alterar título e conteúdo e confirmar
que os novos valores são apresentados ao proprietário.

**Acceptance Scenarios**:

1. **Given** uma nota pertencente ao usuário autenticado, **When** ele consulta a nota,
   **Then** recebe seu título e conteúdo atuais.
2. **Given** uma nota pertencente ao usuário autenticado, **When** ele atualiza título
   e conteúdo com valores válidos, **Then** a consulta seguinte apresenta os valores
   atualizados.
3. **Given** uma nota pertencente a outro usuário, **When** o usuário autenticado tenta
   consultá-la ou atualizá-la, **Then** a operação é negada e nenhum conteúdo é
   revelado.
4. **Given** uma nota recém-criada, **When** o usuário consulta suas informações,
   **Then** a nota apresenta as datas de criação e de última atualização; após uma
   edição válida, a data de última atualização reflete a alteração.
5. **Given** dados de atualização sem título ou sem conteúdo, **When** o usuário tenta
   atualizar a nota, **Then** a operação é rejeitada e os valores anteriores
   permanecem inalterados.

---

### User Story 3 - Excluir uma nota própria (Priority: P3)

Como usuário autenticado, quero excluir uma nota minha para remover informações que
não desejo mais manter.

**Why this priority**: A exclusão completa o ciclo de vida básico da nota e permite ao
usuário controlar seu conteúdo.

**Independent Test**: Criar uma nota, excluí-la como proprietária e confirmar que ela
não aparece mais nas consultas nem pode ser obtida como nota existente.

**Acceptance Scenarios**:

1. **Given** uma nota pertencente ao usuário autenticado, **When** ele a exclui,
   **Then** a nota deixa de estar disponível nas consultas normais.
2. **Given** uma nota pertencente a outro usuário, **When** o usuário autenticado tenta
   excluí-la, **Then** a operação é negada e a nota permanece disponível ao
   proprietário.
3. **Given** uma nota já excluída ou inexistente, **When** o usuário tenta consultá-la
   ou excluí-la novamente, **Then** recebe uma resposta que indica que a nota não está
   disponível, sem expor dados de outros usuários.

### Edge Cases

- Uma solicitação sem autenticação válida não pode criar, listar, consultar, atualizar
  ou excluir notas.
- A tentativa de operar sobre uma nota de outro usuário não pode revelar seu conteúdo
  nem alterar seu estado.
- Título e conteúdo vazios ou ausentes são inválidos na criação e atualização.
- Uma nota inexistente ou excluída não pode ser apresentada como existente.
- Falhas de validação na atualização não podem deixar a nota parcialmente alterada.
- A lista de notas de um usuário sem notas retorna uma coleção vazia, não notas de
  outros usuários.
- A listagem usa ordenação determinística por data de criação crescente e, em caso de
  empate, por identificador crescente, para que a paginação tenha uma ordem definida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST exigir uma identidade autenticada para todas as operações
  de notas.
- **FR-002**: O sistema MUST permitir que um usuário crie uma nota com título e
  conteúdo não vazios.
- **FR-003**: O sistema MUST associar cada nota a exatamente um usuário proprietário.
- **FR-004**: O sistema MUST permitir que um usuário liste somente suas próprias notas.
- **FR-005**: O sistema MUST permitir que um usuário consulte individualmente somente
  suas próprias notas.
- **FR-006**: O sistema MUST permitir que um usuário atualize o título e o conteúdo de
  uma nota própria; ambos os campos devem ser validados antes de qualquer alteração.
- **FR-007**: O sistema MUST permitir que um usuário exclua uma nota própria; notas
  excluídas não devem estar disponíveis nas consultas normais.
- **FR-008**: O sistema MUST impedir que um usuário leia, altere ou exclua notas de
  outro usuário e MUST NOT revelar seu conteúdo.
- **FR-009**: O sistema MUST indicar claramente solicitações não autenticadas,
  inválidas ou referentes a notas indisponíveis, sem expor dados de outros usuários.
- **FR-010**: Cada nota MUST apresentar sua data de criação e a data de sua última
  atualização; esta última deve mudar quando título ou conteúdo forem alterados.
- **FR-011**: O sistema MUST permitir limitar e deslocar a página da lista de notas,
  informar o total de notas próprias e não incluir notas de outros usuários nesse
  total; os resultados MUST ser ordenados por data de criação crescente e, em caso de
  empate, por identificador crescente.

### Key Entities

- **Usuário**: Pessoa autenticada que utiliza a API e é proprietária de suas notas.
- **Nota**: Registro privado pertencente a um usuário, com título, conteúdo, data de
  criação e data de última atualização.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O contrato descreve todas as cinco operações principais: criar, listar,
  consultar, atualizar e excluir notas, cada uma com método, caminho e respostas
  documentados.
- **SC-002**: 100% das operações exigem autenticação; listagens e consultas são
  limitadas ao proprietário e notas alheias são descritas como indisponíveis sem expor
  seu conteúdo.
- **SC-003**: Os schemas de criação e atualização exigem título e conteúdo não vazios
  nem compostos apenas por espaços; a atualização inválida não altera parcialmente a
  nota.
- **SC-004**: 100% das referências locais do contrato resolvem, e todos os exemplos
  declarados são válidos em relação aos schemas correspondentes.

## Assumptions

- A feature inicial cobre apenas notas de texto com título e conteúdo; etiquetas,
  anexos, pesquisa, compartilhamento e colaboração ficam fora do escopo.
- O usuário já pode ser autenticado e identificado pelo sistema; esta feature exige
  essa identidade, mas não define cadastro, credenciais ou o mecanismo de autenticação.
- A exclusão remove a nota das consultas normais; regras de retenção ou recuperação
  fora dessas consultas não fazem parte desta baseline.
- O conteúdo e o título são obrigatórios e não podem consistir apenas em espaços em
  branco.
- A listagem usa paginação por limite e deslocamento; o limite padrão é 50 e o máximo
  permitido é 100.
- A listagem mantém uma ordem determinística por `createdAt` crescente e `id`
  crescente como desempate.
- As datas são apresentadas como timestamps RFC 3339, em UTC nos exemplos do contrato.
