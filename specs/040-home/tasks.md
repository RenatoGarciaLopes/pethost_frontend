---
spec: 040-home
status: implemented
updated: 2026-10-15
---

# 040 · Tarefas

- [x] **T1 · Contrato de busca da home** (REQ-HOME-005): implementado `buildHomeSearchPath`; teste primeiro para query vazia/opcional, repetição de pet, espécie, quantidade e caracteres codificados; handoff de login usa `loginRedirectPath` existente.
- [x] **T2 · Conteúdo e estados do Início** (REQ-HOME-001 a 004, 008, 009): `HomeScreen.test.tsx`; composição de `DoorScene`, `TurmaWalker` e `TrustList`; visitante, tutor sem pet, tutor com pet, anfitrião e falha recuperável.
- [x] **T3 · Rota dinâmica pública** (REQ-HOME-001, 003, 009, 010): teste Node/MSW; `src/app/page.tsx` espera `connection`, lê sessão e carrega pets somente para tutor; metadata e fallback sem ação.
- [x] **T4 · Responsividade e a11y** (REQ-HOME-006, 007): rótulos visíveis, expansão móvel com `aria-expanded` e `aria-controls`; a cena reutilizada respeita movimento reduzido.
- [x] **T5 · Stories, E2E e documentação** (REQ-HOME-001 a 010): story com `export default meta`; E2E mock escrito sem executar Playwright; nota `development/resources/home.md` no vault, TSDoc e inventário de pastas.
- [x] **Validação executada**: `npx.cmd vitest run src/widgets/home src/app/page.int.test.tsx --maxWorkers=1` (3 arquivos, 16 testes aprovados); ESLint escopado aprovado; `npx.cmd tsc --noEmit -p .` aprovado; Prettier aplicado aos arquivos tocados e `git diff --check` sem erros. Storybook, Playwright e servidores de desenvolvimento não foram executados, conforme o fluxo do proprietário. A integração do conteúdo no vault permanece com a pessoa responsável pelo vault.
