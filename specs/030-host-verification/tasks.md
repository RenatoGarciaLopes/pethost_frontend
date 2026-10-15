---
spec: 030-host-verification
status: in-progress
updated: 2026-10-14
---

# 030 · Tarefas

Pré-requisito: 002, 003, 004 e as máscaras e o CEP da 011. Cada tarefa: teste vermelho → código → verde → `npm run verify`, um commit.

- [x] **T1 · Contratos e modelo** (2026-10-14) (REQ-HVER-011, 014, 016)
  - Teste primeiro: `toMyApplication.test.ts`, `rejectionCopy.test.ts`
  - Implementar: `features/host-applications/{api/contracts,api/mappers,types,lib/rejectionCopy.ts,lib/applicationStatusLabel.ts,index.ts}`
- [x] **T2 · Schemas e mappers de envio** (2026-10-14) (REQ-HVER-004, 005)
  - Teste primeiro: `startApplicationSchema.test.ts`, `toPatchApplicationRequest.test.ts`
- [x] **T3 · Microcopy de erros** (2026-10-14) (REQ-HVER-019)
  - Teste primeiro: ampliar `getErrorMessage.test.ts` (os códigos novos entram no `it.each`)
  - Implementar: frases novas em `shared/api/errors/errorCopy.ts`
- [x] **T4 · Cliente e hooks** (2026-10-14) (REQ-HVER-005, 008, 013)
  - Teste primeiro: `myApplication.client.int.test.ts`, `useUploadDocuments.int.test.tsx` (MSW no BFF)
  - Implementar: `api/client/myApplication.client.ts`, `api/server/myApplication.server.ts`, `hooks/*`
- [x] **T5 · prepareImageForUpload** (2026-10-14) (REQ-HVER-007)
  - Teste primeiro: `shared/lib/image/prepareImageForUpload.test.ts`
- [x] **T6 · DocumentSlot** (2026-10-14) (REQ-HVER-006, 008, 009, 018)
  - Gerar: `npm run gen:component -- shared/ui/media DocumentSlot`; teste, story
- [x] **T7 · Assistente** (2026-10-15) (REQ-HVER-002 a 010, 018)
  - Teste primeiro: `NoticeStep.test.tsx`, `DocumentsStep.test.tsx`, `ReviewStep.test.tsx`
  - Implementar: `components/client/ApplicationWizard/*`, rotas `new` e `documents`
- [x] **T8 · Vistas por status e painel** (2026-10-15) (REQ-HVER-001, 011 a 017)
  - Teste primeiro: `ApplicationStatusView.test.tsx`, `HostOnboardingPanel.test.tsx`
  - Implementar: `StatusTimeline` (`shared/ui/data-display`), `widgets/host-onboarding`, rota `/host/application`; ligar `host-application` em `NAV_ITEMS`
- [x] **T9 · Privacidade** (2026-10-15) (REQ-HVER-009)
  - Ampliar `src/test/architecture/no-token-storage.test.ts`
- [ ] **T10 · E2E** (REQ-HVER-002 a 012)
  - `e2e/mocked/host/verification.spec.ts` (handlers do mock para `/hosts/me/application*`); `e2e/real/host/verification.spec.ts` com documentos fictícios
- [ ] **T11 · Documentação:** TSDoc; catálogo do vault (`DocumentSlot`, `prepareImageForUpload`, `StatusTimeline`, `HostOnboardingPanel`, `rejectionCopy`); nota `development/resources/host-verification.md`; resultados reais em `docs/validation.md`
