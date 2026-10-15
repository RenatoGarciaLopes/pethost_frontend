---
spec: 042-listing-page
status: in-progress
updated: 2026-10-15
---

# 042 · Design técnico

- Rota `app/(account)/listings/[listingId]/page.tsx`: UUID conferido, `requirePersonalUser`, `getListingPageDetail` com `cache()` para metadados e página dividirem o `GET`; a composição busca pets da casa e, para tutor, os pets ativos selecionados. O endpoint `GET /hosts/me` fornece o id do perfil anfitrião para comparar com `listing.hostId`; a conta não é esse id.
- Feature `features/listing-page`: `api/contracts.ts` valida as respostas OpenAPI; `api/queries.ts` consulta detalhe e pets residentes; `lib/petFitsListing.ts` compara espécie e porte; `lib/stayTotal.ts` calcula total sem erro de centavos; `components/ListingPageScreen.tsx` compõe a galeria, fatos, anfitrião, preço e estados de conta; `lib/listingPageCopy.ts` centraliza os textos da feature.
- A página compõe `HouseResidents` pela API client pública da 023. O componente consulta `GET /hosts/{hostId}/pets` com `petQueries.house(hostId)` e trata erro/vazio sem bloquear o detalhe. A feature 042 não importa a feature 023. A branch 042 foi criada da 041 e ainda não contém o componente nem a query; até essa dependência entrar na base, o slot de composição está pendente e a seção não deve ser duplicada nesta feature.
- A rota reutiliza `searchParamsToQuery` da API pública da busca. `stayRules` e `formatBRL` vêm de `shared`.
- O contrato OpenAPI também exige `GET /hosts/me` para descobrir o id do perfil anfitrião da conta logada; a rota não pode comparar `listing.hostId` com o id da conta.

## Matriz de testes

| REQ                 | Nível                    | Arquivo                                                                  |
| ------------------- | ------------------------ | ------------------------------------------------------------------------ |
| 005                 | Unitário                 | `lib/petFitsListing.test.ts`                                             |
| 004                 | Unitário                 | `lib/stayTotal.test.ts`, com `formatBRL` e `nightsBetween`               |
| 001/003/004/006/007 | Componente               | `components/ListingPageScreen.test.tsx`                                  |
| 001/008             | Integração (Node/MSW)    | `api/server/listingPage.server.int.test.ts`                              |
| 009                 | Integração da rota       | `app/(account)/listings/[listingId]/page.test.tsx`                       |
| 004                 | Componente               | `app/(account)/listings/[listingId]/ListingSearchControls.test.tsx`      |
| 001                 | Contrato/consulta        | `api/queries.test.ts`                                                    |
| todos menos 002     | Storybook + E2E simulado | Stories do detalhe e controles, `e2e/mocked/search/listing-page.spec.ts` |
