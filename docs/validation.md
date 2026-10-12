# Validação da base

Em 11/10/2026, o projeto foi gerado pelo CLI `create-next-app@latest`, com TypeScript, ESLint, App Router, src-dir, npm e sem Tailwind. Next 16.4.0, React 19.3.0, MUI 9.5.0; versões completas no lockfile.

A primeira checagem de TypeScript encontrou `LayoutProps`, tipo gerado pelo Next ainda indisponível antes do primeiro build. O layout foi ajustado para declarar `children: ReactNode`, permitindo checagem independente do build.

`npm run lint`, `npm run typecheck` e `npm run build` passaram. O build publicou somente a home estática do scaffold e o not-found interno, conforme esperado; SSR de negócio e integração com a API aguardam implementação.

Features, widgets, shared e bootstrap não contêm arquivos. As rotas planejadas também não têm páginas/handlers implementados. Metadados e idioma foram ajustados no layout gerado; nenhuma tela de produto foi criada.

Após alinhar a nomenclatura à API e ao ER, a estrutura passou a ter 14 features, com `users`, `owners` e `hosts` separados. Todas as pastas de interface estão em inglês; recursos seguem plural/kebab-case, e autenticação usa `auth`, conforme o backend. A conferência de diretórios não encontrou os nomes antigos em português, os links locais da documentação são válidos e as camadas de negócio continuam com zero arquivos. TypeScript e build foram executados novamente após a reorganização.

## Estrutura e política de testes

Foram acrescentadas 222 pastas sob `src/__tests__`, com o padrão AquaGas unit/component/mocks/e2e e extensões integration e e2e mocked/real. A regra exige testar cada comportamento desenvolvido nos níveis aplicáveis e justificar N/A. A estratégia existe no repositório e no vault; cada pasta está documentada no inventário de responsabilidades. Helpers e fixtures reutilizáveis seguirão o catálogo.

Esta mudança criou somente diretórios e documentação: não há casos, configs, scripts test ou runners instalados. Nenhum teste funcional, unitário, de integração ou E2E foi executado nesta etapa. Os checks lint/typecheck/build mencionados acima pertencem à validação anterior do scaffold, não são evidência de testes de comportamento. A validação desta mudança verifica diretórios, documentação e links.

## Dependências

`npm audit` reportou cinco ocorrências de severidade alta, todas na cadeia de desenvolvimento `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`. A origem é o advisory [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) sobre padrões profundamente aninhados no braces.

Na consulta ao registry, `braces@3.0.3` e `micromatch@4.0.8` eram as versões latest e já estavam instaladas. A correção automática oferecida pelo audit rebaixaria `eslint-config-next` para 14.2.35, incompatível com a base pretendida. Não aplicamos `audit fix --force`. A pendência fica documentada; reavaliar atualização da cadeia do ESLint antes de adicionar infraestrutura de CI.

O ambiente também informou script de instalação não aprovado para `unrs-resolver`. Não foi necessário aprová-lo para a validação da base.

## 11/10/2026 · Spec 001

Resultados verificados pelo Claude Code em 11/10/2026, fornecidos para esta entrega. Nesta atualização documental as suítes não foram reexecutadas.

| Comando                     | Resultado real registrado                                              |
| --------------------------- | ---------------------------------------------------------------------- |
| npm.cmd run verify          | exit 0: format ok, lint ok, typecheck 0 erros, 83 testes em 6 arquivos |
| npm.cmd run test:coverage   | 100% nos arquivos cobertos                                             |
| npm.cmd run test:e2e:mocked | 2 passed, desktop e mobile                                             |
| npm.cmd run storybook:test  | 1 passed                                                               |
| npm.cmd run storybook:build | ok                                                                     |
| npm.cmd run api:check       | ok; adulteração deliberada detectada                                   |
| npm.cmd run build           | ok, somente / e _not-found estáticos                                   |

Regressões: z.string().url() aceitava localhost:5038; agora exige http/https. Ambiente tem 10 testes e cobertura 100%; naming Plop tem 56 testes. Arquitetura estabilizada com aquecimento no beforeAll, quatro execuções seguidas verdes.

CI .github/workflows/frontend.yml escrito, não executado porque frontend ainda não é repositório git. Job verify: npm ci --ignore-scripts, verify, api:check, test:coverage e build. Job browser: instala Chromium, storybook:test, test:e2e:mocked e relatório em falha. Nenhuma pendência de código na 001; não há jornadas E2E reais nem comprovação de integração completa à API.

Instalação com --ignore-scripts respeitou allow-scripts do usuário; @types/node em ^24. npm 11/npx passa --allow-scripts ao executar binários, por isso Playwright chama Next diretamente via node.

OpenAPI: email/password do login nullable e role como string livre, achados para pedir correção ao backend. Front estreita em api/contracts quando consumidores forem implementados. BFF/transporte na 003. .env.example: 5038 (dotnet run), 8080 (Docker), ForwardedHeaders__Enabled=true atrás do futuro BFF.

| Pacote                   | Faixa declarada | Resolvida no lockfile |
| ------------------------ | --------------- | --------------------- |
| vitest                   | ^5.0.3          | 5.0.3                 |
| @playwright/test         | ^1.64.0         | 1.64.0                |
| storybook                | ^10.6.1         | 10.6.1                |
| msw                      | ^2.15.0         | 2.15.0                |
| orval                    | ^8.41.0         | 8.41.0                |
| eslint-plugin-boundaries | ^7.2.0          | 7.2.0                 |
| prettier                 | ^3.9.10         | 3.9.10                |

Seções anteriores registram histórico do scaffold, substituído pela 001. Registros provisórios e falhas antigas dos READMEs de suporte foram superados pelos resultados finais e pela publicação no vault.

## 11/10/2026 · Tema, sessão e tela de entrar (specs 002, 003, 004 e 010)

| Verificação                                                                            | Resultado                                                                                                           |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit`                                                                     | 0 erros                                                                                                             |
| `npx eslint .`                                                                         | 0 problemas                                                                                                         |
| `npx vitest run --maxWorkers=2`                                                        | 58 arquivos, 342 testes, todos verdes                                                                               |
| `npx playwright test e2e/mocked`                                                       | 18 de 18 (inclui `session.spec.ts`, 10 de 10, desktop e celular)                                                    |
| Conferência visual (`e2e/support/screenshot-login.mjs`, `next dev` + backend simulado) | `/login` (tutor, anfitrião, erro de credencial, validação), `/login` no celular 390 × 844, `/admin/login`           |
| Fluxo manual no Chromium                                                               | e-mail normalizado; `next` interno respeitado e externo ignorado; cookies HttpOnly; `/login` com sessão redireciona |

Achados corrigidos nesta rodada:

- `mutationFn` do TanStack Query 5 recebe um 2º argumento (contexto), que quebrava o login;
- leitura de cookies e `searchParams` fora de `<Suspense>` com Cache Components;
- rotas de cadastro e reativação devolvem `owner.user` e `host.user`.

Observação de ambiente: no Git Bash, `BACKEND_API_PREFIX=/api/v1` é convertido em caminho do Windows. Suba o Next pelo PowerShell ou com `MSYS_NO_PATHCONV=1`. A validação de ambiente acusa o erro com a mensagem certa.

Dívida de testes (testes novos ficaram para depois, a pedido do Renato): ver a seção de registro de `tasks.md` nas specs 002, 003, 004 e 010.

## 12/10/2026 · Tela de entrar com Motion e limpeza de código morto (specs 002, 003, 004 e 010)

| Verificação                                                                                | Resultado                                                                                                                           |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit` (agora com `noUnusedLocals` e `noUnusedParameters`)                     | 0 erros                                                                                                                             |
| `npx eslint .`                                                                             | 0 problemas                                                                                                                         |
| `npx prettier --check .`                                                                   | tudo formatado                                                                                                                      |
| `npx vitest run --maxWorkers=2`                                                            | 57 arquivos, 338 testes, todos verdes (saíram os testes de `NAV_ITEMS` e `accountQueryKey`, entrou o das molas do Motion)           |
| `npm run storybook:test` (a11y em modo `error`)                                            | 29 arquivos, 88 testes verdes (entrou a story do `Reveal`)                                                                          |
| `next build` (backend simulado)                                                            | compilou; `/login` e `/admin/login` como Partial Prerender                                                                          |
| `npx playwright test --project=mocked-desktop --project=mocked-mobile` contra `next start` | 18 de 18                                                                                                                            |
| Conferência visual (Chromium, 1440 × 960 e 390 × 844, movimento reduzido)                  | montagem em ordem, cena interativa, foco preservado ao clicar na cena, `h1` visível no celular, 9 carregamentos sem erro no console |

Observação de ambiente: havia outro `next dev` aberto na mesma pasta (porta 3000, outro processo, apontando para outro backend). O Next 16 não deixa abrir um segundo `next dev` na mesma pasta, então a suíte E2E rodou contra `next build` + `next start -p 3100` com o backend simulado.
