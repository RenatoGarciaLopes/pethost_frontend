---
spec: 012-host-registration
status: in-progress
updated: 2026-10-12
---

# 012 · Tarefas

Pré-requisito: 011 concluída (inclusive a T1, ajuste do handler da 003).

- [x] **T1 · Variantes** (REQ-HREG-001, 002)
  - Teste primeiro: `registrationVariants.test.ts` (a tabela tem as duas variantes com rota, schema, mapper e textos)
  - Implementar: `features/registration/lib/registrationVariants.ts`; a 011 passa a ler dela
- [x] **T2 · Schema e mapper** (REQ-HREG-002, 004)
  - Teste primeiro: `hostRegistrationSchema.test.ts`, `toHostRegisterBody.test.ts`
- [x] **T3 · Cliente** (REQ-HREG-004)
  - Teste primeiro: caso host em `useRegisterMutation.int.test.tsx`
- [x] **T4 · Tela** (REQ-HREG-001, 003, 005, 006, 009, 010)
  - Teste primeiro: `RegistrationWizard.host.test.tsx`
  - Implementar: `app/(auth)/register/host/page.tsx`
- [x] **T5 · Sucesso** (REQ-HREG-007)
- [ ] **T6 · E2E** (REQ-HREG-001, 004, 007, 009): `e2e/mocked/registration/host.spec.ts`, `e2e/real/registration/host.spec.ts`
- [x] **T7 · Documentação:** TSDoc; nota `development/resources/registration.md` com a seção da variante; resultados reais em `docs/validation.md`

## Registro (2026-10-12)

- T1 a T5 e T7 feitos; T6 com o E2E simulado (`e2e/mocked/registration/host.spec.ts`, computador e celular). Falta o E2E real (`e2e/real/registration/host.spec.ts`), que precisa da API de teste.
- O mock do E2E passou a lembrar a conta de cada token (`session.mjs`), para a sessão de anfitrião chegar em `/host`; a lógica de cadastro do mock é uma só (`handlers/registration.mjs`) para tutor e anfitrião.
