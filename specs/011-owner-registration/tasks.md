---
spec: 011-owner-registration
status: draft
updated: 2026-10-11
---

# 011 · Tarefas

Pré-requisito: 002 (T5 a T9), 003 concluída, 004 (T1, T6) e 010 (T5 `useCountdown`). Cada tarefa: teste vermelho → código → verde → `npm run verify`, um commit.

- [ ] **T1 · Ajuste do handler de sessão da 003** (pré-requisito de 010, 011, 012)
  - Teste primeiro: casos novos em `src/app/api/sessionRoutes.int.test.ts` com o formato real de `owners/register`, `owners/reactivate` (`owner.user`) e `hosts/reactivate` (`host.user` e `host: null`)
  - Implementar: `responseSchema` e `toSession` por rota em `sessionHandlers.ts`; rotas de `app/api/owners/*` e `app/api/hosts/reactivate`
- [ ] **T2 · Validações compartilhadas** (REQ-OREG-003, 004)
  - Teste primeiro: `isValidCpf.test.ts`, `isAdult.test.ts`, `parseBrazilianDate.test.ts`, `password.test.ts`
  - Implementar: `shared/lib/documents`, `shared/lib/date`, `shared/lib/validation/password.ts`; `PasswordStrengthChecklist` passa a ler `PASSWORD_RULES`
- [ ] **T3 · ViaCEP** (REQ-OREG-005)
  - Teste primeiro: `viaCep.test.ts` (schema e normalização), `useCepLookup.int.test.tsx` (MSW)
  - Implementar: `shared/api/external/viaCep.ts`, `shared/hooks/useCepLookup.ts`; CSP `connect-src`
- [ ] **T4 · Campos compartilhados** (REQ-OREG-005, 006, 016)
  - Teste primeiro: `AddressFields.test.tsx`, `BirthDateField.test.tsx`, `CpfField.test.tsx`
  - Implementar: em `shared/ui/forms` (gerar com `npm run gen:component -- shared/ui/forms <Nome>`), com stories
- [ ] **T5 · Schemas, passos e mapper** (REQ-OREG-002, 003, 008)
  - Teste primeiro: `ownerRegistrationSchema.test.ts`, `toOwnerRegisterBody.test.ts`
  - Implementar: `npm run gen:feature -- registration`; `schemas/*`, `lib/registrationSteps.ts`, `api/mappers/*`, `api/contracts/*`
- [ ] **T6 · Cliente e mutation** (REQ-OREG-008, 013)
  - Teste primeiro: `useRegisterMutation.int.test.tsx` (MSW no BFF): sucesso limpa o cache; corpo sem tokens
  - Implementar: `api/client/registration.client.ts`, `hooks/useRegisterMutation.ts`
- [ ] **T7 · Escolha de conta** (REQ-OREG-001, 015)
  - Teste primeiro: `RegisterChoice.test.tsx`
  - Implementar: `RegisterChoice`, `app/(auth)/register/page.tsx`
- [ ] **T8 · Wizard, caminho feliz** (REQ-OREG-002 a 008, 016, 017)
  - Teste primeiro: `RegistrationWizard.test.tsx`
  - Implementar: `RegistrationWizard`, `PersonStep`, `AddressStep`, `RegistrationScreen`, `app/(auth)/register/owner/page.tsx` + stories
- [ ] **T9 · Erros** (REQ-OREG-009 a 012)
  - Teste primeiro: `RegistrationWizard.errors.test.tsx`
- [ ] **T10 · Sucesso** (REQ-OREG-013)
  - Teste primeiro: `RegistrationSuccess.test.tsx`
- [ ] **T11 · Privacidade** (REQ-OREG-014, 018)
  - Teste primeiro: caso novo no `no-token-storage.test.ts` (cpf e password); metadados da página
- [ ] **T12 · E2E** (REQ-OREG-001, 002, 005, 008, 013, 015)
  - Escrever `e2e/mocked/registration/owner.spec.ts` (desktop e mobile; handlers do mock para `/owners/register` e ViaCEP) e `e2e/real/registration/owner.spec.ts`
- [ ] **T13 · Documentação**
  - TSDoc em todos; catálogo do vault (`AddressFields`, `useCepLookup`, `fetchAddressByCep`, `isValidCpf`, `isAdult`, `strongPasswordSchema`, `BirthDateField`, `CpfField`, `features/registration`); nota `development/resources/registration.md`; resultados reais em `docs/validation.md`
