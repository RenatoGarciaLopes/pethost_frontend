---
spec: 004-app-shell-and-guards
status: draft
updated: 2026-10-11
---

# 004 · Tarefas

Cada tarefa: teste vermelho → código → verde → `npm run verify`. Um commit por tarefa.

- [x] **T1 · Casa do papel** (2026-10-11) (REQ-SHELL-016): `appRoutes.test.ts` → `ROLE_HOME`, `homeOf`, `resolvePostLoginPath` em `shared/config/appRoutes.ts`
- [x] **T2 · Tabela de navegação** (2026-10-11) (REQ-SHELL-002): `navigation.test.ts` → `shared/config/navigation.ts` (só telas existentes com `available: true`)
- [x] **T3 · Acesso por rota** (2026-10-11) (REQ-SHELL-009): `routeAccess.test.ts`, `readRoleHint.test.ts` → `routeAccess.ts`, `readRoleHint.ts`
- [x] **T4 · Proxy** (2026-10-11) (REQ-SHELL-009, 011): `src/proxy.int.test.ts` → `src/proxy.ts`
- [x] **T5 · requireRole** (2026-10-11) (REQ-SHELL-010): `requireRole.int.test.ts` (MSW) → `shared/auth/server/requireRole.ts`
- [ ] **T6 · Grupos de rota e layouts** (REQ-SHELL-010, 011): `(public)`, `(auth)`, `(owner)/owner`, `(account)` (tutor e anfitrião: `/pets`, `/users`, `/conversations`), `(host)/host`, `(admin)/admin/(panel)`; `AppProviders` no `app/layout.tsx` (pendência da 003, T12)
- [ ] **T7 · AppShell e HeaderNav** (REQ-SHELL-001, 002, 007, 008): gerar com `npm run gen:component -- widgets/app-shell AppShell`; testes de componente e stories
- [ ] **T8 · AccountMenu, useLogout e `useLinkedAccounts` (em `features/auth`)** (REQ-SHELL-003, 004, 005): `accountLabel.test.ts`, `AccountMenu.test.tsx` (MSW para `/api/users/me/accounts` e logout)
- [ ] **T9 · Gaveta no celular** (REQ-SHELL-006): `MobileNavDrawer.test.tsx`
- [ ] **T10 · loading, error, not-found, global-error** (REQ-SHELL-012 a 015)
- [ ] **T11 · E2E** (REQ-SHELL-009, 010, 014, 005): `e2e/mocked/shell.spec.ts` desktop e celular; handlers do mock para `/users/me/accounts`
- [x] **T12 · Ajustar a spec 010:** (2026-10-11) trocar `isSafeRedirect` por `toSafeInternalPath` e usar `resolvePostLoginPath` desta spec
- [ ] **T13 · Documentação:** TSDoc em todos; catálogo do vault (`AppShell`, `AccountMenu`, `useLogout`, `useLinkedAccounts`, `requireRole`, `NAV_ITEMS`, `ROLE_HOME`, `routeAccess`); nota `development/resources/app-shell.md`; registrar no `docs/validation.md` os resultados reais

## Registro (2026-10-11)

- T1 e T2 implementados com testes (`appRoutes.test.ts`, `navigation.test.ts`). Na T2, teste e código foram escritos no mesmo passo.
- T3 começou pelos testes (`jwtClaims.test.ts`, `routeAccess.test.ts`); eles estão em `drafts/` (extensão `.ts.txt`, fora do Vitest e do typecheck) até a fase de código voltar; destino: `src/shared/auth/edge/` e `src/shared/config/`, para o `verify` não ficar vermelho. `readRoleHint` vai para `shared/auth/edge/jwtClaims.ts` com `readUnverifiedClaims`, reaproveitado pelo `readAccessTokenExpiry` da 003.
- **T3:** `readUnverifiedClaims`/`readRoleHint` em `shared/auth/edge/jwtClaims.ts` (sem `Buffer`; o `readAccessTokenExpiry` da 003 passou a usar) e `accessFor` em `shared/config/routeAccess.ts`; os testes de `drafts/` voltaram para `src` e passam (11 + 5).
- **T4:** `src/proxy.ts` só delega para `guardRoute` (`shared/auth/server/routeGuard.ts`) e repassa o caminho atual no cabeçalho interno `x-pethost-path` (`shared/auth/contracts/requestHeaders.ts`), lido por `currentPath()`.
- **T5:** `requireRole(roles, path?)` em `shared/auth/server/requireRole.ts`; sem `path`, usa o caminho atual.
- **T6 (parcial):** layouts com guarda em `(owner)/owner`, `(account)`, `(host)/host` e `(admin)/admin/(panel)`; a casca (T7) ainda não entra.
- **Dívida de testes:** `proxy.int.test.ts` (guardRoute) e `requireRole.int.test.ts`.
- **Cache Components:** a guarda dos layouts virou `RoleGate` (`shared/auth/server/RoleGate.tsx`), que confere o papel dentro de `<Suspense>` com o `SniffLoader`; os quatro layouts de área usam `<RoleGate roles=...>`.
