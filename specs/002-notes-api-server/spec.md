# Feature Specification: Servidor Executável da API de Notas

**Feature Branch**: `not created (using agents/speckit-constitution-update)`

**Created**: 2026-10-01

**Status**: Draft

**Input**: User description: "Implementar um servidor executável para a API de notas definida em specs/001-notes-api-baseline/contracts/openapi.yaml. O servidor deve permitir que usuários autenticados criem, listem, consultem, atualizem e excluam apenas suas próprias notas, respeitando os schemas, respostas e regras de paginação do contrato. Incluir persistência, configuração local para desenvolvimento e testes automatizados dos fluxos principais, validação e isolamento entre usuários. Não alterar o contrato OpenAPI sem documentar e justificar qualquer incompatibilidade. Antes de fechar a especificação, identificar as decisões ainda necessárias sobre linguagem/framework, banco de dados e provedor de autenticação; não presumir esses detalhes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Executar a API localmente e autenticar (Priority: P1)

Como pessoa desenvolvedora, quero iniciar o servidor em um ambiente local
documentado e autenticar duas identidades de teste para poder desenvolver e verificar
operações privadas de notas.

**Why this priority**: Um ambiente local reproduzível e identidades autenticadas são
pré-requisitos para usar e testar a API implementada.

**Independent Test**: Seguir as instruções locais em um ambiente limpo, iniciar o
serviço, verificar disponibilidade e autenticar duas identidades distintas sem usar
credenciais de produção.

**Acceptance Scenarios**:

1. **Given** as dependências locais e as variáveis de ambiente documentadas estão
   disponíveis, **When** a pessoa desenvolvedora segue as instruções de inicialização,
   **Then** o servidor inicia e informa que está pronto para receber solicitações.
2. **Given** o servidor está em execução, **When** uma identidade válida apresenta uma
   credencial aceita pelo provedor escolhido, **Then** a solicitação autenticada é
   associada à identidade verificada.
3. **Given** credencial ausente, inválida ou expirada, **When** uma pessoa tenta
   acessar uma operação de notas, **Then** recebe a resposta de não autenticado
   definida pelo contrato e nenhum dado de notas é revelado.
4. **Given** configuração obrigatória ausente ou incompleta, **When** a pessoa inicia o
   serviço, **Then** recebe indicação dos nomes de configuração necessários sem que
   valores secretos sejam impressos ou gravados nos arquivos versionados.
5. **Given** uma sessão de desenvolvimento ou teste, **When** credenciais e operações
   de notas são exercitadas, **Then** logs comuns não contêm tokens, segredos ou
   conteúdo privado.

---

### User Story 2 - Criar e listar notas privadas (Priority: P1)

Como usuário autenticado, quero criar notas e listar as minhas notas para guardar e
encontrar informações pessoais.

**Why this priority**: Criar e listar notas é o fluxo mínimo de valor e permite validar
persistência e isolamento de dados.

**Independent Test**: Com duas identidades autenticadas, User A cria uma nota; a nota
aparece na lista paginada de A e não aparece na lista de User B, inclusive no total.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado, **When** cria uma nota com título e conteúdo
   válidos, **Then** recebe a resposta de criação definida pelo contrato e a nota fica
   persistida para consultas posteriores.
2. **Given** o usuário criou notas, **When** lista notas com `limit` e `offset`,
   **Then** recebe somente suas notas, o total correto e a ordenação por `createdAt`
   crescente com `id` crescente como desempate.
3. **Given** uma nota já criada, **When** o serviço ou a conexão com o banco é
   reiniciado sem excluir o armazenamento, **Then** a nota continua disponível ao
   proprietário.
4. **Given** título ou conteúdo ausente, vazio ou composto apenas por espaços,
   **When** o usuário tenta criar uma nota, **Then** a solicitação é rejeitada com o
   formato de erro de validação definido pelo contrato.

---

### User Story 3 - Consultar, atualizar e excluir notas próprias (Priority: P2)

Como usuário autenticado, quero consultar, editar e excluir minhas notas para controlar
seu conteúdo durante todo o ciclo de vida.

**Why this priority**: Essas operações completam o ciclo de vida da nota e permitem
verificar se o isolamento entre proprietários vale para toda a interface.

**Independent Test**: Com uma nota pertencente a User A, verificar consulta, edição
válida e exclusão por A; como User B, tentar consultar, editar e excluir o mesmo
identificador e confirmar que nenhuma operação revela ou altera o conteúdo de A.

**Acceptance Scenarios**:

1. **Given** uma nota própria, **When** seu proprietário a consulta, **Then** recebe os
   campos e timestamps documentados no contrato.
2. **Given** uma nota própria, **When** o proprietário substitui título e conteúdo por
   valores válidos, **Then** ambos são atualizados, `createdAt` permanece estável e
   `updatedAt` reflete a alteração.
3. **Given** uma atualização inválida, **When** o proprietário a envia, **Then** recebe
   erro de validação e nenhum campo da nota é alterado.
4. **Given** uma nota que pertence a outro usuário, **When** outra identidade tenta
   consultá-la, atualizá-la ou excluí-la, **Then** recebe a resposta de indisponibilidade
   definida pelo contrato, sem conteúdo da nota.
5. **Given** uma nota própria existente, **When** o proprietário a exclui, **Then**
   recebe sucesso sem corpo e a nota não aparece em consultas ou listagens posteriores.
6. **Given** uma nota inexistente, excluída ou não pertencente à identidade, **When**
   uma operação individual é feita, **Then** todas as situações retornam a mesma
   resposta de indisponibilidade especificada.

### Edge Cases

- A persistência fica indisponível durante uma solicitação: o serviço retorna erro
  apropriado sem sinalizar sucesso nem expor conteúdo interno.
- A conexão é perdida durante uma criação ou atualização: a operação não pode deixar
  uma nota parcialmente gravada.
- Dois usuários autenticados fazem operações simultâneas sobre notas diferentes:
  cada resposta e cada listagem continuam limitadas ao proprietário correspondente.
- Um usuário sem notas recebe lista vazia e total zero.
- `limit` menor que 1, maior que 100 ou `offset` negativo é rejeitado de acordo com o
  contrato.
- Uma atualização com título e conteúdo válidos deve atualizar ambos de forma
  atômica; campos inválidos deixam o estado anterior intacto.
- A inicialização local sem configuração obrigatória deve informar quais valores
  faltam sem imprimir segredos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O servidor MUST iniciar em um ambiente local seguindo instruções
  documentadas e MUST disponibilizar uma verificação de prontidão que não revele
  credenciais ou conteúdo de notas.
- **FR-002**: O servidor MUST aceitar apenas identidades autenticadas pelo Supabase
  Auth e MUST rejeitar credenciais inválidas, expiradas ou destinadas a outro emissor.
- **FR-003**: O servidor MUST derivar a identidade proprietária de uma credencial
  validada e MUST NOT aceitar do cliente a identidade proprietária como autoridade
  para acesso a notas.
- **FR-004**: O servidor MUST implementar as operações, schemas, status HTTP,
  respostas de erro e regras de paginação do contrato em
  `specs/001-notes-api-baseline/contracts/openapi.yaml`.
- **FR-005**: O servidor MUST persistir notas com identidade, proprietário, título,
  conteúdo e timestamps conforme os invariantes do contrato, preservando dados após
  reinicializações normais do processo e do serviço de armazenamento.
- **FR-006**: O servidor MUST limitar criação, listagem, consulta, atualização e
  exclusão de notas à identidade proprietária autenticada.
- **FR-007**: O servidor MUST aplicar paginação com limite padrão 50 e máximo 100,
  deslocamento não negativo, ordenação por `createdAt` crescente e desempate por `id`
  crescente; o total MUST considerar apenas notas próprias.
- **FR-008**: O servidor MUST rejeitar título ou conteúdo ausente, vazio ou composto
  apenas por espaços na criação e atualização e MUST preservar integralmente a nota
  anterior quando uma atualização falhar na validação.
- **FR-009**: O servidor MUST fornecer erros e status compatíveis com o contrato,
  incluindo 401 para credencial ausente ou inválida e resposta uniforme 404 para
  notas inexistentes, excluídas ou não pertencentes à identidade autenticada.
- **FR-010**: O servidor MUST fornecer configuração local que não exija credenciais de
  produção, identificar configuração obrigatória ausente sem revelar seus valores e
  impedir que segredos sejam incluídos em arquivos versionados.
- **FR-011**: O projeto MUST incluir testes automatizados para inicialização e
  prontidão, autenticação, persistência, operações de notas, validação, paginação,
  isolamento entre usuários e respostas de notas indisponíveis.
- **FR-012**: Os testes automatizados MUST poder ser executados localmente seguindo
  instruções documentadas e MUST indicar falhas com contexto suficiente para
  diagnóstico sem registrar tokens ou conteúdo privado.
- **FR-013**: A implementação MUST manter compatibilidade com o contrato base; qualquer
  incompatibilidade MUST ser documentada, justificada e aprovada antes de alterar a
  especificação.
- **FR-014**: O servidor MUST não registrar credenciais, tokens de acesso nem conteúdo
  de notas em logs de execução comuns.
- **FR-015**: O servidor MUST ser implementado em TypeScript usando Fastify; a
  inicialização local e as instruções de desenvolvimento MUST identificar os comandos
  e pré-requisitos necessários.
- **FR-016**: O servidor MUST persistir as notas em PostgreSQL, manter os dados entre
  reinicializações normais e documentar como iniciar e configurar a dependência local.
- **FR-017**: A autenticação MUST validar credenciais por meio do Supabase Auth, sem
  implementar um emissor próprio de credenciais nesta feature; o serviço MUST derivar
  a identidade do usuário de credenciais verificadas pelo provedor.

### Key Entities

- **Identidade autenticada**: Sujeito verificado pelo provedor configurado; sua
  identidade estabelece o escopo de acesso às notas.
- **Nota**: Informação privada com identificador, proprietário imutável, título,
  conteúdo, data de criação e data de última atualização, conforme o contrato base.
- **Configuração local**: Valores não secretos e referências a segredos necessários
  para iniciar a aplicação, conectar-se à persistência e validar credenciais.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Os cinco tipos de operação previstos no contrato — criar, listar,
  consultar, atualizar e excluir — passam testes automatizados de aceitação.
- **SC-002**: Em 100% dos testes automatizados de isolamento, um usuário não lê, altera
  nem exclui notas pertencentes a outra identidade.
- **SC-003**: Em 100% dos testes de criação e atualização, dados inválidos são
  rejeitados e uma atualização rejeitada não modifica parcialmente a nota.
- **SC-004**: Após reinicializar o processo ou serviço de dados sem apagar o
  armazenamento, 100% das notas válidas de teste continuam acessíveis apenas aos seus
  proprietários.
- **SC-005**: Uma pessoa desenvolvedora que siga as instruções consegue iniciar o
  serviço local e executar a suíte automatizada sem credenciais de produção.
- **SC-006**: Todas as operações implementadas e todos os erros observáveis são
  compatíveis com o contrato base ou têm incompatibilidade documentada e aprovada.
- **SC-007**: Os testes e verificações automatizadas não encontram tokens, segredos ou
  conteúdo privado de notas nos logs de execução comuns.

## Assumptions

- A feature cobre apenas o backend HTTP e configuração local; interface visual,
  implantação em produção, registro/recuperação de contas e recursos avançados de
  notas continuam fora do escopo.
- A especificação e contrato em `specs/001-notes-api-baseline/` são a referência
  normativa para operações e respostas, salvo incompatibilidade aprovada e
  documentada.
- As credenciais de desenvolvimento e identidade de teste são distintas de quaisquer
  credenciais reais de produção.
- A linguagem/framework escolhidos são TypeScript e Fastify; a persistência escolhida
  é PostgreSQL; o provedor escolhido é Supabase Auth.
- O ambiente de desenvolvimento deve permitir iniciar e testar a aplicação sem
  credenciais de produção; credenciais locais ou de teste do Supabase devem ser
  configuradas por mecanismos ignorados pelo controle de versão.
- A configuração de desenvolvimento deve fornecer variáveis de exemplo sem valores
  secretos, e as instruções devem distinguir nomes de configuração de seus valores
  privados.
