# Research: Interface Web para Notas

## Decisões

1. **Framework**: React + Vite + TypeScript (escolha do usuário). Rotas com React Router.
2. **Autenticação**: `@supabase/supabase-js` no browser com a chave pública (anon/publishable) do Supabase local; sessão persistida e renovada pelo SDK; `onAuthStateChange` alimenta o `AuthProvider`. Nunca usar service_role.
   - Alternativa: chamar a API REST do GoTrue manualmente — rejeitada (reimplementa renovação/persistência).
3. **Acesso à API / CORS**: a API não habilita CORS e esta feature não altera o servidor. Decisão: proxy do Vite (`/api/* → http://127.0.0.1:3000/*`) em `dev` e `preview`; o cliente usa base `/api` (configurável por `VITE_API_BASE_URL`).
   - Alternativa: adicionar `@fastify/cors` — rejeitada agora (mudança no servidor fora do escopo); fica como decisão para implantação.
4. **Redefinição de senha**: `resetPasswordForEmail` com `redirectTo` = `<origem>/reset-password`; a rota usa o evento `PASSWORD_RECOVERY` e `updateUser({ password })`. Exige adicionar `http://127.0.0.1:5173` a `additional_redirect_urls` em `supabase/config.toml` (o valor atual só cobre `https://127.0.0.1:3000`). E-mails locais aparecem no Mailpit (:54324).
5. **Cadastro**: confirmação de e-mail está desabilitada localmente (`signUp` já retorna sessão); a UI também trata `session == null` (confirmação exigida) mostrando próximos passos. Mensagens de recuperação são neutras (FR-013).
6. **Cliente HTTP**: `fetch` fino e tipado; lê `application/problem+json` e mapeia: 400 → erros por campo (`errors[].pointer` no formato `#/campo`), 401 → encerrar sessão local e redirecionar ao login, 404 → "indisponível" e voltar à lista, 5xx/rede → erro recuperável com "tentar novamente". 204 sem corpo no DELETE. Respostas de sucesso são verificadas minimamente (campos esperados) antes de confirmar (edge case de formato inesperado).
7. **Paginação**: `limit=50` (padrão do contrato) e `offset` por "anterior/próxima" usando `total`; sem inferir além do contrato. Ordem vem do servidor.
8. **Estados**: máquina simples por operação (`idle|loading|success|error`), lista vazia distinta de erro; exclusão só remove após 204.
9. **Validação de formulário**: título/conteúdo `trim()` não vazio antes de enviar (espelha `minLength:1` + `pattern '.*\S.*'`); o servidor continua autoritativo.
10. **Testes**: Vitest + Testing Library + MSW; testes de contrato validam corpo de requisições e respostas MSW contra schemas lidos do `openapi.yaml` com `yaml` + Ajv. E2E com navegador fica fora desta primeira versão; verificação manual guiada no quickstart.
11. **Acessibilidade/responsividade**: HTML semântico, `label` associados, `role="alert"`/`aria-live` para mensagens, foco gerenciado após ações, layout fluido a partir de 360 px, sem dependência de biblioteca de UI.
12. **Configuração**: `web/.env.example` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`; `.env` local ignorado.
