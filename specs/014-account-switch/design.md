---
spec: 014-account-switch
status: in-progress
updated: 2026-10-13
---

# 014 · Design técnico

## Decisões tomadas na implementação (2026-10-13)

- **A 004 ainda não tem casca nem menu.** A 014 é o primeiro uso de `useLinkedAccounts`, `accountQueryKey` e `roleLabel`, que nascem aqui já no lugar previsto (`features/auth`, `shared/api/query`, `shared/config`); o `AccountMenu` da 004 importa de lá quando nascer.
- **Região viva no `AppProviders`:** o anúncio "Agora você está na conta de…" precisa sobreviver à troca de rota, e a casca da 004 ainda não existe. `AnnouncerProvider` + `useAnnounce` (`shared/ui/feedback/Announcer`) ficam acima dos grupos de rota; a casca reaproveita.
- **Senha que não confere aparece no campo, não num `Notice`:** o REQ-SWITCH-007 pede campo vazio e focado; um `Notice` que também pega o foco brigaria com o campo. A frase neutra vira o erro do campo, lida pelo leitor de tela ao focar. `429` e erro desconhecido usam o `ErrorNotice` da 013.
- **Reaproveita a 013:** `PasswordScreen` (coluna estreita com o cartão), `StepHeading`, `ErrorNotice`, `useErrorNotice`. O schema reaproveita a senha do login (`loginFormSchema.shape.password`): só exigida, sem regra de força.
- **"Agora não" leva à casa da conta atual** (`homeOf`), não ao histórico: quem abre o link direto não tem página anterior.
- **Cor da conta:** `theme.palette.account` (`accountTones`, já no tema); a 004 chamava de `headerTone`.
- **Sem `Suspense` próprio na página:** o do `RoleGate` do layout `(account)` cobre a leitura da sessão e de `searchParams`; a sessão vem do `cache()` do `getSession`, sem segundo `GET /users/me`.
- **Barreira de requisição antes da guarda:** `await connection()` no conteúdo assíncrono da página e no `ConfirmedArea` do `RoleGate` evita que o relógio de validade da sessão (`Date.now`) seja avaliado no prerender, inclusive quando o leitor de sessão é reutilizado do cache React. A página tem `Suspense` local com `SniffLoader`, pois a fronteira do layout não cobre a avaliação independente do segmento. Detectado pelo E2E com Next 16.4; o leitor compartilhado não foi alterado.
- **Destino da troca:** `homeOf` do papel novo. `/` e `/host` ainda não têm página (casa e casca são da 004); o mesmo vale para o login hoje.

## Rotas e renderização

| Arquivo                               | Tipo         | Faz                                                                                                                                                                                                    |
| ------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/(account)/users/switch/page.tsx` | RSC dinâmico | `requireRole(["owner", "host"], "/users/switch")`; resolve o destino (`resolveSwitchTarget(user.role, to)`); prefetch de `/users/me/accounts` com `HydrationBoundary`; renderiza `AccountSwitchScreen` |

`(account)` é o grupo de rotas das páginas de conta comuns a tutor e anfitrião (`/users/*`), com a casca da 004 na variante do papel atual. Registrar o grupo na 004 se ainda não existir.

## Árvore de componentes

```
AccountSwitchScreen (features/auth · server)
└─ AccountSwitchPanel (features/auth · client)
   ├─ useLinkedAccounts()            da 004 (widgets/app-shell → mover para features/auth, ver abaixo)
   ├─ AccountPair                    atual → destino, com a cor de cada conta (headerTone da 004)
   ├─ SwitchPasswordForm             PasswordField, link "Esqueci essa senha"
   ├─ EmptyState / Notice            sem conta, pausada, erros
   └─ useSwitchAccountMutation()
```

### Ajuste de dono

`useLinkedAccounts` nasce na 004 dentro de `widgets/app-shell`. Como a 014 também precisa dele e uma feature não importa widget, ele passa para `features/auth` (exportado no `index.client.ts`) e o widget importa de lá. Registrar na 004 (T8).

## Contratos e modelos

| Camada                | Símbolo                                                                                                             | Origem                          | Nota                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------- |
| DTO                   | `GetApiV1UsersMeAccountsResponse`                                                                                   | `shared/api/generated/users`    | `unwrapData` + estreitamento de `role` para `accountRoleSchema` |
| Modelo                | `LinkedAccount` (`{ role, isActive, isCurrent }`)                                                                   | `features/auth/types`           |                                                                 |
| DTO                   | `PostApiV1AuthSessionsSwitchBody` (`{ role, password }`)                                                            | `shared/api/generated/sessions` |                                                                 |
| Resposta ao navegador | `SessionResult`                                                                                                     | 003                             |                                                                 |
| Lógica pura           | `resolveSwitchTarget(current, to)`, `switchAvailability(accounts, target)` → `"available" \| "missing" \| "paused"` | `features/auth/lib`             |                                                                 |

## Fluxo de dados

- Query: `accountQueryKey(user.id, "linked-accounts")`, `staleTime` 60 s; prefetch no servidor com `createBackendClient` e hidratação.
- Mutation: `switchAccount({ role, password })` → `bffClient` `POST /auth/sessions/switch`. Sucesso: `queryClient.clear()`, `router.replace(homeOf(user.role))`, `router.refresh()`, anúncio na região viva da casca.
- **Ajuste no handler da 003 (REQ-SWITCH-009):** o handler de troca lê o refresh token antigo antes de regravar os cookies e chama `POST /auth/sessions/logout` com ele (falha ignorada). Teste de integração na 003.

## Erros

| Código                          | Onde                      | Comportamento                                                                         |
| ------------------------------- | ------------------------- | ------------------------------------------------------------------------------------- |
| `AUTH_LINKED_ACCOUNT_NOT_FOUND` | `Notice` + campo          | limpa e foca a senha; texto neutro                                                    |
| `VALIDATION_ERROR`              | campo                     | `applyFieldErrors(["password"])`; erro em `role` vira o genérico (não deve acontecer) |
| `TOO_MANY_REQUESTS`             | `Notice` + `useCountdown` | envio bloqueado                                                                       |
| `SESSION_EXPIRED`               | 003                       | `QueryProvider` leva ao login                                                         |
| erro na lista de contas         | `ErrorState`              | "Tentar de novo" refaz a query                                                        |

## Reutiliza

003: handler de troca, `bffClient`, `getErrorMessage`, `applyFieldErrors`, `accountQueryKey`, `createBackendClient`. 004: `requireRole`, `homeOf`, `headerTone`, casca. 002: `PasswordField`, `Notice`, `EmptyState`, `ErrorState`, `SniffLoader`. 010: `useCountdown`.

## Cria de reutilizável

| Recurso                                           | Vai para                      | Quem mais usa                                  |
| ------------------------------------------------- | ----------------------------- | ---------------------------------------------- |
| `useLinkedAccounts` (movido)                      | `features/auth`               | `AccountMenu` (004)                            |
| `useSwitchAccountMutation`                        | `features/auth`               | `AccountMenu`, se um dia a troca virar diálogo |
| `roleLabel(role)` ("tutor", "anfitrião", "admin") | `shared/config/roleLabels.ts` | 004 (`accountLabel`), 015                      |

## Matriz de testes

| REQ             | Nível            | Arquivo                                                    | Caso                                                                                                 |
| --------------- | ---------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 011             | Unitário         | `resolveSwitchTarget.test.ts`                              | `to` válido, ausente, inválido, igual ao atual                                                       |
| 003             | Unitário         | `switchAvailability.test.ts`                               | disponível, ausente, pausada                                                                         |
| 001             | Integração       | `page.int.test.tsx` (ou `requireRole` da 004)              | admin é redirecionado                                                                                |
| 002/003/004/011 | Componente (MSW) | `AccountSwitchPanel.test.tsx`                              | textos por direção; sem conta mostra cadastro; pausada mostra login; link de esqueci com `as`        |
| 005/006/007/008 | Componente (MSW) | `AccountSwitchPanel.errors.test.tsx`                       | payload; envio único; sucesso limpa o cache e navega para a casa; 404 limpa e foca; 429 com contagem |
| 009             | Integração       | caso novo em `src/app/api/sessionRoutes.int.test.ts` (003) | troca revoga o refresh antigo; falha da revogação não quebra a troca                                 |
| 010             | Arquitetura      | `no-token-storage.test.ts`                                 | nada de `password` em storage ou log                                                                 |
| 006             | E2E simulado     | `e2e/mocked/auth/switch.spec.ts`                           | tutor com as duas contas troca e cai em `/host`; cookies novos                                       |
| 003/007         | E2E simulado     | idem, mobile                                               | sem a outra conta; senha errada                                                                      |
| 006             | E2E real         | `e2e/real/auth/switch.spec.ts`                             | só se o seed tiver a mesma pessoa nas duas contas; senão N/A justificado no registro                 |
| Visual          | Storybook        | `AccountSwitchPanel.stories.tsx`                           | cada estado; a11y sem violação                                                                       |
| 012             | Integração (RSC) | `app/(account)/users/switch/page.test.ts`                  | `metadata.title` e `robots.index = false`                                                            |
