---
spec: 003-http-and-session
status: in-progress
updated: 2026-10-11
---

# 003 · Design técnico

## Módulos

```
src/shared/api/
  contracts/envelope.ts        apiSuccess(schema), apiErrorBody (Zod)
  errors/ApiError.ts           classe + type guards (isApiError, hasCode)
  errors/errorCopy.ts          código → microcopy (tabela de contrato-api.md)
  errors/getErrorMessage.ts    (error, context?) → string
  errors/applyFieldErrors.ts   RHF setError a partir de fieldErrors
  transport/HttpTransport.ts   porta: request<T>(req, schema) → Promise<T>   ← DIP
  transport/fetchTransport.ts  implementação com timeout e parse do envelope
  server/backendClient.ts      server-only: base URL do env, Bearer do cookie, X-Forwarded-For
  server/bffRoutes.ts          lista permitida tipada: { method, pattern } + sessionOnlyRoutes (nunca no proxy)
  server/proxyToBackend.ts     streaming do corpo, cópia de status e cabeçalhos permitidos
  client/bffClient.ts          fetch para /api/*, cabeçalho CSRF, mesmo parse
src/shared/auth/
  contracts/session.ts         SessionUser (id, fullName, email, role, avatarUrl?)
  server/sessionCookies.ts     setSessionCookies / clearSessionCookies / readSessionTokens
  server/refreshSingleFlight.ts  execução única por hash do refresh token
  server/getSession.ts         cache() → GET /users/me ou null
  server/csrf.ts               assertSameOriginMutation(request)
src/app/api/
  [...path]/route.ts           proxy pela lista permitida
  auth/sessions/{login,refresh,logout,switch}/route.ts
  owners/register · users/register · owners/reactivate · hosts/reactivate · users/me/password  /route.ts (toda rota que devolve tokens)
src/bootstrap/providers/
  QueryProvider.tsx            QueryClient do navegador; escuta SESSION_EXPIRED → clear + redirect
  AppProviders.tsx             Theme + Query (ordem fixa)
```

`features/*/api/client` e `api/server` recebem o transporte pronto (`bffClient` e `backendClient`) e só declaram caminho, método e schema. Nenhuma feature chama `fetch` direto.

## Fluxo do proxy (`[...path]`)

1. Casa o método e o caminho na `bffRoutes`; sem casamento, 404.
2. Mutação → `assertSameOriginMutation`.
3. Lê os tokens. Se o access token vence em menos de 60 s, `refreshSingleFlight(refreshToken)`.
4. Repassa ao backend com o Bearer e o `X-Forwarded-For`.
5. Recebe 401 com `UNAUTHORIZED` e ainda não tentou o refresh → refresh único e repete uma vez.
6. Refresh falhou → limpa os cookies e responde 401 `SESSION_EXPIRED`.
7. Copia o status, o corpo em streaming e os cabeçalhos permitidos (`content-type`, `retry-after`, `location`).

## Execução única do refresh

`Map<sha256(refreshToken), Promise<Tokens>>`: a primeira chamada cria a promessa; as demais, com o mesmo token, aguardam a mesma promessa. A entrada sai do mapa quando a promessa termina. Isso cobre abas e requisições paralelas numa instância (limite de várias instâncias no `requirements.md`).

## Erros

| Origem     | Código                                                                | Status                          |
| ---------- | --------------------------------------------------------------------- | ------------------------------- |
| API        | o que vier                                                            | o que vier                      |
| Transporte | `NETWORK_ERROR`                                                       | 0                               |
| Schema     | `CONTRACT_MISMATCH`                                                   | 502 no BFF / lançado no cliente |
| BFF        | `SESSION_EXPIRED` 401 · `CSRF_REJECTED` 403 · `ROUTE_NOT_ALLOWED` 404 |                                 |

## Matriz de testes

| REQ             | Nível                     | Arquivo                                                      | Caso                                                                                                                                                  |
| --------------- | ------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 001/002/003/004 | Unitário + integração     | `fetchTransport.test.ts`, `fetchTransport.int.test.ts` (MSW) | sucesso válido; 400 com details aninhados; 429 com Retry-After; 500 com traceId; corpo inválido → CONTRACT_MISMATCH; timeout; rede caída              |
| 005             | Unitário                  | `getErrorMessage.test.ts`                                    | cada código da tabela; desconhecido → genérico; contexto (ex.: e-mail de tutor vs anfitrião)                                                          |
| 006             | Componente                | `applyFieldErrors.test.tsx`                                  | erro em `email` e em `address.zipCode` aparece no campo certo                                                                                         |
| 007/008         | Integração                | `app/api/auth/sessions/login/route.int.test.ts`              | Set-Cookie com flags; corpo sem tokens; Max-Age a partir do expiresAt                                                                                 |
| 009             | Unitário                  | `bffRoutes.test.ts`                                          | casa os padrões; nega o desconhecido; **lista bate com os controllers** (teste de contrato contra o OpenAPI gerado: toda rota da lista existe na API) |
| 010             | Integração                | `[...path]/route.int.test.ts`                                | Bearer e X-Forwarded-For chegam ao backend (MSW inspeciona); status e Retry-After repassados                                                          |
| 011             | Integração                | `refreshSingleFlight.int.test.ts`                            | 5 requisições paralelas com o token vencido → **1** chamada de refresh; todas repetem com o token novo                                                |
| 012/017         | Integração + componente   | `route.int.test.ts`, `QueryProvider.test.tsx`                | refresh 401 → cookies apagados + SESSION_EXPIRED; provider limpa o cache e navega para o login com next                                               |
| 013             | Integração                | `csrf.int.test.ts`                                           | sem Origin, Origin de outro site ou sem o cabeçalho → 403; GET passa                                                                                  |
| 014             | Integração                | `multipart.int.test.ts`                                      | arquivo de 4,9 MB passa sem estourar memória (o corpo é stream); limite da API respeitado (413 repassado)                                             |
| 015/016         | Integração + E2E simulado | `getSession.int.test.ts`, `e2e/mocked/session.spec.ts`       | sem cookie → null; vencido → redireciona para o refresh e volta                                                                                       |
| 018             | Unitário                  | `queryClient.test.ts`                                        | servidor: instância nova por chamada; keys com accountId                                                                                              |
| 019             | Unitário (arquitetura)    | `src/test/architecture/no-token-storage.test.ts`             | busca estática: nenhum `localStorage`/`sessionStorage` com token; nenhum log de Authorization                                                         |
