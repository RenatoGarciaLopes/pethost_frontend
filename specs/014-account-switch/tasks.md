---
spec: 014-account-switch
status: in-progress
updated: 2026-10-13
---

# 014 · Tarefas

Pré-requisito: 003, 004 (T5, T6, T8), 010 (`useCountdown`), 013 (rota de esqueci a senha).

- [x] **T1 · Revogar o refresh antigo na troca** (REQ-SWITCH-009)
  - Teste primeiro: caso novo em `src/app/api/sessionRoutes.int.test.ts`
  - Implementar: ajuste no handler de troca (`sessionHandlers.ts`, 003)
- [x] **T2 · Lógica pura** (REQ-SWITCH-003, 011)
  - Teste primeiro: `resolveSwitchTarget.test.ts`, `switchAvailability.test.ts`, `roleLabels.test.ts`
  - Implementar: `features/auth/lib/*`, `shared/config/roleLabels.ts`
- [x] **T3 · Contas vinculadas em `features/auth`** (REQ-SWITCH-003)
  - Teste primeiro: `useLinkedAccounts.int.test.tsx` (MSW no BFF)
  - Implementar: mover `useLinkedAccounts` da 004 para `features/auth`; `AccountMenu` passa a importar de `@/features/auth/index.client`
- [x] **T4 · Mutation** (REQ-SWITCH-005, 006)
  - Teste primeiro: `useSwitchAccountMutation.int.test.tsx`
- [x] **T5 · Painel** (REQ-SWITCH-002 a 008)
  - Teste primeiro: `AccountSwitchPanel.test.tsx`, `AccountSwitchPanel.errors.test.tsx`
  - Implementar: componentes + `app/(account)/users/switch/page.tsx` + stories
- [x] **T6 · Guarda e metadados** (REQ-SWITCH-001, 012)
- [ ] **T7 · E2E**: `e2e/mocked/auth/switch.spec.ts` (handlers do mock para `/users/me/accounts` e `/auth/sessions/switch`); `e2e/real/auth/switch.spec.ts` se o seed permitir
- [x] **T8 · Documentação:** TSDoc; catálogo (`useLinkedAccounts`, `useSwitchAccountMutation`, `roleLabel`); seção na nota `development/resources/auth.md`; resultados reais em `docs/validation.md`

## Registro (2026-10-13)

- T1 já existia (revogação do refresh antigo no handler da 003). T2 a T6 e T8 feitos; T7 com o E2E simulado (`e2e/mocked/auth/switch.spec.ts`, computador e celular). Falta o E2E real (`e2e/real/auth/switch.spec.ts`), que precisa da API de teste com a mesma pessoa nas duas contas.
- A 004 não tinha `useLinkedAccounts`, `accountQueryKey` nem a casca: nasceram aqui (ver decisões no `design.md`). Região viva nova: `AnnouncerProvider` no `AppProviders`.
- Achados pelos testes: o `RoleGate` e a página liam o relógio da sessão no prerender (agora `await connection()` antes); depois da troca o painel buscava a lista de contas de novo antes de sair (agora a consulta desliga).
- Stories do painel não foram feitas; entram na pendência única das stories das telas de conta.
