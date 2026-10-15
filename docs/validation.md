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

## 12/10/2026 · Dívida de cobertura em feat/010-login-motion

Entrega restrita ao worktree `pethost_frontend-010`, com testes e documentação. Código de produção, thresholds de 80%, includes/excludes de cobertura e dependências não foram alterados. Matriz de recursos, paths, níveis aplicáveis e limites na nota `development/resources/auth.md` do vault.

| Verificação                                          | Resultado                                                                                                             |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Baseline `npm.cmd run test:coverage`                 | 57 arquivos, 338 testes passando; cobertura falhou: statements 63,28%, branches 58,16%, funções 58,24%, linhas 62,92% |
| Final `npm.cmd run test:coverage`                    | 75 arquivos, 455 testes passando; exit 0, todos os thresholds atendidos                                               |
| Statements                                           | 96,87% (992/1024)                                                                                                     |
| Branches                                             | 95,22% (758/796)                                                                                                      |
| Funções                                              | 97,19% (277/285)                                                                                                      |
| Linhas                                               | 97,57% (887/909)                                                                                                      |
| `npm.cmd run test:e2e:mocked -- --workers=1`         | 28/28 passando, desktop e celular, Next real com backend MSW simulado                                                 |
| `npm.cmd run verify`                                 | Exit 0: format, lint, typecheck e 455 testes em 75 arquivos aprovados                                                 |
| Paths da matriz de documentação e `git diff --check` | Conferidos                                                                                                            |

Foram adicionados 117 casos Vitest em 18 arquivos de suíte e cinco jornadas Playwright executadas nos dois projetos. Conta suspensa mantém frase sem link, conforme pendência de canal de suporte registrada na spec 010 e decisão do usuário. Os testes de reativação verificam credenciais do último envio mesmo após editar os campos, bloqueio de envio duplicado e falha da reativação.

Limitações de ambiente e correções nos testes: Turbopack recusou o link de `node_modules` fora da raiz do worktree; a validação do browser usou `node node_modules/next/dist/bin/next dev --webpack -p 3100`, com `BACKEND_URL=http://localhost:5099` e `BACKEND_API_PREFIX=/api/v1`. O backend simulado já disponível foi reutilizado sem alterar seu processo. O servidor Next iniciado por esta tarefa foi encerrado ao terminar os E2E. As execuções de browser e cobertura foram sequenciadas depois de timeouts sob carga; uma execução E2E anterior perdeu um artefato de trace por sobreposição de runners e foi substituída pela execução completa 28/28. A verificação de fontes aceita ambas as formas de aspas da serialização CSS. O teste da abertura breve da porta usa MutationObserver e casos independentes para porta/capacho, preservando animações Motion reais.

Nenhum E2E contra a API .NET real foi executado; MSW não prova integração completa com o backend. Não foram instaladas dependências, lidas configurações do backend, alterados outros worktrees, feitos push ou ações na porta 3000.

O primeiro verify parou na formatação porque o checkout Windows tinha CRLF (core.autocrlf=true) e o Prettier exige LF. Os finais de linha dos arquivos rastreados foram normalizados apenas na cópia local; o diff confirmou conteúdo versionado de produção e configurações inalterados. O verify completo acima passou após essa normalização.

## 12/10/2026 · Cadastro de tutor (spec 011)

| Verificação                                                                                | Resultado                                                                                                     |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit`                                                                         | 0 erros                                                                                                       |
| `npx eslint .`                                                                             | 0 problemas                                                                                                   |
| `npx prettier --check .`                                                                   | tudo formatado                                                                                                |
| `npx vitest run --maxWorkers=2`                                                            | 76 arquivos, 459 testes verdes                                                                                |
| `npm run storybook:test` (a11y em modo `error`)                                            | 32 arquivos, 99 testes verdes                                                                                 |
| `next build` (backend simulado)                                                            | compilou; `/register` e `/register/owner` como Partial Prerender                                              |
| `npx playwright test --project=mocked-desktop --project=mocked-mobile` contra `next start` | 24 de 24 (cadastro completo, CEP, cookies HttpOnly e redirecionamento com sessão, no computador e no celular) |

Observação: o `next dev` da porta 3000 é de outro processo; o E2E rodou contra `next build` + `next start -p 3100`, desligado no fim.

## 12/10/2026 · Cadastro de anfitrião (spec 012)

| Verificação                                                                                | Resultado                                                                                                                               |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run verify` (Prettier, ESLint, tsc, Vitest), depois do rebase sobre `dev`             | 96 arquivos, 616 testes verdes                                                                                                          |
| `next build` (backend simulado)                                                            | compilou; `/register/host` como Partial Prerender                                                                                       |
| `npx playwright test --project=mocked-desktop --project=mocked-mobile` contra `next start` | 30 de 30 (jornada do anfitrião sem CPF, corpo sem `cpf` e sem `role`, 409 com `as=host`, cookies HttpOnly, redirecionamento com sessão) |
| `npm run test:coverage`                                                                    | 96,75% statements, 94,95% branches, 96,09% funções, 97,33% linhas (meta de 80% atendida depois da dívida da 010 paga)                   |
| E2E real                                                                                   | não rodado: precisa da API de teste                                                                                                     |

## 13/10/2026 · Recuperação de senha (spec 013)

| Verificação                                                                             | Resultado                                                                                                                        |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `npm run verify` (Prettier, ESLint, tsc, Vitest), depois do rebase sobre `dev`          | 107 arquivos, 690 testes verdes                                                                                                  |
| `npm run test:coverage`                                                                 | 96,82% statements, 94,68% branches, 96,34% funções, 97,54% linhas                                                                |
| `npx playwright test --project=mocked-desktop --project=mocked-mobile`, antes do rebase | 38 de 38 (14 casos da 013: pedido neutro, troca de senha, token fora da URL, token vencido, `Referrer-Policy`, `?as=` por papel) |
| `next build`, Storybook e E2E mocked depois do rebase                                   | no CI do PR                                                                                                                      |
| E2E real                                                                                | não rodado: precisa da API de teste                                                                                              |

O teste de `ForgotPasswordForm` achou um bug: o erro de `role` vindo da API ficava no formulário sem aparecer; corrigido. Cobertura por suíte na nota `development/resources/auth.md` do vault. O mock local da porta 5099 era um processo antigo sem as rotas de senha; o E2E antes do rebase usou um proxy temporário com `e2e/support/handlers/password.mjs`, desligado no fim.

## 13/10/2026 · Trocar de conta (spec 014)

| Verificação                                                                                           | Resultado                                                                                                                          |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `npm run verify` (Prettier, ESLint, tsc, Vitest)                                                      | 121 arquivos, 738 testes verdes                                                                                                    |
| `npm run test:coverage`                                                                               | 96,99% statements, 94,88% branches, 96,64% funções, 97,60% linhas                                                                  |
| `npx playwright test e2e/mocked/auth/switch.spec.ts --project=mocked-desktop --project=mocked-mobile` | 12 de 12 (troca para `/host` com cookies novos, senha errada, sem a outra conta, pausada, `?to=` inválido, admin, título e robots) |
| Teste da leitura única das contas depois da troca                                                     | falhou antes da correção (2 leituras), passa depois (1)                                                                            |
| `next build`, Storybook e E2E completo                                                                | no CI do PR                                                                                                                        |
| E2E real                                                                                              | não rodado: precisa da API de teste com a mesma pessoa nas duas contas                                                             |

Detalhes por suíte na nota `development/resources/auth.md` do vault. O E2E local usou o mock atual numa porta temporária (5100), porque o da 5099 é um processo antigo sem as rotas novas.

## 13/10/2026 · Minha conta (spec 015)

| Verificação                                                                               | Resultado                                                                                                                                         |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run verify` (Prettier, ESLint, tsc, Vitest)                                          | 151 arquivos, 926 testes verdes                                                                                                                   |
| `npm run test:coverage`                                                                   | 96,83% statements, 93,88% branches, 97,19% funções, 97,91% linhas                                                                                 |
| `npx playwright test e2e/mocked/account --project=mocked-desktop --project=mocked-mobile` | 22 de 22 (perfil do tutor e do anfitrião PF, PJ e não aprovado, trava do CPF, foto, troca de senha, pausar e voltar pelo login, navegação, admin) |
| Storybook do `AvatarUploader` (a11y)                                                      | 6 stories sem violação                                                                                                                            |
| Regressão do CPF travado (`LockedField`)                                                  | falhou antes da correção, passa depois (componente e navegador)                                                                                   |
| `next build`, Storybook completo e E2E completo                                           | no CI do PR                                                                                                                                       |
| E2E real                                                                                  | não rodado: precisa da API de teste                                                                                                               |

Detalhes por suíte na nota `development/resources/account.md` do vault.

## 13/10/2026 · Casca do app (spec 004, T6 a T11)

| Verificação                                                                               | Resultado                           |
| ----------------------------------------------------------------------------------------- | ----------------------------------- |
| `npm run verify` (Prettier, ESLint, tsc, Vitest)                                          | 160 arquivos, 963 testes verdes     |
| Cobertura, `next build`, Storybook e E2E mocked completo (com `e2e/mocked/shell.spec.ts`) | no CI do PR                         |
| E2E real                                                                                  | não rodado: precisa da API de teste |

Detalhes na nota `development/resources/app-shell.md` do vault.

## 13/10/2026 · Meus pets (spec 020)

| Verificação                                                                                      | Resultado                           |
| ------------------------------------------------------------------------------------------------ | ----------------------------------- |
| `npm run verify` (Prettier, ESLint, tsc, Vitest)                                                 | 171 arquivos, 1016 testes verdes    |
| Cobertura, `next build`, Storybook e E2E mocked completo (com `e2e/mocked/pets/my-pets.spec.ts`) | no CI do PR                         |
| E2E real                                                                                         | não rodado: precisa da API de teste |

Detalhes na nota `development/resources/pets.md` do vault.

## 14/10/2026 · Apresentar o pet (spec 021)

| Verificação                                                                 | Resultado                                                         |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `npm run verify` (Prettier, ESLint, tsc, Vitest)                            | 193 arquivos, 1135 testes verdes                                  |
| `npm run test:coverage`                                                     | 96,75% statements, 93,55% branches, 96,74% funções, 97,80% linhas |
| E2E mocked `e2e/mocked/pets/new-pet.spec.ts` (desktop e celular, workers 1) | 10 de 10                                                          |
| Storybook do `PetWizard` e `PhotoSlots` (a11y)                              | 11 stories sem violação                                           |
| E2E real                                                                    | não rodado: precisa da API de teste                               |

Detalhes na nota `development/resources/pets.md` do vault.

## 14/10/2026 · Ficha, edição e fotos do pet (spec 022)

| Verificação                                                                                    | Resultado                                                                         |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `npm run verify -- -- --maxWorkers=2` (Prettier, ESLint, tsc, Vitest)                          | 206 arquivos, 1238 testes verdes                                                  |
| E2E mocked `e2e/mocked/pets/pet-profile.spec.ts` (desktop e celular, workers 1, servidor frio) | 16 de 16                                                                          |
| E2E mocked de pets inteiro (020, 021 e 022)                                                    | 34 de 34 antes das correções da revisão; a suíte da 022 repetida depois, 16 de 16 |
| Storybook de `PetProfile`, `PetEditor`, `ConfirmDialog` e `PhotoSlots` (a11y)                  | 17 testes sem violação                                                            |
| E2E real                                                                                       | não rodado: precisa da API de teste                                               |

Sem `--maxWorkers=2`, nesta máquina o verify estoura o timeout de 5 s em testes longos de outras specs e no `Max-Age` dos cookies da 003, que depende do relógio. Os mesmos testes passam isolados. O E2E local roda com `next dev --webpack -p 3100`, porque o Turbopack recusa a junction de `node_modules` da worktree.

Detalhes na nota `development/resources/pets.md` do vault.

## 15/10/2026 · Minha verificação do anfitrião (spec 030)

| Verificação                                                                                                                 | Resultado                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Vitest da 030 (`--maxWorkers=2`): feature, `DocumentSlot`, `StatusTimeline`, imagem, CNPJ, widget, rotas, mock              | 132 testes verdes: 58 unitários, 49 de componente, 16 de integração (Node), 9 de integração (jsdom) |
| Vitest das áreas tocadas (inclui `shared/ui/forms`, `shared/api/errors`, `shared/config`, arquitetura e `features/account`) | 74 arquivos, 482 testes verdes                                                                      |
| ESLint, `tsc --noEmit`, Prettier dos arquivos da entrega                                                                    | sem erros                                                                                           |
| E2E mocked `e2e/mocked/host/verification.spec.ts`                                                                           | escrito; não rodado pelo agente da spec (regra da máquina compartilhada)                            |
| Storybook (a11y) de `ApplicationWizard`, `ApplicationStatusView`, `DocumentSlot`, `StatusTimeline`, `HostOnboardingStages`  | escritas; não rodadas pelo agente da spec                                                           |
| E2E real `e2e/real/host/verification.spec.ts`                                                                               | pulado sem `E2E_HOST_EMAIL`/`E2E_HOST_PASSWORD`                                                     |

## 15/10/2026 · Montar meu cantinho (spec 044)

| Verificação                                                                                                   | Resultado                                                                                            |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Vitest da 044 (`--maxWorkers=2`): feature, dinheiro, `WeekdayPicker`, `PhotoSlots`, widget, rotas, mock       | 105 testes verdes: 46 unitários, 22 de componente, 14 de integração (Node), 23 de integração (jsdom) |
| Vitest das áreas tocadas (inclui 030, `shared/ui/forms`, `shared/ui/media`, `shared/api/errors`, arquitetura) | 69 arquivos, 433 testes verdes                                                                       |
| ESLint, `tsc --noEmit`, Prettier dos arquivos da entrega                                                      | sem erros                                                                                            |
| E2E mocked `e2e/mocked/host/listing.spec.ts` e Storybook                                                      | escritos; não rodados pelo agente da spec (regra da máquina compartilhada)                           |

## 15/10/2026 · Pedidos e estadias do anfitrião (spec 053)

| Verificação                                                                                                                 | Resultado                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Vitest da 053 (`--maxWorkers=2`): base de `bookings`, lista, detalhe, decisões, widget das fichas, `stayRules`, rotas, mock | 60 testes verdes: 22 unitários, 13 de componente, 10 de integração (Node), 15 de integração (jsdom) |
| ESLint, `tsc --noEmit`, Prettier                                                                                            | sem erros                                                                                           |
| E2E mocked `e2e/mocked/bookings/host-requests.spec.ts` e Storybook                                                          | escritos; não rodados pelo agente da spec                                                           |

## 15/10/2026 · Chegou e voltou pra casa (spec 054)

| Verificação                                                                            | Resultado                                 |
| -------------------------------------------------------------------------------------- | ----------------------------------------- |
| Vitest: `stayMilestones` (3), `StayMilestones` (9), trilha do tutor em `bookingStatus` | verdes                                    |
| Vitest de `features/bookings` inteira (053 + 054)                                      | 54 testes verdes                          |
| ESLint, `tsc --noEmit`, Prettier                                                       | sem erros                                 |
| E2E mocked `e2e/mocked/bookings/stay-day.spec.ts` e Storybook                          | escritos; não rodados pelo agente da spec |

## 15/10/2026 · Minhas estadias (spec 052)

| Verificação                                                                                                                                                       | Resultado                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Vitest (`--maxWorkers=2`): `features/bookings`, `host-listings`, widgets, tema, `WeekdayPicker`, `ConfirmDialog`, rotas do tutor e do anfitrião, mock de reservas | ver a linha da execução final abaixo                                              |
| Por projeto (bookings, rotas do tutor, mock, `ConfirmDialog`)                                                                                                     | 25 unitários, 22 de componente, 12 de integração (Node), 33 de integração (jsdom) |
| ESLint, `tsc --noEmit`, Prettier                                                                                                                                  | sem erros                                                                         |
| E2E mocked `e2e/mocked/bookings` (my-stays, host-requests, stay-day), desktop e celular                                                                           | 20/20 na última execução                                                          |
| Storybook (`StayList`, `StayDetail`, `HostBookingList`, `HostBookingDetail`, `StayMilestones`, `ConfirmDialog`, `WeekdayPicker`)                                  | 31/31                                                                             |

Defeitos achados pelo E2E e pelas stories, corrigidos na 052 (vinham da 044 e da 053):

- `/host` quebrava no servidor: `WEEKDAY_VALUES` saía de um módulo `"use client"` (chegava ao servidor como referência) e quatro componentes de servidor passavam `component={NextLink}` ao `Button`. A constante foi para `WeekdayPicker/weekdays.ts` e o tema define `MuiButtonBase.defaultProps.LinkComponent = NextLink`; no servidor basta `href`.
- "voltou pra casa" sumia: a `StayMilestones` desmontava quando a estadia virava `completed`. Agora fica montada.
- Avatar com iniciais sem contraste (axe) na lista e no detalhe do anfitrião: coral com o texto de contraste do tema, como no shell.
- `host-requests.spec.ts`: espera a hidratação antes de abrir o pedido e dá 60 s à primeira jornada, que compila as rotas a frio no `next dev`.
