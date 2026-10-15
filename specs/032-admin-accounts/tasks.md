---
spec: 032-admin-accounts
status: implementation-complete-validation-pending
updated: 2026-10-15
---

# 032 · Tarefas

Implementação local concluída na worktree `pethost_frontend-032`. Sem commit. O desenho foi entregue em `design.md`; a API agora documenta `GET /hosts?stripeStatus=` e `POST /hosts/{hostId}/stripe-account-reset`. A API gerada permanece a fonte dos tipos. As decisões sobre auditoria estão em “Perguntas em aberto” de `requirements.md` e não criam dependência da feature 033.

- [x] **T1 · Contratos** (REQ-AACC-002, 004): tipos derivados dos contratos gerados; schemas de resposta e fixtures; testes de campos omitidos e estado CPF/CNPJ liberado.
- [x] **T2 · Linhas, filtro e busca** (REQ-AACC-002, 003): conversão owner/host, busca sem persistir documento na URL e filtros de status/Stripe. Texto e status são filtrados no cliente; `stripeStatus` usa filtro de servidor.
- [x] **T3 · Microcopy** (REQ-AACC-011): erros administrativos específicos e cobertura para preservar a mensagem usada fora do admin.
- [x] **T4 · Clientes e hooks** (REQ-AACC-005 a 011, 015, 016): clientes owner/host, filtro Stripe, suspensão/reativação/liberação/reset e invalidação das listas e detalhe próprios; DELETE sem corpo conforme contrato.
- [x] **T5 · ReasonActionDialog** (REQ-AACC-005 a 007, 013): componente reutilizável em shared com TSDoc, teste funcional e story; confirmação literal `LIBERAR` nas liberações.
- [x] **T6 · Diretório** (REQ-AACC-001 a 003): tabela compartilhada, filtros e busca controlada, estados vazio/erro/carregamento, rota `/admin/users` e navegação.
- [x] **T7 · Detalhes e ações** (REQ-AACC-004 a 010, 012, 015): detalhes de tutor/anfitrião, estados e documentos protegidos, ações e reset Stripe; atalho de duplicidade vindo da revisão 031; slot `auditTrail` opcional e link com `targetType`/`targetId` exatos, sem importar a feature 033.
- [x] **T8 · E2E escrito**: cenários `e2e/mocked/admin/accounts.spec.ts` e `e2e/real/admin/accounts.spec.ts`. Execução Playwright pendente com a pessoa coordenadora da entrega; não foi executada nesta worktree.
- [x] **T9 · Stories e documentação de código**: stories de diretório, detalhe, resumo e ações; `export default meta`; TSDoc nos recursos públicos. A integração do vault e catálogo ficará com a pessoa coordenadora; nenhum `docs/*.md` novo foi criado.
- [ ] **Validação final coordenada**: executar Playwright mocked/real, Storybook e revisão visual; conferir integração do vault e catálogo. Vitest direcionado, typecheck e ESLint são registrados após a execução final abaixo.

## Cobertura e validação desta entrega

### Integração com a trilha (033)

- [x] Merge da 033 concluído na branch `feat/admin-audit-in-accounts`; conflitos de navegação preservam fila, contas e auditoria. O mock E2E registra e reseta handlers de contas e auditoria.
- [x] Rotas RSC de tutor e anfitrião passam `AuditTable` compacta ao slot `auditTrail`, com filtros fixos `owner|host` e id do perfil. `widgets/admin-accounts` não importa a feature de auditoria.
- [x] Adicionado teste funcional do slot e link nos dois tipos de conta, story app-level com a composição real e E2E mocked de conta → trilha para tutor e anfitrião.
- [x] Removido `rowLabel` duplicado da primeira coluna de contas após atualização do `AdminDataTable`.
- [x] Testes focais executados: `npx.cmd vitest run src/features/admin-audit src/widgets/admin-accounts src/shared/config/navigation.test.ts --maxWorkers=1` — 47 testes em 19 arquivos passaram; `npx.cmd vitest run src/shared/ui/data-display/AdminDataTable/AdminDataTable.test.tsx --maxWorkers=1` — 2 passaram. TypeScript e ESLint escopado passaram.
- [ ] E2E Playwright e Storybook aguardam execução coordenada; foram escritos e não executados nesta tarefa.

- Unitários: schemas, normalização de linhas, busca textual, erros e validação de motivo.
- Componentes: diretório, ações, resumo, diálogo e carteirinha; testes verificam interações e conteúdo acessível.
- Integração: clientes HTTP, hooks de mutação/invalidação, renderização de rotas servidoras e abertura da aplicação na navegação admin.
- E2E: jornadas mocked e real foram escritas; permanecem pendentes de execução coordenada.
- Storybook: stories adicionadas; renderização e revisão visual permanecem pendentes de execução coordenada.

Resultados locais:

- `npx.cmd vitest run src/features/owners src/features/hosts src/widgets/admin-accounts src/shared/ui/feedback/ReasonActionDialog src/shared/lib/text/filterText.test.ts src/shared/lib/validation/reasonSchema.test.ts src/shared/api/errors/getErrorMessage.test.ts src/shared/config/navigation.test.ts src/widgets/app-shell/components/AppShell.test.tsx --maxWorkers=2` — **97 testes passaram em 18 arquivos**.
- `npx.cmd vitest run src/widgets/host-application-review/components/HostApplicationReview.int.test.tsx --testNamePattern='REQ-AACC-012 conflito' --testTimeout=15000 --maxWorkers=1` — **1 passou; 5 ignorados pelo filtro**. Um teste de sucesso da fila 031 excedeu o timeout quando incluído em uma rodada mais ampla; isolado na rodada anterior passou. A implementação 032 do atalho de duplicidade passou isolada.
- `npx.cmd tsc --noEmit --incremental false` — passou.
- ESLint direcionado aos arquivos 032 e consumidores alterados — passou.
- `git diff --check` — passou. Busca global nas stories por `export { meta as default }` sem resultados; arquivos alterados verificados sem BOM.
- Playwright mocked/real e Storybook não foram executados nesta worktree; ficam para validação coordenada. Não confundir Vitest/typecheck/lint com essas validações.
