---
spec: 042-listing-page
status: in-progress
updated: 2026-10-23
---

# 042 · Tarefas

- [x] **T1 · Contratos e `petFitsListing`** (REQ-LPAGE-005)
- [x] **T2 · Página SSR, metadados e 404** (REQ-LPAGE-001, 008, 009)
- [x] **T3 · Galeria, fatos, anfitrião e pets da casa** (REQ-LPAGE-001, 002, 003) · rota faz prefetch público de `petQueries.house` e hidrata `HouseResidents` da 023; erros/vazio não bloqueiam a página.
- [x] **T4 · Preço e pedir** (REQ-LPAGE-004, 006, 007)
- [ ] **T5 · Stories, E2E e documentação** · stories e testes funcionais executados; falta E2E após confirmação das portas e registro final da validação.
- [x] **T6 · Revisão 078: página fiel à prancha** (REQ-LPAGE-001, 004, 005, 010, 011) · galeria com moldura e carrossel no celular, selos em português, `CompatibilityNotice` (busca) composto pela rota, seções com divisória tracejada, avaliações, lateral `StayBookingCard` com barra fixa no celular; `ListingSearchControls` removido (sem uso). Validação 22/10 (vaga B): vitest 93/93, tsc e eslint limpos, story test 25/25 com axe; E2E mocked (23/10): listing-page.spec verde e request.spec 10/10, desktop e celular; prints aprovados e apagados depois do merge (abe09a0). Resultados em `development/resources/listing-page.md` no vault.
- [x] **T7 · Revisão 087: cantinho aberto ao visitante** (REQ-LPAGE-001, 009, 011, 012) · rota fora do `(account)`, `AppShell` com `user` nulo, card do visitante com pedido pelo login (`next` com as datas), home sem o recado de login. Validação 23/10: vitest das áreas tocadas 15 arquivos e 79 testes verdes; tsc e eslint limpos; story test 5 arquivos e 26 stories verdes com axe; E2E mocked com CI=1 (desktop e celular): listing-page.spec, request.spec, home.spec e search.spec verdes (o teste novo do visitante falhou uma vez no desktop por compilação a frio do `/login` no `next dev`; ganhou espera de 30 s e passou 4/4). Prints 1440/390 de visitante (home, cantinho, login) e tutor em `PetHost/prints-087/`.
