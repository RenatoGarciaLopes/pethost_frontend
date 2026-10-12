---
spec: 001-tooling-and-quality
status: done
updated: 2026-10-11
---

# 001 · Design técnico

## Pacotes (instalar a versão estável mais recente compatível com Next 16.4 e React 19.3; registrar as versões resolvidas em `docs/validation.md`)

| Função     | Pacotes                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Testes     | `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `msw` |
| E2E        | `@playwright/test`                                                                                                                    |
| Storybook  | `storybook`, `@storybook/nextjs-vite`, `@storybook/addon-a11y`, `@storybook/addon-vitest`, `@storybook/addon-docs`                    |
| Fronteiras | `eslint-plugin-boundaries`                                                                                                            |
| Formatação | `prettier`, `eslint-config-prettier`                                                                                                  |
| Contratos  | `orval` (cliente desligado; saída `zod` + tipos)                                                                                      |
| Geradores  | `plop`                                                                                                                                |

## Estrutura criada

```
openapi/pethost.v1.json         documento da API versionado
orval.config.ts                 entrada: openapi/pethost.v1.json → src/shared/api/generated
vitest.config.mts                projetos unit | component | integration | integration-dom
playwright.config.ts            projetos mocked-desktop | mocked-mobile | real-desktop
.storybook/{main,preview}.ts    a11y e viewports; tema/providers na 002
plopfile.mjs + plop-templates/  feature e component
e2e/{mocked,real,support}/      jornadas e apoio (fora do src)
src/test/
  setup/vitest.setup.ts         jest-dom, MSW (onUnhandledRequest: 'error'), limpeza
  msw/server.ts                 server e registro estrito
  setup/server-only.stub.ts     alias server-only nos testes
  render.tsx                    renderWithProviders, createTestQueryClient
src/shared/config/env.server.ts Zod do ambiente (server-only)
.github/workflows/frontend.yml  CI
```

O antigo diretório de testes espelhados foi removido; src/test contém infraestrutura (D3), sem pastas vazias reservadas (D4). As notas `docs/testing-strategy.md` e `development/frontend-testing-strategy.md` são atualizadas na mesma entrega.

## Fronteiras (eslint-plugin-boundaries)

Elementos: `app` (`src/app/**`), `bootstrap`, `widget` (`src/widgets/*`), `feature` (`src/features/*`), `shared` (`src/shared/**`), `test` (`src/test/**`), `generated` (`src/shared/api/generated/**`).

| De → para | Permitido                                                           |
| --------- | ------------------------------------------------------------------- |
| app       | bootstrap, widget, feature (só `index*`), shared                    |
| bootstrap | shared                                                              |
| widget    | feature (só `index*`), shared; **não** outro widget                 |
| feature   | ela mesma, shared; **não** outra feature                            |
| shared    | shared                                                              |
| generated | nada (só é importado por `features/*/api/contracts` e `shared/api`) |

Regras extras:

- `no-restricted-imports` em arquivos com `'use client'`, proibindo `**/api/server/**`, `server-only` e `**/*.server`.
- `import/no-default-export`, exceto nos arquivos especiais do Next e nas stories.

## Scripts

| Script                                                       | Faz                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------ |
| `format:check` / `format`                                    | Prettier                                                           |
| `lint`                                                       | ESLint com as fronteiras                                           |
| `typecheck`                                                  | `tsc --noEmit`                                                     |
| `test:unit` · `test:component` · `test:integration` · `test` | Vitest por projeto / todos                                         |
| `test:coverage`                                              | Vitest com o limiar                                                |
| `test:e2e:mocked` · `test:e2e:real`                          | Playwright por projeto                                             |
| `storybook` · `storybook:test`                               | Storybook dev / stories como testes                                |
| `api:sync`                                                   | Baixa `${BACKEND_URL}/openapi/v1.json` → `openapi/pethost.v1.json` |
| `api:generate` · `api:check`                                 | Orval / gera e falha se o resultado diferir do versionado          |
| `gen:feature` · `gen:component`                              | Plop                                                               |
| `verify`                                                     | `format:check && lint && typecheck && test`                        |

## Matriz de testes

| REQ                                  | Nível             | Arquivo                                                          | Caso                                                                                                                          |
| ------------------------------------ | ----------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| REQ-TOOL-002                         | Integração        | `src/test/msw/unhandled.int.test.ts`                             | Um fetch sem handler falha e a mensagem contém a URL                                                                          |
| REQ-TOOL-003                         | Componente        | `src/test/render.test.tsx`                                       | O componente de exemplo recebe o tema (lê um token) e o QueryClient; dois testes não compartilham cache                       |
| REQ-TOOL-006/007                     | Unitário          | `src/test/architecture/boundaries.test.ts`                       | Roda o ESLint programático sobre fixtures de imports proibidos em `src/test/architecture/fixtures/` e espera as regras certas |
| REQ-TOOL-009                         | CI                | `api:check`                                                      | Altera o gerado e o job falha (verificado manualmente uma vez; resultado registrado)                                          |
| REQ-TOOL-012                         | Unitário          | `plop-templates/templates.test.ts`                               | O template gera os nomes da convenção (PascalCase, `index.ts`, teste e story)                                                 |
| REQ-TOOL-015                         | Unitário          | `src/shared/config/env.server.test.ts`                           | Variável ausente ou URL inválida lançam erro com o nome da variável; o ambiente válido devolve um objeto tipado               |
| REQ-TOOL-001/004/005/010/011/013/014 | Execução          | N/A                                                              | Comprovados rodando os scripts e registrando a saída em `docs/validation.md` (não há como "testar" o runner com ele mesmo)    |
| 008                                  | Unitário + script | `scripts/openapi-transformer.test.ts`; `npm run api:check` no CI | normalização do OpenAPI; schema gerado igual ao versionado                                                                    |

## Registro da entrega (2026-10-11)

001 done; D1 a D6 aprovadas por Renato. Implementação tem quatro projetos: unit, component, integration (Node) e integration-dom (jsdom); test:integration reúne os dois últimos. Tema Quintal na 002; builders de produto ainda não existem. Ambiente validado na primeira leitura por getServerEnv, não em hook de subida. Cobertura global 80% em linhas/ramos/funções/statements, com exclusões em vitest.config.mts. Client restrito por paths/sufixos convencionais. Contratos via Zod/z.infer, sem transporte gerado. gen:component recebe <camada> <Nome> separados. CI escrito, não executado; critério de execução de PR não verificado. [Resultados](../../docs/validation.md).
