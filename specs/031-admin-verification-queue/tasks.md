---
spec: 031-admin-verification-queue
status: in-progress
updated: 2026-10-15
---

# 031 · Tarefas

Implementação na worktree `pethost_frontend-031`. Autorização da spec recebida em 14/10/2026. Checks locais somente do escopo; verify completo, build, Playwright e Storybook pertencem à execução coordenada pelo Claude Code, conforme `spec-owner-common.md`.

- [x] **T1 · Contratos e schemas do admin** (REQ-AQUEUE-002, 005, 006, 009 a 011)
  - `features/admin-host-applications/api/contracts.ts` deriva o detalhe do gerado e estreita os enums da API, incluindo CIN. Tipos inferidos no próprio arquivo, sem pasta types ou dependência da 030.
  - Testes: `api/contracts.test.ts`, `schemas/reviewSchemas.test.ts`.
- [x] **T2 · Paginação e estado na URL** (REQ-AQUEUE-002, 003)
  - `shared/lib/pagination/paginate.ts` e `shared/hooks/useSearchParamsState.ts`, com testes ao lado.
  - Regressão: parâmetros repetidos têm a mesma leitura no servidor e no navegador; voltar/avançar relê a URL.
- [x] **T3 · Microcopy** (REQ-AQUEUE-010, 013)
  - `adminReviewCopy.ts`; preview dos motivos corresponde ao `HostApplicationEmailNotifier.cs` real, sem depender da copy da 030.
  - `errorCopy.ts` e `getErrorMessage.test.ts`: conflitos, foto ausente e contexto `adminReview` para CPF/CNPJ duplicado.
- [x] **T4 · Cliente e hooks** (REQ-AQUEUE-006, 012, 013)
  - Cliente BFF, queries por conta e `useDecision`, sem retry de decisão. Prefetch autenticado, sem links de foto.
  - Integração MSW em `adminApplications.client.int.test.ts`, `adminApplications.server.int.test.ts` e `useDecision.int.test.tsx`.
- [x] **T5 · AdminDataTable e ReasonField** (REQ-AQUEUE-001, 003, 004, 009, 010)
  - Criados pelo gerador existente; implementados com TSDoc, testes funcionais, stories e index.
  - Tabela oferece ordenação, clique na linha, link nativo de teclado, paginação local e rótulos em português.
- [x] **T6 · Fila** (REQ-AQUEUE-001 a 004)
  - `ApplicationQueue.tsx` e rota com autorização e hidratação, status/página na URL, espera, tentativa e ordem inicial.
  - Atalho `admin-queue` em NAV_ITEMS; testes de consumidores da casca atualizados.
- [x] **T7 · SignedDocumentViewer** (REQ-AQUEUE-006, 007, 015, 016)
  - URL apenas no estado local do diálogo, sem Query. Emissão sob clique, AbortSignal, descarte ao fechar/vencer/falhar, contagem por expiresAt, no-referrer e nova emissão ao reabrir.
  - Testes com relógio falso, erro de imagem, falha de emissão, fechamento durante pedido, foco preso, Esc e devolução de foco.
- [x] **T8 · Checklist, decisão e resumo** (REQ-AQUEUE-005, 008 a 015)
  - Widget `host-application-review` e rota UUID/admin; comparação com CPF minimizado, checklist PF/PJ local dentro do DecisionPanel, consulta pública Receita, motivo obrigatório, recusa em chips e fraude com confirmação separada.
  - Submetida em tela >=900px permite decisão; celular mostra a orientação aprovada. Outros status mostram resumo; conflito recarrega; fotos apagadas substituem vagas.
  - `DecisionPanel.test.tsx`, `ApplicantComparison.test.tsx`, `HostApplicationReview.int.test.tsx` e stories.
- [x] **T9 · Privacidade** (REQ-AQUEUE-007)
  - `no-token-storage.test.ts` ampliado com URLs. Cobertura funcional confirma que foto não entra no Query nem sobrevive ao fechamento de pedido pendente.
- [ ] **T10 · E2E: execução coordenada pendente**
  - Código escrito: `e2e/mocked/admin/verification-queue.spec.ts` (4 casos, desktop/celular; fraude é somente desktop) e `e2e/real/admin/verification-queue.spec.ts` (1 caso condicionado a contas descartáveis).
  - Mock escrito e integrado ao reset: `adminApplications.mjs`, 27 solicitações, endpoint de imagens PNG fictícias no-store; integração MSW em `src/test/msw/adminApplicationsMock.int.test.ts`.
  - Playwright não executado por instrução explícita. A jornada real exige conta host descartável, verificada, com dados completos e sem solicitação aberta; admin de teste e CPF sintético. Envia multipart com front/back/selfie reais do contrato, recusa a solicitação criada e encerra rascunho em falha quando possível.
- [ ] **T11 · Integração de documentação e validação visual pendentes**
  - TSDoc, stories, design, árvore real e registro de checks entregues no repositório. Não foi criado `docs/admin-verification.md`, por orientação explícita.
  - Conteúdo para a nota `development/resources/admin-verification.md`, linhas do catálogo e responsabilidades do vault são enviados ao Claude Code no resumo. Vault foi somente leitura; não declarar sua integração concluída.
  - Storybook/a11y, visual desktop/celular, verify completo e build não executados por instrução explícita.
