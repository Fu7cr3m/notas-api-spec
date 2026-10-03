# Data Model: Interface Web para Notas

Modelos do cliente; a fonte normativa dos dados de nota é `specs/001-notes-api-baseline/contracts/openapi.yaml`.

## Note (contrato)
`id` (string opaca), `title`, `content`, `createdAt`, `updatedAt` (RFC 3339).

## NotePage (contrato)
`data: Note[]`, `total`, `limit` (1–100, padrão 50), `offset` (≥ 0).

## NoteDraft (cliente)
`title`, `content` — strings; válidas quando `trim()` não é vazio. Mantido ao falhar o envio para não perder o texto.

## AuthState (cliente)
`status`: `loading | anonymous | authenticated | recovery`; `session` (token de acesso do Supabase, nunca persistido manualmente nem logado).

## ProblemDetails (contrato)
`type`, `title`, `status`, `detail?`, `instance?`, `errors?[{pointer, detail}]`.

## OperationState (cliente)
`idle | loading | success | validation-error | unauthorized | not-found | unavailable`.

## Transições principais
- `loading → authenticated | anonymous` na inicialização; 401 em qualquer chamada → `anonymous`.
- Lista: `loading → ready(vazia|com itens) | unavailable`.
- Exclusão: `confirming → deleting → removida` só após 204.
