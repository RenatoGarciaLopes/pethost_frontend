---
spec: 011-owner-registration
status: in-progress
updated: 2026-10-12
---

# 011 · Tarefas

Pré-requisito: 002 (T5 a T9), 003 concluída, 004 (T1, T6) e 010 (T5 `useCountdown`). Cada tarefa: teste vermelho → código → verde → `npm run verify`, um commit.

- [x] **T1 · Ajuste do handler de sessão da 003** (feito na 003, 2026-10-11: `sessionPayloadSchema` + `completeSession`) (pré-requisito de 010, 011, 012)
  - Teste primeiro: casos novos em `src/app/api/sessionRoutes.int.test.ts` com o formato real de `owners/register`, `owners/reactivate` (`owner.user`) e `hosts/reactivate` (`host.user` e `host: null`)
  - Implementar: `responseSchema` e `toSession` por rota em `sessionHandlers.ts`; rotas de `app/api/owners/*` e `app/api/hosts/reactivate`
- [x] **T2 · Validações compartilhadas** (REQ-OREG-003, 004)
  - Teste primeiro: `isValidCpf.test.ts`, `isAdult.test.ts`, `parseBrazilianDate.test.ts`, `password.test.ts`
  - Implementar: `shared/lib/documents`, `shared/lib/date`, `shared/lib/validation/password.ts`; `PasswordStrengthChecklist` passa a ler `PASSWORD_RULES`
- [x] **T3 · ViaCEP** (REQ-OREG-005)
  - Teste primeiro: `viaCep.test.ts` (schema e normalização), `useCepLookup.int.test.tsx` (MSW)
  - Implementar: `shared/api/external/viaCep.ts`, `shared/hooks/useCepLookup.ts`; CSP `connect-src` não se aplica (o projeto não tem CSP)
- [x] **T4 · Campos compartilhados** (REQ-OREG-005, 006, 016)
  - Teste primeiro: `AddressFields.test.tsx`, `BirthDateField.test.tsx`, `CpfField.test.tsx`
  - Implementar: em `shared/ui/forms` (gerar com `npm run gen:component -- shared/ui/forms <Nome>`), com stories
- [x] **T5 · Schemas, passos e mapper** (REQ-OREG-002, 003, 008)
  - Teste primeiro: `ownerRegistrationSchema.test.ts`, `toOwnerRegisterBody.test.ts`
  - Implementar: `npm run gen:feature -- registration`; `schemas/*`, `lib/registrationSteps.ts`, `api/mappers/*`, `api/contracts/*`
- [x] **T6 · Cliente e mutation** (REQ-OREG-008, 013)
  - Teste primeiro: `useRegisterMutation.int.test.tsx` (MSW no BFF): sucesso limpa o cache; corpo sem tokens
  - Implementar: `api/client/registration.client.ts`, `hooks/useRegisterMutation.ts`
- [x] **T7 · Escolha de conta** (REQ-OREG-001, 015)
  - Teste primeiro: `RegisterChoice.test.tsx`
  - Implementar: `RegisterChoice`, `app/(auth)/register/page.tsx`
- [x] **T8 · Wizard, caminho feliz** (REQ-OREG-002 a 008, 016, 017)
  - Teste primeiro: `RegistrationWizard.test.tsx`
  - Implementar: `RegistrationWizard`, `PersonStep`, `AddressStep`, `RegistrationScreen`, `app/(auth)/register/owner/page.tsx` + stories
- [x] **T9 · Erros** (REQ-OREG-009 a 012)
  - Teste primeiro: `RegistrationWizard.errors.test.tsx`
- [x] **T10 · Sucesso** (REQ-OREG-013)
  - Teste primeiro: `RegistrationSuccess.test.tsx`
- [x] **T11 · Privacidade** (REQ-OREG-014, 018)
  - Teste primeiro: caso novo no `no-token-storage.test.ts` (cpf e password); metadados da página
- [x] **T12 · E2E** (REQ-OREG-001, 002, 005, 008, 013, 015)
  - Escrever `e2e/mocked/registration/owner.spec.ts` (desktop e mobile; handlers do mock para `/owners/register` e ViaCEP) (o `e2e/real/registration/owner.spec.ts` fica pendente: precisa da API real de teste)
- [x] **T13 · Documentação**
  - TSDoc em todos; catálogo do vault (`AddressFields`, `useCepLookup`, `fetchAddressByCep`, `isValidCpf`, `isAdult`, `isStrongPassword`, `BirthDateField`, `CpfField`, `features/registration`); nota `development/resources/registration.md`; resultados reais em `docs/validation.md`

## Registro de desenvolvimento (2026-10-12)

Feito pelo Claude Code com dois agentes em paralelo: um fez a camada `shared` (T2 a T4, com testes e stories), outro os testes da feature e o E2E (T5 a T12); a feature, as telas e a conferência ficaram comigo. Branch `feat/011-owner-registration`.

**Decisões:** ver "Decisões tomadas na implementação" no `design.md` (escolha com radio + botão, sem `router.refresh()` no sucesso, `redirectIfSignedIn`, `registerPath`, schema de endereço e regra de senha em `shared`, rótulos sem asterisco, `FormActions` com `busy`).

**Bugs achados e corrigidos na mesma entrega:**

- `WizardProgress` e `ChoiceCard`: `width: 1` no `sx` do MUI é 100%, não 1 px. O texto escondido do progresso alargava a página no celular (466 px numa tela de 390) e o botão fixo saía da tela. Agora `"1px"`.
- `AddressFields` e `LoginForm`: o `ref` do React Hook Form caía na caixa de fora do `TextField`, e o foco de erro da API não chegava ao `<input>`. Agora `inputRef` (teste de regressão no `AddressFields`).
- `inputMode="email"` no `TextField` ia para a caixa de fora; removido (o `type="email"` já abre o teclado certo). Telefone com `inputmode="tel"`.
- Rótulo focado em coral (contraste perto de 3:1) e asterisco de obrigatório: corrigidos no tema para o app inteiro.
- Régua de senha com marcador de lista e "○" juntos: agora com os ícones desenhados.

**Conferência real:** Chromium em 1440 × 960 e 390 × 844 (`next dev`): escolha, passo 1 com erros, passo 2 com o CEP preenchendo (ViaCEP simulado), voltar mantém os dados, foco no título do passo novo, sem erro no console.

**Resultados:** ver `docs/validation.md` (12/10/2026, spec 011).

**Pendências:** E2E real (T12, precisa da API de teste); link de suporte no erro de CPF (sem canal definido); `/register/host` (012) e `/pets/new` (021) ainda não existem; testes de componente do `LoginForm` (dívida da 010) devem cobrir o foco pelo `inputRef`.
