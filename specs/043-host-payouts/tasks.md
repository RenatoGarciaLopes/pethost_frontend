---
spec: 043-host-payouts
status: in-progress
updated: 2026-10-15
---

# 043 · Tarefas

Cada tarefa: vermelho → verde → refatorar → documentar. Depende da 030 (`HostOnboardingPanel`).

- [x] **T1 · Contratos e modelo** (REQ-PAYOUT-008): contratos, projeção segura, requisitos e copy.
- [x] **T2 · Appearance** (REQ-PAYOUT-005): `toStripeAppearance(theme)` e teste unitário.
- [x] **T3 · Query, prefetch e mutations** (REQ-PAYOUT-001, 002, 006, 007, 012): query por anfitrião, prefetch autenticado, sessões sem cache de segredo, sincronização, link hospedado e copy de erro.
- [x] **T4 · Dependência**: `@stripe/connect-js` e `@stripe/react-connect-js` instalados pelo Renato; `EmbeddedOnboarding` sob `next/dynamic`.
- [x] **T5 · Tela** (REQ-PAYOUT-003, 004, 008, 009, 010, 011): estados, retorno `?stripe=`, alternativa hospedada e rota protegida.
- [ ] **T6 · Painel** (REQ-PAYOUT-013): pulada conforme divisão com Lynx/030. `payoutStageOf(account)` exporta o contrato da etapa 2; falta integrar no painel.
- [x] **T7 · Stories e E2E**: jornada Playwright escrita para desktop/celular com Connect.js fake local e estados sem verificação, retorno sincronizado, `restricted` e `enabled`.
- [ ] **Execução E2E**: aguarda o Renato liberar as portas; nenhum Playwright foi iniciado nesta entrega.
- [ ] **T8 · Documentação**: TSDoc e registro provisório em `design.md`, `docs/folder-structure.md` e `docs/validation.md` concluídos. Nota e catálogo do vault ficam com Renato; fechar após revisão das stories e E2E.
