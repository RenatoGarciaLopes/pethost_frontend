---
spec: 031-admin-verification-queue
status: draft
updated: 2026-10-11
---

# 031 · Tarefas

Pré-requisito: 002, 003, 004 e 030 (T1). Cada tarefa: teste vermelho → código → verde → `npm run verify`, um commit.

- [ ] **T1 · Contratos e schemas do admin** (REQ-AQUEUE-002, 009 a 011)
  - Teste primeiro: `queueSearchSchema.test.ts`, `approveSchema.test.ts`, `rejectSchema.test.ts`
  - Implementar: `features/host-applications/{api/contracts,schemas,types}` (parte de admin)
- [ ] **T2 · Paginação e estado na URL** (REQ-AQUEUE-002, 003)
  - Teste primeiro: `shared/lib/pagination/paginate.test.ts`, `shared/hooks/useSearchParamsState.test.tsx`
- [ ] **T3 · Microcopy** (REQ-AQUEUE-013)
  - Ampliar `getErrorMessage.test.ts` e `errorCopy.ts` com os códigos novos (contexto admin)
- [ ] **T4 · Cliente e hooks** (REQ-AQUEUE-006, 012, 013)
  - Teste primeiro: `adminApplications.client.int.test.ts`, `useDecision.int.test.tsx`
- [ ] **T5 · AdminDataTable e ReasonField** (REQ-AQUEUE-001, 004, 009, 010)
  - Gerar com `gen:component` em `shared/ui/data-display` e `shared/ui/forms`; testes e stories
- [ ] **T6 · Fila** (REQ-AQUEUE-001 a 004)
  - Teste primeiro: `ApplicationQueue.test.tsx`; rota da fila; ligar `admin-queue` em `NAV_ITEMS`
- [ ] **T7 · SignedDocumentViewer** (REQ-AQUEUE-006, 007, 015, 016)
  - Teste primeiro: `SignedDocumentViewer.test.tsx` (relógio falso)
- [ ] **T8 · Checklist, decisão e resumo** (REQ-AQUEUE-005, 008 a 014)
  - Teste primeiro: `ReviewChecklist.test.tsx`, `DecisionPanel.test.tsx`; widget `host-application-review`; rota do detalhe
- [ ] **T9 · Privacidade** (REQ-AQUEUE-007): ampliar `no-token-storage.test.ts`
- [ ] **T10 · E2E**: `e2e/mocked/admin/verification-queue.spec.ts` (handlers do mock com imagem fictícia); `e2e/real/admin/verification-queue.spec.ts`
- [ ] **T11 · Documentação:** TSDoc; catálogo (`AdminDataTable`, `ReasonField`, `paginate`, `useSearchParamsState`, `SignedDocumentViewer`, `DecisionPanel`); nota `development/resources/admin-verification.md`; resultados reais em `docs/validation.md`
