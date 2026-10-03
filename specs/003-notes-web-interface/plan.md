# Implementation Plan: Interface Web para Notas

**Branch**: `agents/speckit-constitution-update` | **Date**: 2026-10-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-notes-web-interface/spec.md`

## Summary

Criar uma SPA em React + Vite (diretório `web/`) que usa Supabase Auth (e-mail/senha:
cadastro, login, logout, recuperação e redefinição de senha) e consome a API Fastify
existente, sem alterar o contrato OpenAPI 001 nem o servidor. O token de acesso da sessão
Supabase é enviado como `Authorization: Bearer`. Para evitar CORS (a API não o configura),
o Vite faz proxy de `/api` para a API em desenvolvimento e preview; a única alteração fora
de `web/` é a configuração local do Supabase (URL de redirecionamento).

## Technical Context

**Language/Version**: TypeScript 5.x, Node 24 (tooling), React 19

**Primary Dependencies**: Vite, React, React Router, `@supabase/supabase-js` (auth no browser), Ajv + `yaml` (apenas testes, validação contra o contrato)

**Storage**: N/A no cliente além da sessão gerenciada pelo supabase-js; dados vivem na API

**Testing**: Vitest + Testing Library + MSW (testes de componentes/fluxos e de contrato do cliente); `npm run contract:lint` existente permanece como gate do contrato

**Target Platform**: navegadores atuais, viewport ≥ 360 px

**Project Type**: web application (frontend separado; backend existente em `src/`)

**Performance Goals**: lista e formulários responsivos para a página padrão de 50 notas; feedback de carregamento imediato

**Constraints**: contrato 001 intocado; sem service_role nem segredos no bundle (apenas URL e chave pública/anon); teclado e leitores de tela; sem mudanças na API

**Scale/Scope**: ~6 telas (login, cadastro, recuperar, redefinir, lista, formulário/detalhe de nota)

## Constitution Check

| Princípio | Avaliação |
|-----------|-----------|
| I. Contract-first | PASS — a UI só usa operações/estruturas de `openapi.yaml`; nada fora do contrato é assumido (ids opacos, `NotePage`, Problem Details). |
| II. Contratos explícitos | PASS — `contracts/ui-contract.md` descreve rotas, estados e mapeamento de erros sem duplicar o OpenAPI. |
| III. Compatibilidade | PASS — nenhuma mudança de contrato ou de servidor. |
| IV. Validação | PASS — `contract:lint` roda no gate; testes validam requisições/respostas do cliente contra schemas extraídos do contrato. |
| V. Documentação | PASS — quickstart e README de `web/` documentam execução e variáveis. |

Pós-design: sem violações; nenhuma exceção a documentar.

## Project Structure

### Documentation (this feature)

```text
specs/003-notes-web-interface/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui-contract.md
└── tasks.md        # /speckit-tasks
```

### Source Code (repository root)

```text
web/
├── index.html
├── package.json
├── vite.config.ts          # proxy /api -> API; Vitest config
├── tsconfig.json
├── .env.example            # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── src/
│   ├── main.tsx
│   ├── App.tsx             # rotas e guarda de autenticação
│   ├── auth/               # cliente Supabase, AuthProvider, telas de acesso
│   ├── api/                # cliente HTTP de notas, tipos, mapeamento de Problem
│   ├── notes/              # lista, detalhe, formulário, confirmação de exclusão
│   ├── components/         # estados (loading, vazio, erro), mensagens acessíveis
│   └── styles.css
└── tests/
    ├── auth/
    ├── notes/
    └── contract/
supabase/config.toml        # + http://127.0.0.1:5173 em additional_redirect_urls
```

**Structure Decision**: pacote npm independente em `web/` (não workspace), mantendo a API na raiz sem alterações; scripts raiz inalterados.

## Complexity Tracking

Sem violações a justificar.
