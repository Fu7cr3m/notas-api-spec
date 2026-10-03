# Feature Specification: Interface Web para Notas

**Feature Branch**: `not created (using agents/speckit-constitution-update)`

**Created**: 2026-10-03

**Status**: Draft

**Input**: User description: "Criar uma interface web para usuários entrarem na conta e gerenciarem suas próprias notas. A pessoa usuária deve conseguir criar, listar, consultar, editar e excluir notas, com estados claros para carregamento, lista vazia, erros de validação e falhas da API. A interface deve respeitar a autenticação existente e o contrato OpenAPI da API de notas, sem alterá-lo. Antes de fechar a especificação, identificar decisões pendentes sobre tecnologia de interface e fluxos de cadastro e login; não presumir essas escolhas."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Criar conta e acessar a área pessoal (Priority: P1)

Como pessoa usuária, quero criar uma conta ou entrar na minha conta existente para
acessar minhas notas de forma privada.

**Why this priority**: A autenticação é necessária para associar operações à pessoa
correta e impedir que notas privadas sejam expostas.

**Independent Test**: Criar uma conta de teste, entrar, atualizar a página, sair e
confirmar que a área de notas só fica disponível durante uma sessão autenticada.

**Acceptance Scenarios**:

1. **Given** uma pessoa sem conta, **When** informa dados válidos no cadastro,
   **Then** recebe confirmação compreensível do resultado e pode seguir o processo de
   ativação exigido pelo provedor de autenticação.
2. **Given** uma conta existente, **When** informa credenciais válidas, **Then** entra
   na área autenticada sem precisar navegar diretamente para uma URL interna.
3. **Given** credenciais inválidas, **When** tenta entrar, **Then** recebe uma
   mensagem clara sem exposição de detalhes técnicos ou confirmação indevida sobre
   outras contas.
4. **Given** uma sessão autenticada, **When** solicita logout, **Then** a sessão local
   termina, o conteúdo das notas deixa de ser exibido e a pessoa retorna à área de
   acesso.
5. **Given** uma pessoa que esqueceu a senha, **When** solicita recuperação,
   **Then** recebe orientação neutra para verificar o canal de recuperação associado
   à conta, sem revelar se o endereço está cadastrado.

---

### User Story 2 - Consultar e organizar minhas notas (Priority: P1)

Como pessoa autenticada, quero visualizar, abrir e percorrer minhas notas para
encontrar informações pessoais com facilidade.

**Why this priority**: Consultar notas existentes é a principal utilidade da
interface e precisa confirmar que o conteúdo permanece restrito à conta ativa.

**Independent Test**: Entrar com uma conta que possui notas e verificar os títulos,
abrir o conteúdo completo, navegar pelas páginas e confirmar que outra conta não vê
essas notas.

**Acceptance Scenarios**:

1. **Given** uma sessão válida, **When** a lista carrega, **Then** mostra somente as
   notas da conta autenticada, com título e informação suficiente para localizar
   cada nota.
2. **Given** uma conta sem notas, **When** a lista termina de carregar, **Then** a
   interface apresenta estado vazio compreensível e uma ação para criar a primeira
   nota.
3. **Given** uma nota própria na lista, **When** a pessoa a abre, **Then** o título e
   o conteúdo completos são apresentados.
4. **Given** mais notas do que cabem em uma página, **When** a pessoa navega entre
   páginas, **Then** a lista permanece na ordem e nos limites definidos pelo contrato.
5. **Given** uma falha de carregamento, **When** a API não responde ou indica erro,
   **Then** a interface informa que os dados não puderam ser carregados, não
   apresenta uma lista vazia como se fosse sucesso e oferece uma forma de tentar
   novamente.

---

### User Story 3 - Criar, editar e excluir minhas notas (Priority: P1)

Como pessoa autenticada, quero criar, alterar e excluir minhas notas para manter
minhas informações atualizadas.

**Why this priority**: O ciclo de edição transforma a consulta em uma ferramenta útil
de gerenciamento pessoal e corresponde às operações já disponíveis na API.

**Independent Test**: Criar uma nota válida, confirmar sua presença na lista,
consultá-la, atualizá-la, confirmar que os dados mudaram e excluí-la; repetir com
dados inválidos e falhas simuladas da API.

**Acceptance Scenarios**:

1. **Given** a pessoa está autenticada, **When** envia uma nota com título e conteúdo
   válidos, **Then** vê confirmação e a nota criada aparece na área pessoal.
2. **Given** o formulário de nota está aberto, **When** título ou conteúdo está
   ausente, vazio ou contém somente espaços, **Then** os campos inválidos recebem
   orientação e a solicitação não é enviada.
3. **Given** uma nota própria, **When** a pessoa salva alterações válidas, **Then**
   vê o conteúdo atualizado e a data de criação permanece a mesma.
4. **Given** uma nota própria, **When** a pessoa confirma sua exclusão, **Then** a
   nota desaparece da lista e uma confirmação comunica o resultado.
5. **Given** a API rejeita ou não conclui uma operação, **When** a interface recebe
   erro, **Then** informa que a alteração não foi confirmada, preserva o conteúdo
   digitado sempre que possível e permite corrigir ou tentar novamente.
6. **Given** a sessão expira durante uma operação, **When** a API rejeita a
   credencial, **Then** a pessoa é orientada a autenticar-se novamente e o conteúdo
   privado não é exibido como acessível.

### Edge Cases

- A API retorna uma lista vazia com sucesso: apresentar o estado vazio; não confundir
  essa situação com erro, carregamento ou falta de conexão.
- A rede falha durante carregamento, salvamento ou exclusão: comunicar que o
  resultado é incerto quando não houver confirmação e permitir atualização da lista
  antes de repetir ações potencialmente duplicadas.
- Uma resposta da API indica 401: descartar o estado visual autenticado e solicitar
  novo acesso sem mostrar conteúdo privado em seguida.
- Uma nota referenciada por um endereço deixa de existir ou não pertence à pessoa:
  mostrar uma mensagem de indisponibilidade e retornar à lista sem revelar dados.
- Uma resposta de sucesso de criação ou atualização não contém o formato esperado:
  não apresentar confirmação enganosa; informar falha ao processar a resposta.
- O título ou o conteúdo contém caracteres acentuados, caracteres especiais,
  quebras de linha ou texto longo: exibir e permitir edição sem perda involuntária.
- O usuário navega, atualiza a página ou encerra a sessão: respeitar a sessão válida
  e não deixar conteúdo de uma conta anterior visível para outra conta.
- A interface é usada em uma tela estreita ou apenas por teclado/leitor de tela:
  controles e estados essenciais continuam disponíveis e identificáveis.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A interface MUST permitir cadastro, login, logout e solicitação de
  recuperação de senha por meio do provedor de autenticação já adotado pelo projeto.
- **FR-002**: A interface MUST impedir que uma pessoa não autenticada consulte ou
  opere notas e MUST direcionar sessões expiradas ou recusadas para autenticação.
- **FR-003**: A interface MUST usar a identidade autenticada para associar as
  solicitações de notas à conta ativa e MUST NOT permitir que a pessoa selecione ou
  altere a identidade proprietária de uma nota.
- **FR-004**: A interface MUST permitir listar, consultar, criar, atualizar e excluir
  notas próprias por meio das operações e dos formatos descritos no contrato
  `specs/001-notes-api-baseline/contracts/openapi.yaml`.
- **FR-005**: A interface MUST NOT alterar, duplicar como fonte normativa, ou
  depender de comportamento incompatível com o contrato OpenAPI da API de notas.
- **FR-006**: A interface MUST validar a presença de título e conteúdo e rejeitar
  valores vazios ou compostos apenas por espaços antes de enviar criação ou
  atualização.
- **FR-007**: A interface MUST mostrar estados distintos para carregamento, lista
  vazia, sucesso, erro de validação, indisponibilidade da API e sessão expirada.
- **FR-008**: Em falhas de rede ou da API, a interface MUST comunicar o resultado sem
  expor mensagens internas, tokens, credenciais ou dados pertencentes a outra conta.
- **FR-009**: A interface MUST atualizar a listagem após criação, atualização e
  exclusão confirmadas, preservando a ordenação e a paginação previstas no contrato.
- **FR-010**: A interface MUST pedir confirmação antes de excluir uma nota e MUST
  remover a nota da listagem somente após confirmação de sucesso da API.
- **FR-011**: A interface MUST apresentar títulos e conteúdo sem truncamento que
  impeça consultar ou editar integralmente uma nota.
- **FR-012**: A interface MUST funcionar em telas estreitas e permitir executar os
  fluxos principais por teclado, com rótulos e mensagens identificáveis por
  tecnologias assistivas.
- **FR-013**: A experiência de cadastro, login e recuperação MUST comunicar próximos
  passos de forma clara sem revelar se uma conta existe durante recuperação de senha.

### Key Entities

- **Conta autenticada**: identidade verificada pelo provedor existente, associada à
  sessão atual e usada para restringir as notas apresentadas.
- **Sessão**: estado temporário que autoriza a pessoa a acessar a área privada e que
  pode terminar por logout, expiração ou recusa do provedor.
- **Nota**: registro privado da conta autenticada, com identificador, título,
  conteúdo e datas de criação e atualização conforme o contrato atual.
- **Estado de interface**: condição visível de uma operação, como carregamento,
  sucesso, lista vazia, validação, falha de serviço ou necessidade de autenticação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em testes de aceitação, 100% das solicitações de notas executadas pela
  interface usam a sessão autenticada e nenhuma conta consegue ver ou modificar
  notas pertencentes a outra conta.
- **SC-002**: Uma pessoa que conclui o acesso consegue criar uma nota válida e
  encontrá-la na lista em até 2 minutos, sem instruções técnicas.
- **SC-003**: Em 100% dos testes com campos ausentes, vazios ou compostos somente por
  espaços, a interface identifica os campos inválidos e não envia a operação.
- **SC-004**: Os estados de carregamento, lista vazia e falha de API são distinguíveis
  em todos os cenários de aceitação e nunca apresentam falha como lista vazia bem
  sucedida.
- **SC-005**: Em uma avaliação de uso com pelo menos 5 pessoas, pelo menos 4
  conseguem consultar, editar e excluir uma nota própria sem assistência.
- **SC-006**: Os fluxos principais de cadastro/acesso e gerenciamento de notas
  permanecem utilizáveis em larguras de viewport de 360 px ou mais e apenas com
  navegação por teclado.
- **SC-007**: Todas as operações de notas verificadas em testes permanecem
  compatíveis com o contrato OpenAPI canônico, sem alteração desse documento.

## Assumptions

- A API de notas, o contrato OpenAPI e o provedor Supabase Auth já existentes serão
  reutilizados; esta feature não adiciona operações de servidor nem altera a API.
- A primeira versão é uma interface web responsiva voltada a navegadores atuais, sem
  aplicativo móvel nativo.
- Cadastro, login, logout e recuperação de senha por e-mail/senha são o escopo de
  conta escolhido para esta versão; login social e gestão administrativa de contas
  ficam fora do escopo.
- A confirmação de e-mail e o envio de mensagens de recuperação seguem a
  configuração do provedor de autenticação no ambiente usado.
- A tecnologia da interface será detalhada no planejamento; as decisões já
  confirmadas pela pessoa usuária estão registradas em `.specify/feature.json`.
- A URL da API e a configuração pública necessárias para executar a interface serão
  fornecidas pelo ambiente de desenvolvimento sem incluir credenciais de produção
  nos arquivos versionados.
