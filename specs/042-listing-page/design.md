---
spec: 042-listing-page
status: draft
updated: 2026-10-15
---

# 042 · Design técnico

- Rota `app/(account)/listings/[listingId]/page.tsx`: UUID conferido, `requirePersonalUser`, `getPublicListing` (`cache()`, para metadados e prefetch dividirem o `GET`), pets da casa e, para tutor, os pets dele (para "Combina com"), tudo em paralelo (`Promise.all`); `HydrationBoundary`; `ListingPageScreen`.
- Feature `features/listing-page`: `api/contracts` (visão pública e completa num schema só, campos de endereço opcionais), `toListingPage`, `lib/petFitsListing.ts` (pura), `components/ListingGallery` (grade no computador, carrossel por botões no celular), `HouseFacts`, `HostCard`, `StayPricePanel` (client, datas e pets).
- Os pets da casa são compostos pela página a partir do que a 023 exporta (vitrine em `widgets`, se a 023 a puser lá) ou chamados aqui por `GET /hosts/{hostId}/pets` com schema próprio; a feature não importa outra feature.
- `stayRules` e `formatBRL` de `shared`.

## Matriz de testes

| REQ                 | Nível                    | Arquivo                                                                     |
| ------------------- | ------------------------ | --------------------------------------------------------------------------- |
| 005                 | Unitário                 | `petFitsListing.test.ts`                                                    |
| 004                 | Unitário                 | total com `formatBRL` e `nightsBetween`                                     |
| 001/002/003/006/007 | Componente               | `ListingPage.test.tsx` (visão pública sem rua, dono, anfitrião visitante)   |
| 008/009             | Integração (Node)        | página: 404, título                                                         |
| todos               | Storybook + E2E simulado | `e2e/mocked/listings/listing-page.spec.ts` (da busca ao cantinho com total) |
