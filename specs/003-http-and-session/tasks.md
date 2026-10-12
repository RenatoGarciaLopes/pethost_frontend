---
spec: 003-http-and-session
status: in-progress
updated: 2026-10-11
---

# 003 · Tarefas

- [x] **T1 · Envelope e ApiError** (2026-10-11) (REQ-HTTP-001, 002, 003): testes de `envelope`/`ApiError` → `contracts/envelope.ts`, `errors/ApiError.ts`
- [x] **T2 · Transporte** (2026-10-11) (REQ-HTTP-004): `fetchTransport.test.ts` + `.int.test.ts` → `transport/*`
- [x] **T3 · Microcopy de erros** (2026-10-11) (REQ-HTTP-005): `getErrorMessage.test.ts` → `errorCopy.ts` (copiar a tabela de `produto/contrato-api.md`; o vault vira link para o arquivo)
- [x] **T4 · Erros no formulário** (2026-10-11) (REQ-HTTP-006): `applyFieldErrors.test.tsx`
- [x] **T5 · Cookies de sessão** (2026-10-11) (REQ-HTTP-007, 008): testes de `sessionCookies` → `shared/auth/server/sessionCookies.ts`
- [x] **T6 · Handlers de sessão** (2026-10-11) (REQ-HTTP-007, 017): `login`, `logout`, `switch`, `refresh` (refresh também atende GET com `next` para o REQ-HTTP-016) + `owners/register`, `users/register`, `owners/reactivate`, `hosts/reactivate`, `users/me/password` (toda rota que devolve tokens; `password/reset` não devolve e passa pelo proxy); um teste de integração por handler
- [x] **T7 · Lista permitida** (2026-10-11) (REQ-HTTP-009): `bffRoutes.test.ts` (inclui o teste contra o OpenAPI gerado)
- [x] **T8 · CSRF** (2026-10-11) (REQ-HTTP-013): `csrf.int.test.ts`
- [x] **T9 · Refresh com execução única** (2026-10-11) (REQ-HTTP-011, 012): `refreshSingleFlight.int.test.ts`
- [x] **T10 · Proxy** (2026-10-11) (REQ-HTTP-010, 014): `[...path]/route.ts` + testes de repasse e multipart
- [x] **T11 · getSession e redirect de RSC** (2026-10-11) (REQ-HTTP-015, 016)
- [x] **T12 · Providers** (2026-10-11) (REQ-HTTP-017, 018): `QueryProvider`, `AppProviders` em `app/layout.tsx`; `createQueryClient` server/browser
- [x] **T13 · Proteções estáticas** (2026-10-11) (REQ-HTTP-019): teste de arquitetura
- [ ] **T14 · Documentação:** catálogo (`ApiError`, `getErrorMessage`, `applyFieldErrors`, `bffClient`, `backendClient`, `getSession`, `bffRoutes`, providers); nota `development/resources/http-and-session.md`; atualizar `development/frontend-architecture.md` (seção BFF: proxy por lista permitida, limite de várias instâncias); documentar no README que a API precisa de `ForwardedHeaders__Enabled=true` onde o Next roda (o backend já confia em loopback e rede privada, `Program.cs` linhas 147 a 176); sem isso, todos os usuários dividem o limite de requisições do IP do servidor Next e a auditoria grava o IP errado

## Registro de execução (2026-10-11)

- Feito em TDD pelo Claude Code. Alguns módulos (`errorCopy`, `refreshSingleFlight`, `sessionGateway`, `bffRoutes`, handlers e proxy) tiveram teste e código escritos no mesmo passo; para compensar, duas mutações foram conferidas (desligar a execução única reprova REQ-HTTP-011; `localStorage.setItem("accessToken")` reprova REQ-HTTP-019).
- Bugs reais pegos pelos testes: `Date.parse("-3")` aceito como data no `Retry-After`; o transporte guardava o `fetch` global na criação (o MSW não interceptava).
- Achado no contrato: a API omite campos `null`, mas o OpenAPI os marca como obrigatórios; o transformador do Orval agora tira do `required` todo campo anulável (REQ-TOOL-008, com teste).
- Achado no lint (spec 001): teste em `shared`/`app` não podia importar `src/test`; corrigido com um bloco só para testes e stories em `eslint.config.mjs` e coberto em `boundaries.test.ts`.
- Desvios da spec, já refletidos em requirements e design: `Path=/api` no cookie de refresh; papéis fora da lista permitida; `users/me/password` no lugar de `password/reset` entre os handlers de sessão.
- T11: `getSession`, `getSessionState` e `requireSession` prontos com integração; E2E em `e2e/mocked/session.spec.ts`.
- T12: `QueryProvider`, `AppProviders` e `getQueryClient` prontos com testes; `AppProviders` entra no `app/layout.tsx` depois da spec 002 liberar o arquivo.
- T14: nota `development/resources/http-and-session.md`, 20 linhas no catálogo, `docs/architecture.md` (seção Sessão e BFF) e `produto/contrato-api.md` apontando para `errorCopy.ts`.

## Correções pendentes (achadas na revisão das specs 011 a 015, 2026-10-11)

- [x] **T15 · Formato de resposta por rota de sessão** (REQ-HTTP-007): `owners/register` e `owners/reactivate` devolvem `{ accessToken, refreshToken, expiresAt, owner: { ..., user } }`; `hosts/reactivate` devolve `host: { ..., user } | null` (anfitrião ainda não aprovado). Hoje o `createSessionHandler` valida tudo com `sessionSchema` e essas rotas respondem 502 `CONTRACT_MISMATCH`.
  - Teste primeiro: em `app/api/sessionRoutes.int.test.ts`, os fixtures de cada rota passam a vir do schema gerado da própria rota (não de um fixture único com `user` no topo, que foi o que escondeu o bug).
  - Código: `SessionHandlerConfig` ganha `responseSchema` e `toSession(data)`; quando `host` vier `null`, o handler lê `GET /users/me` com o access novo para devolver o `user`.
- [x] **T16 · Troca de conta revoga o refresh antigo** (REQ-HTTP-017, pedido da spec 014): depois do `switch` com sucesso, o handler chama `POST /auth/sessions/logout` com o refresh anterior (melhor esforço) antes de gravar os cookies novos.
- [ ] **T17 · Novos códigos em `errorCopy`** pedidos pelas specs 015, 021 e 031 (`PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE` e os códigos de verificação e admin), com o teste que garante frase para todo código.

## Registro (2026-10-11, fase de desenvolvimento)

- **T15:** `sessionPayloadSchema` e `userOfSessionPayload` em `shared/auth/contracts/session.ts` aceitam `user`, `owner.user` ou `host.user`; sem usuário na resposta, o handler lê `GET /users/me` com o access novo (`completeSession`).
- **T16:** `revokePreviousRefresh` no `createSessionHandler`; a rota de troca de conta usa. Teste existente atualizado.
- **Correção extra:** API fora do ar durante a conferência de sessão de uma rota autenticada agora responde 502 e mantém os cookies (antes virava `SESSION_EXPIRED`).
- **T12:** `AppProviders` ligado no `app/layout.tsx`.
- **E2E:** `e2e/mocked/session.spec.ts` 10 de 10 (desktop e celular).
- **Dívida de testes** (o Renato pediu para deixar testes novos para depois): T15 sem caso para `owner.user`, `host: null` e busca de `/users/me`; caso de 502 na conferência de sessão.

## Registro (2026-10-12, limpeza de código morto)

- `accountQueryKey` removido: nenhuma query usava. REQ-HTTP-018 segue com `getQueryClient` (um por requisição no servidor, um estável no navegador) e com o cache limpo no login e na troca de conta; a chave por conta volta em `queryClient.ts` com a primeira query por conta (spec 014), com o teste dela.
- Deixaram de ser exportados (só o próprio arquivo usa): `toLoginRequest`, `BFF_PREFIX`, `DEFAULT_TIMEOUT_MS`, `DEFAULT_REFRESH_MAX_AGE_SECONDS`, `getSessionState`, `SESSION_REFRESH_PATH`, `ROLE_HOME`, `ADMIN_LOGIN_PATH`, `apiFieldErrorSchema`, `apiErrorBodySchema`.
- Removidos sem uso: `LocalErrorCode`, `ApiFieldError`, `ApiErrorEnvelope`.
- `tsconfig.json`: `noUnusedLocals` e `noUnusedParameters` ligados.
