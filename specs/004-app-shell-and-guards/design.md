---
spec: 004-app-shell-and-guards
status: in-progress
updated: 2026-10-13
---

# 004 · Design técnico

## Decisões tomadas na implementação (2026-10-13)

- **Atalhos só com a primeira tela que os tiver:** nenhuma tela de atalho de cabeçalho existe ainda (meus pets, verificação, fila do admin, busca). `NAV_ITEMS`, `HeaderNav` e a gaveta do celular (REQ-SHELL-002, 006, 008) nascem com o primeiro atalho real (spec 020), para não ficar tabela nem componente sem uso. Hoje o cabeçalho tem o logo e o menu da conta, iguais no computador e no celular.
- **A casca é dona do `<main id="conteudo">`:** `AppShell` monta "Pular para o conteúdo", o cabeçalho e o `main`. Telas dentro da casca não criam outro: `AccountSettingsLayout` virou `div` e `PasswordScreen` ganhou `inShell` (a troca de conta usa). As telas de entrada (login, cadastro, senha) continuam com o próprio `main`, porque ficam fora da casca.
- **`RoleGate` entrega a conta confirmada:** `children` pode ser função do usuário (`(user) => <AppShell user={user}>…`); os quatro layouts de área (`(account)`, `(owner)/owner`, `(host)/host`, `(admin)/admin/(panel)`) usam assim. Um só `requireRole` por requisição, sem segundo `GET /users/me`.
- **Contas vinculadas só ao abrir o menu:** `AccountMenu` busca `/users/me/accounts` na primeira abertura (não a cada página); admin não busca. Falha esconde só o item de troca.
- **Menu da conta:** "Minha conta" (`/users/profile`, spec 015), "Trocar pra conta de …" (`/users/switch?to=`, spec 014) e "Sair". Frase da conta neutra ("Conta de tutor"), sem campo de tratamento na API.
- **Logo do cabeçalho:** `NextLink` direto com `aria-label="PetHost"` e símbolo decorativo (o nome não sai duplicado com o "pethost" escrito). Server Component não passa componente como prop para o MUI.
- **Sem `(public)` ainda:** não há página pública além das de entrada; o grupo nasce com a home (spec 040).
- **Cor do cabeçalho:** `theme.palette.account` (`accountTones`), por variável CSS do tema.

## Rotas e layouts

```
src/proxy.ts                          redirecionamento otimista (cookie + claim role)
src/app/
  layout.tsx                          <html>, fontes, AppProviders
  loading.tsx · error.tsx · not-found.tsx · global-error.tsx
  (public)/layout.tsx                 casca de visitante (AppShell variant="visitor")
  (auth)/layout.tsx                   telas de conta: login, cadastro, senha (sem atalhos)
  (owner)/owner/layout.tsx            requireRole("owner") → AppShell variant="owner" (/owner/...)
  (account)/layout.tsx                requireRole(["owner","host"]) → AppShell com a variant do papel atual
                                      (/pets, /users/..., /conversations: servem as duas contas)
  (host)/host/layout.tsx              requireRole("host")  → AppShell variant="host"
  (admin)/admin/(panel)/layout.tsx    requireRole("admin") → AppShell variant="admin"
  (admin)/admin/login/                fora do (panel): sem guarda
```

Grupos de rota mantêm as URLs do roadmap (`/pets`, `/host/...`, `/admin/...`) e dão a cada área o seu layout.

## Módulos

```
src/shared/config/appRoutes.ts        + ROLE_HOME, homeOf(role), resolvePostLoginPath(role, next)
src/shared/config/navigation.ts       NAV_ITEMS: { id, label, href, roles, icon, available } (tabela única)
src/shared/auth/server/requireRole.ts requireRole(role | role[], currentPath) → SessionUser
src/shared/auth/edge/readRoleHint.ts  lê a claim role do cookie sem verificar (só para o proxy)
src/proxy.ts                          usa routeAccess + readRoleHint
src/shared/config/routeAccess.ts      prefixo → papéis (função pura, testada)
src/widgets/app-shell/
  index.ts · index.client.ts
  components/AppShell.tsx             server: recebe user e variant, monta o cabeçalho e o <main id="conteudo">
  components/client/HeaderNav.tsx     atalhos com aria-current (usePathname)
  components/client/MobileNavDrawer.tsx
  components/client/AccountMenu.tsx   avatar, frase da conta, troca, sair
  components/SkipLink.tsx
  hooks/useLogout.ts                  POST /api/auth/sessions/logout → queryClient.clear() → /login
  lib/accountLabel.ts                 papel (+ tratamento opcional) → frase do menu
  lib/headerTone.ts                   variant → cor do cabeçalho (tokens do tema)
```

`useLinkedAccounts` (GET /users/me/accounts) mora em `features/auth` e sai pelo `index.client.ts`: a casca e a troca de conta (014) usam o mesmo hook, e uma feature não pode importar widget.

O widget só importa `shared` (e features pelo `index.client`, se precisar). Os textos e a tabela de navegação ficam em `shared/config` porque login, 404 e guards também usam.

## Proxy (`src/proxy.ts`)

1. Caminho público (`/`, `/search`, `/listings/*`, `/login`, `/admin/login`, `/register/*`, `/forgot-password`, `/reset-password`, `/api/*`, estáticos) → segue.
2. Sem `pethost_at` e sem `pethost_rt` → `/login?next=<rota>` (admin → `/admin/login?next=`).
3. Com `pethost_at`: `readRoleHint` decodifica a claim `role` **sem verificar a assinatura**. Papel não permitido no prefixo → `homeOf(role)`.
4. Só com `pethost_rt` (access venceu) → segue; o layout chama `requireRole`, que redireciona para o refresh (REQ-HTTP-016).

O proxy nunca é a autorização: é só para não piscar conteúdo. Quem decide é `requireRole` (API) e a própria API.

## Contratos

- `accountRoleSchema` (spec 003) para o papel.
- `GET /users/me/accounts`: `unwrapData(GetApiV1UsersMeAccountsResponse)` estreitado para `{ role: AccountRole; isActive: boolean; isCurrent: boolean }[]`.

## Reutilizável que a spec cria

| Recurso                                                     | Onde                                | Quem mais usa                                            |
| ----------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------- |
| `ROLE_HOME`, `homeOf`, `resolvePostLoginPath`               | `shared/config/appRoutes.ts`        | 010 (login), 011/012 (cadastro), 404                     |
| `NAV_ITEMS`                                                 | `shared/config/navigation.ts`       | toda spec que cria tela entra aqui com `available: true` |
| `routeAccess`                                               | `shared/config/routeAccess.ts`      | proxy e testes de guarda                                 |
| `requireRole`                                               | `shared/auth/server/requireRole.ts` | layouts de área e páginas específicas                    |
| `AppShell`, `AccountMenu`, `useLogout`, `useLinkedAccounts` | `widgets/app-shell`                 | 014 (troca), 015 (minha conta)                           |

Ajuste na spec 010: ela usa `toSafeInternalPath` (spec 003) e `resolvePostLoginPath` daqui, no lugar de criar `isSafeRedirect`.

## Matriz de testes

| REQ                 | Nível        | Arquivo                                                                             | Caso                                                                                                                                    |
| ------------------- | ------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 016                 | Unitário     | `appRoutes.test.ts`                                                                 | casa de cada papel; `next` seguro vence; inseguro cai na casa                                                                           |
| 002                 | Unitário     | `navigation.test.ts`                                                                | cada papel vê só os seus itens; `available: false` some; todo `href` é interno                                                          |
| 009                 | Unitário     | `routeAccess.test.ts`, `readRoleHint.test.ts`                                       | prefixo → papéis; público passa; token ilegível = sem papel                                                                             |
| 009                 | Integração   | `src/proxy.int.test.ts`                                                             | sem cookie → login com next; tutor em `/host` → `/`; anfitrião em `/admin` → `/host`; só refresh → segue                                |
| 010                 | Integração   | `requireRole.int.test.ts` (MSW)                                                     | papel certo devolve user; errado → redirect para a casa; sem sessão → refresh/login                                                     |
| 003                 | Unitário     | `accountLabel.test.ts`                                                              | frase por papel; forma neutra sem tratamento                                                                                            |
| 001/003/004/005/008 | Componente   | `AppShell.test.tsx`, `AccountMenu.test.tsx`, `HeaderNav.test.tsx`                   | cor por variant; atalhos do papel; `aria-current`; troca só com conta ativa; erro de contas esconde o item; sair limpa o cache e navega |
| 006/007             | Componente   | `MobileNavDrawer.test.tsx`, `SkipLink.test.tsx`                                     | foco preso, Esc fecha e devolve o foco; pular para o conteúdo                                                                           |
| 012 a 015           | Componente   | `loading.test.tsx`, `error.test.tsx`, `not-found.test.tsx`, `global-error.test.tsx` | status acessível; `traceId` do 5xx; link para a casa; sem tema                                                                          |
| 001 a 008           | Storybook    | `AppShell.stories.tsx` (tutor, anfitrião, admin, visitante, celular)                | a11y sem violação                                                                                                                       |
| 009/010/014         | E2E simulado | `e2e/mocked/shell.spec.ts` (desktop e celular)                                      | visitante em `/pets` → login → volta; tutor não entra em `/host`; 404 com link; sair                                                    |
