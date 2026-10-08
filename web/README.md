# Notas Web

Interface web (React + Vite + TypeScript) para criar conta, entrar e gerenciar as
próprias notas. Consome a API de notas sem alterar o contrato
[`openapi.yaml`](../specs/001-notes-api-baseline/contracts/openapi.yaml) e usa o Supabase Auth.

## Executar

1. Na raiz: `npm run db:start` e `npm run dev` (API em `http://127.0.0.1:3000`).
2. Em `web/`: `npm install`, copie `.env.example` para `.env` e preencha
   `VITE_SUPABASE_ANON_KEY` com a chave pública de `npx supabase status`.
   Nunca use a chave `service_role`.
3. `npm run dev` e abra `http://127.0.0.1:5173`.

O Vite encaminha `/api/*` para a API (proxy), evitando CORS. A recuperação de senha
exige `http://127.0.0.1:5173` em `additional_redirect_urls` do `supabase/config.toml`
(reinicie o Supabase após alterar). E-mails locais aparecem no Mailpit
(`http://127.0.0.1:54324`).

## Scripts

- `npm run dev` / `npm run build` / `npm run preview`
- `npm run typecheck`
- `npm test` — Vitest + Testing Library + MSW; os testes de contrato validam
  requisições e respostas contra os schemas do `openapi.yaml`.

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do Supabase Auth (local: `http://127.0.0.1:54321`) |
| `VITE_SUPABASE_ANON_KEY` | Chave pública anon/publishable |
| `VITE_API_BASE_URL` | Base da API (padrão `/api`) |
