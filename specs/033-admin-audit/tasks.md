---
spec: 033-admin-audit
status: in-progress
updated: 2026-10-15
---

# 033 · Tarefas

Pré-requisito: 003, 004 e 031 (T2, T5). Desenhar a tela no canvas antes de passar a `approved`. Cada tarefa: teste vermelho → código → verde → `npm run verify`, um commit.

- [x] **T1 · Contratos, schema e mapper** (REQ-AUDIT-002, 004)
  - Teste primeiro: `auditSearchSchema.test.ts`, `toAuditQuery.test.ts`
- [x] **T2 · Rótulos e links** (REQ-AUDIT-003, 007, 008)
  - Teste primeiro: `auditActionCopy.test.ts`, `auditTargetLink.test.ts`
- [x] **T3 · Datas e copiar** : `shared/lib/date/formatDateTime.test.ts`; componente `CopyButton` com feedback de sucesso/erro
- [x] **T4 · Cliente e AuditTable** (REQ-AUDIT-001, 005, 006, 009 a 011)
  - Teste primeiro: `audit.client.int.test.ts`, `AuditTable.test.tsx`, `AuditEntryDetail.test.tsx`
- [x] **T5 · Explorer e rota** (REQ-AUDIT-002 a 004): `AuditFilters`, `AuditExplorer`, rota protegida e item `admin-audit` em `NAV_ITEMS`
- [x] **T6 · E2E**: jornadas mockada e real escritas; execução aguarda as portas do responsável
- [x] **T7 · Documentação local:** TSDoc, estrutura e resultados reais em `docs/validation.md`; catálogo/vault ficam para integração por estarem fora desta worktree
