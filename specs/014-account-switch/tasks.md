---
spec: 014-account-switch
status: draft
updated: 2026-10-11
---

# 014 · Tarefas

Pré-requisito: 003, 004 (T5, T6, T8), 010 (`useCountdown`), 013 (rota de esqueci a senha).

- [ ] **T1 · Revogar o refresh antigo na troca** (REQ-SWITCH-009)
  - Teste primeiro: caso novo em `src/app/api/sessionRoutes.int.test.ts`
  - Implementar: ajuste no handler de troca (`sessionHandlers.ts`, 003)
- [ ] **T2 · Lógica pura** (REQ-SWITCH-003, 011)
  - Teste primeiro: `resolveSwitchTarget.test.ts`, `switchAvailability.test.ts`, `roleLabels.test.ts`
  - Implementar: `features/auth/lib/*`, `shared/config/roleLabels.ts`
- [ ] **T3 · Contas vinculadas em `features/auth`** (REQ-SWITCH-003)
  - Teste primeiro: `useLinkedAccounts.int.test.tsx` (MSW no BFF)
  - Implementar: mover `useLinkedAccounts` da 004 para `features/auth`; `AccountMenu` passa a importar de `@/features/auth/index.client`
- [ ] **T4 · Mutation** (REQ-SWITCH-005, 006)
  - Teste primeiro: `useSwitchAccountMutation.int.test.tsx`
- [ ] **T5 · Painel** (REQ-SWITCH-002 a 008)
  - Teste primeiro: `AccountSwitchPanel.test.tsx`, `AccountSwitchPanel.errors.test.tsx`
  - Implementar: componentes + `app/(account)/users/switch/page.tsx` + stories
- [ ] **T6 · Guarda e metadados** (REQ-SWITCH-001, 012)
- [ ] **T7 · E2E**: `e2e/mocked/auth/switch.spec.ts` (handlers do mock para `/users/me/accounts` e `/auth/sessions/switch`); `e2e/real/auth/switch.spec.ts` se o seed permitir
- [ ] **T8 · Documentação:** TSDoc; catálogo (`useLinkedAccounts`, `useSwitchAccountMutation`, `roleLabel`); seção na nota `development/resources/auth.md`; resultados reais em `docs/validation.md`
