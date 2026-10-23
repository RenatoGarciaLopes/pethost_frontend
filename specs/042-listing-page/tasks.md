---
spec: 042-listing-page
status: in-progress
updated: 2026-10-22
---

# 042 · Tarefas

- [x] **T1 · Contratos e `petFitsListing`** (REQ-LPAGE-005)
- [x] **T2 · Página SSR, metadados e 404** (REQ-LPAGE-001, 008, 009)
- [x] **T3 · Galeria, fatos, anfitrião e pets da casa** (REQ-LPAGE-001, 002, 003) · rota faz prefetch público de `petQueries.house` e hidrata `HouseResidents` da 023; erros/vazio não bloqueiam a página.
- [x] **T4 · Preço e pedir** (REQ-LPAGE-004, 006, 007)
- [ ] **T5 · Stories, E2E e documentação** · stories e testes funcionais executados; falta E2E após confirmação das portas e registro final da validação.
- [x] **T6 · Revisão 078: página fiel à prancha** (REQ-LPAGE-001, 004, 005, 010, 011) · galeria com moldura e carrossel no celular, selos em português, `CompatibilityNotice` (busca) composto pela rota, seções com divisória tracejada, avaliações, lateral `StayBookingCard` com barra fixa no celular; `ListingSearchControls` removido (sem uso). Validação 22/10 (vaga B): vitest 93/93, tsc e eslint limpos, story test 25/25 com axe; pendentes E2E mocked e prints 1440/390 (fila de portas). Resultados em `development/resources/listing-page.md` no vault.
