# UI Contract: Interface Web para Notas

Contrato de comportamento da interface. O contrato HTTP continua sendo `specs/001-notes-api-baseline/contracts/openapi.yaml` (não duplicado aqui).

## Rotas

| Rota | Acesso | Função |
|------|--------|--------|
| `/login` | anônimo | login; links para cadastro e recuperação |
| `/signup` | anônimo | cadastro |
| `/forgot-password` | anônimo | solicitar recuperação (mensagem neutra) |
| `/reset-password` | sessão de recuperação | definir nova senha |
| `/` | autenticado | lista paginada de notas, ação "Nova nota" |
| `/notes/new` | autenticado | criar |
| `/notes/:id` | autenticado | consultar, editar, excluir (com confirmação) |

Rotas privadas redirecionam anônimos para `/login`.

## Mapeamento operação → API

| Ação | Operação OpenAPI |
|------|------------------|
| Listar | `listNotes` (`limit`, `offset`) |
| Criar | `createNote` |
| Consultar | `getNote` |
| Salvar edição | `replaceNote` |
| Excluir | `deleteNote` |

Todas enviam `Authorization: Bearer <access_token>`.

## Mapeamento de respostas

| Resposta | Comportamento |
|----------|---------------|
| 2xx válida | confirma e atualiza a lista |
| 400 | exibe `errors` por campo; preserva rascunho |
| 401 | encerra sessão local, vai a `/login` com aviso |
| 404 | aviso de nota indisponível e retorno à lista |
| 5xx / rede / resposta inválida | erro "não confirmado" com tentar novamente |

## Acessibilidade
Rótulos associados, mensagens em região `role="alert"`/`aria-live`, navegação completa por teclado, layout utilizável a 360 px.
