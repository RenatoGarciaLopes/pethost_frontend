# Estratégia de testes do frontend

Spec 001 implementada em 11/10/2026. D3 aprovada: testes ao lado do código, apoio em src/test e E2E na raiz e2e. Testar comportamento observável, falhas e limites; justificar níveis N/A por recurso.

| Projeto em vitest.config.mts | Ambiente | Padrão                                        |
| ---------------------------- | -------- | --------------------------------------------- |
| unit                         | Node     | *.test.ts, incluindo scripts e plop-templates |
| component                    | jsdom    | *.test.tsx                                    |
| integration                  | Node     | *.int.test.ts                                 |
| integration-dom              | jsdom    | *.int.test.tsx                                |

Integração é excluída dos projetos unit/component. passWithNoTests desligado; integration-dom cobre o cliente de autenticação e os hooks de login/reativação via MSW na spec 010. test:integration reúne os dois projetos de integração. A matriz detalhada está na nota `development/resources/auth.md` do vault.

src/test/setup/vitest.setup.ts instala jest-dom e MSW estrito, limpa handlers/DOM e encerra servidor. Requisição sem handler é rejeitada e reprova no afterEach com método e URL. src/test/msw/server.ts oferece server, recordUnhandledRequest, takeUnhandledRequests e formatUnhandledRequestMessage. server-only tem alias para setup/server-only.stub.ts somente nos testes.

src/test/render.tsx: renderWithProviders usa cache Emotion isolado, tema MUI, CssBaseline, QueryClient novo por render e user-event; createTestQueryClient sem retry. Tema Quintal na 002. Não há builders/handlers de produto. src/test/architecture/boundaries.test.ts exercita lint com fixtures.

Cobertura v8 em src/features, src/shared e src/widgets: limiar global 80% em linhas, ramos, funções e statements. Gerados, stories, índices e declarações excluídos. 100% dos arquivos cobertos não significa cobertura de funcionalidades futuras.

playwright.config.ts: mocked-desktop, mocked-mobile (390x844), real-desktop. Simulado sobe e2e/support/mock-backend.mjs (Express + middleware MSW, 5099) e Next 3100 via node diretamente. e2e/mocked/smoke.spec.ts verifica home/título. Real exige BACKEND_URL ou E2E_BACKEND_URL, sem fallback; não há jornadas reais ainda. Consulte [instruções](../e2e/real/README.md), execute modos separados e reinicie servidores ao trocar backend.

Storybook 10 em .storybook: a11y test error, desktop 1440x960 e celular 390x844. vitest.storybook.config.ts testa stories no Chromium; Pipeline temporário será removido na 002.

Comandos: npm.cmd run test, test:unit, test:component, test:integration, test:coverage, test:e2e:mocked e storybook:test. verify reúne format:check, lint, typecheck e Vitest; não inclui browsers. CI .github/workflows/frontend.yml escrito, não executado. [Resultados reais](validation.md). Lint/build não substituem comportamento; smoke simulado não valida API real.
