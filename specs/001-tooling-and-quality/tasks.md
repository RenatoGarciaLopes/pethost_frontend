---
spec: 001-tooling-and-quality
status: done
updated: 2026-10-11
---

# 001 · Tarefas

- [x] **T1 · Limpar a estrutura** (2026-10-11) (D3, D4)
  - Remover as pastas vazias de `src/features`, `src/widgets`, `src/shared`, `src/bootstrap`, `src/app/(…)`, `src/app/api` e `src/__tests__`.
  - Mover a convenção da árvore para `docs/conventions.md` (já existe) e reduzir `docs/folder-structure.md` ao que tem arquivo.
  - Atualizar `development/frontend-folder-responsibilities.md` no vault.
  - Pronto quando: `find src -type d -empty` não devolve nada; `npm run build` verde.
- [x] **T2 · Prettier + scripts base** (2026-10-11) (REQ-TOOL-013)
  - Pronto quando: `npm run format:check` passa no repositório.
- [x] **T3 · Ambiente validado** (2026-10-11) (REQ-TOOL-015)
  - Teste primeiro: `src/shared/config/env.server.test.ts` (ausente, URL inválida, válido).
  - Implementar: `src/shared/config/env.server.ts` (`import 'server-only'`, Zod, `getServerEnv()` memorizado).
- [x] **T4 · Vitest em 4 projetos + setup + MSW estrito** (2026-10-11) (REQ-TOOL-001, 002, 004)
  - Teste primeiro: `src/test/msw/unhandled.int.test.ts`.
  - Implementar: `vitest.config.mts`, `src/test/setup/vitest.setup.ts`, `src/test/msw/server.ts`.
- [x] **T5 · renderWithProviders e builders** (2026-10-11) (REQ-TOOL-003)
  - Teste primeiro: `src/test/render.test.tsx`.
  - Implementar: `src/test/render.tsx` (aceita `theme` por parâmetro; o tema real chega na 002), builders de produto adiados até existirem consumidores; nenhum builder implementado na 001.
- [x] **T6 · Cobertura** (2026-10-11) (REQ-TOOL-005)
  - Implementar: `test:coverage` com limiar de 80% em linhas, ramos, funções e statements e `include` nas 3 camadas.
  - Pronto quando: o comando roda e reporta.
- [x] **T7 · Fronteiras no lint** (2026-10-11) (REQ-TOOL-006, 007)
  - Teste primeiro: `src/test/architecture/boundaries.test.ts` com fixtures que violam cada regra.
  - Implementar: `eslint.config.mjs` (boundaries, imports restritos em client, no-default-export).
- [x] **T8 · Contratos do OpenAPI** (2026-10-11) (REQ-TOOL-008, 009)
  - Rodar o backend local e o `api:sync`. **Conferir** se as respostas descrevem o envelope; se não descreverem, abrir pedido ao backend e registrar em `docs/validation.md`.
  - Implementar: `orval.config.ts`, scripts e `src/shared/api/generated/` (com a pasta excluída do lint e da cobertura).
  - Entregue scripts/openapi-transformer.mjs com teste para tipos numéricos do .NET 10.
- [x] **T9 · Playwright** (2026-10-11) (REQ-TOOL-010)
  - Implementar: `playwright.config.ts`, `e2e/support/mock-backend.mjs` (servidor HTTP com middleware MSW via `@mswjs/http-middleware` ou equivalente) e um teste fumaça `e2e/mocked/smoke.spec.ts` (a home responde).
- [x] **T10 · Storybook** (2026-10-11) (REQ-TOOL-011)
  - Implementar: `.storybook/*` e uma story de exemplo que é executada como teste.
  - O tema real entra na 002.
- [x] **T11 · Geradores** (2026-10-11) (REQ-TOOL-012)
  - Teste primeiro: `plop-templates/templates.test.ts`.
  - Implementar: `plopfile.mjs`, os templates de feature (os 3 `index*`) e de componente (tsx, teste, story, index).
- [x] **T12 · verify + CI** (2026-10-11) (REQ-TOOL-013, 014)
  - Implementar: `verify` e `.github/workflows/frontend.yml`.
  - Pronto quando: CI escrito, não executado por ausência de repositório git.
- [x] **T13 · Documentação** (2026-10-11)
  - Atualizar no repositório: `README.md`, `docs/testing-strategy.md` e `docs/validation.md` (versões e saídas reais).
  - Atualizar no vault: `development/frontend-testing-strategy.md`, mais o catálogo com renderWithProviders, createTestQueryClient, MSW, ambiente e tooling; sem builders inexistentes.

## Registro da entrega (2026-10-11)

001 done; D1 a D6 aprovadas por Renato. Implementação tem quatro projetos: unit, component, integration (Node) e integration-dom (jsdom); test:integration reúne os dois últimos. Tema Quintal na 002; builders de produto ainda não existem. Ambiente validado na primeira leitura por getServerEnv, não em hook de subida. Cobertura global 80% em linhas/ramos/funções/statements, com exclusões em vitest.config.mts. Client restrito por paths/sufixos convencionais. Contratos via Zod/z.infer, sem transporte gerado. gen:component recebe <camada> <Nome> separados. CI escrito, não executado; critério de execução de PR não verificado. [Resultados](../../docs/validation.md).
