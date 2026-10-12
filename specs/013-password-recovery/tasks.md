---
spec: 013-password-recovery
status: draft
updated: 2026-10-11
---

# 013 · Tarefas

Pré-requisito: 003, 004 (`useLogout`), 010 (`useCountdown`), 011 (T2, `strongPasswordSchema`).

- [ ] **T1 · Segredo na URL** (REQ-PWD-005, 013)
  - Teste primeiro: `readSecretFromUrl.test.ts`, `useUrlSecret.test.tsx`
  - Implementar: `shared/lib/url/readSecretFromUrl.ts`, `shared/hooks/useUrlSecret.ts`
- [ ] **T2 · Schemas e cliente** (REQ-PWD-001, 002, 007, 008)
  - Teste primeiro: `forgotPasswordSchema.test.ts`, `resetPasswordSchema.test.ts`, `password.client.int.test.ts` (MSW no BFF)
  - Implementar: `features/auth/schemas/*`, `features/auth/api/client/password.client.ts`; extrair `emptyDataSchema` para `shared/api/contracts`
- [ ] **T3 · Pedir o link** (REQ-PWD-001 a 004, 012)
  - Teste primeiro: `ForgotPasswordFlow.test.tsx`
  - Implementar: `ForgotPasswordFlow`, `ForgotPasswordForm`, `ResetLinkSent`, `app/(auth)/forgot-password/page.tsx` + stories
- [ ] **T4 · Senha nova** (REQ-PWD-005 a 012)
  - Teste primeiro: `ResetPasswordFlow.test.tsx`, `ResetPasswordFlow.errors.test.tsx`
  - Implementar: `ResetPasswordFlow`, `ResetPasswordForm`, `ResetDone`, `app/(auth)/reset-password/page.tsx` (com `referrer: "no-referrer"`) + stories
- [ ] **T5 · Privacidade** (REQ-PWD-013, 014): caso novo no teste de arquitetura; metadados
- [ ] **T6 · E2E**: `e2e/mocked/auth/password.spec.ts` (desktop e mobile; handlers do mock para forgot e reset) e `e2e/real/auth/password.spec.ts`
- [ ] **T7 · Documentação:** TSDoc; catálogo (`useUrlSecret`, `readSecretFromUrl`, `emptyDataSchema`); seção na nota `development/resources/auth.md`; registrar a recomendação do `ResetUrl` em `docs/architecture.md`; resultados reais em `docs/validation.md`
