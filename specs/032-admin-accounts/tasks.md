---
spec: 032-admin-accounts
status: draft
updated: 2026-10-11
---

# 032 · Tarefas

Pré-requisito: 003, 004, 031 (T2, T5) e 033 (T4, a `AuditTable`). Desenhar a tela no canvas antes de passar a `approved`. Cada tarefa: teste vermelho → código → verde → `npm run verify`, um commit.

- [ ] **T1 · Contratos** (REQ-AACC-002, 004)
  - Teste primeiro: `adminOwnerSchema.test.ts`, `adminHostSchema.test.ts` (resposta com campos omitidos, CPF liberado ausente)
- [ ] **T2 · Linhas, filtro e busca** (REQ-AACC-002, 003)
  - Teste primeiro: `toAccountRow.test.ts`, `filterAccounts.test.ts`, `shared/lib/text/filterText.test.ts`, `accountsSearchSchema.test.ts`
- [ ] **T3 · Microcopy** (REQ-AACC-011): códigos novos em `errorCopy.ts` com teste
- [ ] **T4 · Clientes e hooks** (REQ-AACC-005 a 011)
  - Teste primeiro: `adminOwners.client.int.test.ts`, `adminHosts.client.int.test.ts`, `useAccountAction.int.test.tsx`
- [ ] **T5 · ReasonActionDialog** (REQ-AACC-005 a 007, 013): `gen:component -- shared/ui/feedback ReasonActionDialog`
- [ ] **T6 · Diretório** (REQ-AACC-001 a 003): `AccountsDirectory` + rota da lista; ligar `admin-users` em `NAV_ITEMS`
- [ ] **T7 · Detalhes e ações** (REQ-AACC-004 a 010, 012): `OwnerAccountDetail`, `HostAccountDetail`, `AccountActions`, rotas de detalhe; atalho vindo da 031
- [ ] **T8 · E2E**: `e2e/mocked/admin/accounts.spec.ts`; `e2e/real/admin/accounts.spec.ts`
- [ ] **T9 · Documentação:** TSDoc; catálogo (`ReasonActionDialog`, `filterText`, `AccountsDirectory`); nota `development/resources/admin-accounts.md`; resultados reais em `docs/validation.md`
