---
spec: 043-host-payouts
status: draft
updated: 2026-10-15
---

# 043 · Tarefas

Cada tarefa: vermelho → verde → refatorar → documentar. Depende da 030 (`HostOnboardingPanel`).

- [ ] **T1 · Contratos e modelo** (REQ-PAYOUT-008): `features/host-payouts/api/contracts.ts`, `toPayoutAccount`, `payoutRequirementOf`, copy
- [ ] **T2 · Appearance** (REQ-PAYOUT-005): `toStripeAppearance(theme)` + teste
- [ ] **T3 · Query, prefetch e mutations** (REQ-PAYOUT-001, 002, 006, 007): `payoutQueries`, `prefetchPayoutAccount`, `useStartOnboarding`, `useSyncPayoutAccount`, `useHostedOnboardingLink`; frases de erro (REQ-PAYOUT-012)
- [ ] **T4 · Dependência** : `npm install --ignore-scripts @stripe/connect-js @stripe/react-connect-js`; `EmbeddedOnboarding` com `next/dynamic`
- [ ] **T5 · Tela** (REQ-PAYOUT-003, 004, 008, 009, 010, 011): `HostPayouts`, estados, retorno `?stripe=`, plano B hospedado; rota `app/(host)/host/payments/page.tsx`
- [ ] **T6 · Painel** (REQ-PAYOUT-013): etapa 2 do `HostOnboardingPanel` com a situação real
- [ ] **T7 · Stories e E2E**: `HostPayouts.stories.tsx`; handlers `e2e/support/handlers/stripeAccount.mjs`; `e2e/mocked/host/payouts.spec.ts`
- [ ] **T8 · Documentação**: TSDoc; catálogo e nota no vault; `docs/validation.md`
