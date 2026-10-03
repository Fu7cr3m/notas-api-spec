# Quickstart: Interface Web para Notas

## Pré-requisitos
Docker ativo; Node 24; dependências da raiz instaladas.

## Subir o ambiente
1. `npm run db:start` (Supabase local) e `npm run dev` (API em http://127.0.0.1:3000).
2. `cd web`; `npm install`; copiar `.env.example` para `.env` e preencher `VITE_SUPABASE_URL` (http://127.0.0.1:54321) e `VITE_SUPABASE_ANON_KEY` (chave pública exibida por `npx supabase status`).
3. `npm run dev` → http://127.0.0.1:5173.

## Validação
- Automatizada: `cd web; npm test` e `npm run typecheck`; na raiz `npm run contract:lint` (contrato inalterado).
- Manual (cenários da spec):
  1. Cadastrar conta e entrar; recarregar a página mantém a sessão; sair volta ao login.
  2. Conta nova mostra estado vazio com ação "Nova nota".
  3. Criar nota; aparece na lista; abrir, editar, salvar; datas coerentes.
  4. Enviar título só com espaços: erro no campo, nada enviado.
  5. Excluir pede confirmação e só remove após sucesso.
  6. Parar a API: lista mostra erro com "tentar novamente", não lista vazia.
  7. Segunda conta não vê notas da primeira.
  8. Recuperação: solicitar, abrir o e-mail no Mailpit (http://127.0.0.1:54324), definir nova senha.
  9. Viewport de 360 px e navegação só por teclado.
