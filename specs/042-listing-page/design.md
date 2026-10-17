---
spec: 042-listing-page
status: in-progress
updated: 2026-10-15
---

# 042 · Design técnico

- Rota `app/(account)/listings/[listingId]/page.tsx`: UUID conferido, `requirePersonalUser`, `getListingPageDetail` com `cache()` para metadados e página dividirem o `GET`; a composição busca pets da casa e, para tutor, os pets ativos selecionados. O endpoint `GET /hosts/me` fornece o id do perfil anfitrião para comparar com `listing.hostId`; a conta não é esse id.
- Feature `features/listing-page`: `api/contracts.ts` valida as respostas OpenAPI; `api/queries.ts` consulta detalhe e pets residentes; `lib/petFitsListing.ts` compara espécie e porte; `lib/stayTotal.ts` calcula total sem erro de centavos; `components/ListingPageScreen.tsx` compõe a galeria, fatos, anfitrião, preço e estados de conta; `lib/listingPageCopy.ts` centraliza os textos da feature.
- A rota compõe `HouseResidents` por `@/features/pets/index.client` e faz prefetch via `@/features/pets/index.server` em um `QueryClient` exclusivo, que só hidrata a projeção pública de `GET /hosts/{hostId}/pets`. O erro/vazio é tolerado pela query da 023 e não bloqueia o detalhe; não há import da feature 023 pela feature 042.
- Os links MUI da página ficam em `ListingPageActions`, componente client, porque o tema desta branch ainda não adapta `Button href` ao Link do Next. A RSC não passa funções para componentes client.
- A rota reutiliza `searchParamsToQuery` da API pública da busca. `stayRules` e `formatBRL` vêm de `shared`.
- O contrato OpenAPI também exige `GET /hosts/me` para descobrir o id do perfil anfitrião da conta logada; a rota não pode comparar `listing.hostId` com o id da conta.

## Matriz de testes

| REQ                     | Nível                    | Arquivo                                                                                                                                                                                    |
| ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 005                     | Unitário                 | `lib/petFitsListing.test.ts`                                                                                                                                                               |
| 004                     | Unitário                 | `lib/stayTotal.test.ts`, com `formatBRL` e `nightsBetween`                                                                                                                                 |
| 001/003/004/006/007     | Componente               | `components/ListingPageScreen.test.tsx`                                                                                                                                                    |
| 001/008                 | Integração (Node/MSW)    | `api/server/listingPage.server.int.test.ts`                                                                                                                                                |
| 009                     | Integração da rota       | `app/(account)/listings/[listingId]/page.test.tsx`                                                                                                                                         |
| 004                     | Componente               | `app/(account)/listings/[listingId]/ListingSearchControls.test.tsx`                                                                                                                        |
| 001                     | Contrato/consulta        | `api/queries.test.ts`                                                                                                                                                                      |
| 001/002/003/004/006/007 | Storybook + E2E simulado | Stories do detalhe, ações, controles e `HouseResidents`; `e2e/mocked/search/listing-page.spec.ts` cobre o estado sem pets residentes; a integração/story de 023 cobre residentes presentes |
