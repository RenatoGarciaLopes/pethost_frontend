---
spec: 033-admin-audit
status: draft
updated: 2026-10-11
---

# 033 · Tarefas

Pré-requisito: 003, 004 e 031 (T2, T5). Desenhar a tela no canvas antes de passar a `approved`. Cada tarefa: teste vermelho → código → verde → `npm run verify`, um commit.

- [ ] **T1 · Contratos, schema e mapper** (REQ-AUDIT-002, 004)
  - Teste primeiro: `auditSearchSchema.test.ts`, `toAuditQuery.test.ts`
- [ ] **T2 · Rótulos e links** (REQ-AUDIT-003, 007, 008)
  - Teste primeiro: `auditActionCopy.test.ts`, `auditTargetLink.test.ts`
- [ ] **T3 · Datas e copiar** : `shared/lib/date/formatDateTime.test.ts`; `gen:component -- shared/ui/data-display CopyButton`
- [ ] **T4 · Cliente e AuditTable** (REQ-AUDIT-001, 005, 006, 009 a 011)
  - Teste primeiro: `audit.client.int.test.ts`, `AuditTable.test.tsx`, `AuditEntryDetail.test.tsx`
- [ ] **T5 · Explorer e rota** (REQ-AUDIT-002 a 004): `AuditFilters`, `AuditExplorer`, rota; ligar `admin-audit` em `NAV_ITEMS`
- [ ] **T6 · E2E**: `e2e/mocked/admin/audit.spec.ts`; `e2e/real/admin/audit.spec.ts`
- [ ] **T7 · Documentação:** TSDoc; catálogo (`AuditTable`, `auditActionCopy`, `auditTargetLink`, `formatDateTime`, `CopyButton`); nota `development/resources/admin-audit.md`; resultados reais em `docs/validation.md`
