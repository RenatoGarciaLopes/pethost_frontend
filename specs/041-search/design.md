---
spec: 041-search
status: draft
updated: 2026-10-15
---

# 041 · Design técnico

## Rota

`app/(account)/search/page.tsx` (RSC dinâmico): `requirePersonalUser("/search?…")`; lê `searchParams`, converte com `searchParamsToQuery` (inválido é ignorado, nunca quebra a página); prefetch de `searchQueries.page(query, 1)` pelo `backendForRequest`; erro conhecido de endereço vira estado (não exceção); `HydrationBoundary`; `SearchScreen`.

## Feature `features/search`

```
lib/searchParams.ts      searchParamsToQuery / queryToSearchParams (puros, testados ida e volta)
lib/searchCopy.ts, lib/badgeLabel.ts
api/contracts.ts         listingSummarySchema (estreita badges, homeType, species), searchPageSchema
api/queries.ts           searchQueries.infinite(query) com useInfiniteQuery (pageParam = page)
api/server/search.server.ts
components/SearchScreen.tsx (server)
components/client/SearchBar.tsx       Onde, Chegada, Saída, Pet (lê os pets do tutor por prop, vindos da página)
components/client/FilterChips.tsx
components/client/ListingCard.tsx     sem hooks; recebe summary + datas + pets
components/client/SearchResults.tsx   lista, "Farejando…", Mostrar mais, vazio
```

Os pets do tutor (para o campo "Pet") vêm do prefetch de `GET /pets/me` feito na página, entregue como `{ id, name, species, size }[]` a `SearchScreen` (a feature search não importa a feature pets; a página compõe). Com conta de anfitrião, o campo "Pet" pede só a quantidade.

## Peças a criar em `shared`

- `shared/ui/forms/DateRangeField`: chegada e saída com regras de `stayRules` (hoje em Brasília até 365 dias, até 30 noites).
- `shared/lib/date/stayRules.ts`: `validateStay(checkIn, checkOut, today)` e `nightsBetween`; usado também na 050.
- `shared/ui/feedback/SniffingBanner`: "Farejando cantinhos…" com o corgi (reaproveita a turma do `SniffLoader`).

## Matriz de testes

| REQ                 | Nível              | Arquivo                                                                                                                      |
| ------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 002                 | Unitário           | `searchParams.test.ts` (ida e volta, inválidos ignorados, listas)                                                            |
| 003                 | Unitário           | `stayRules.test.ts` (Brasília, 365, 30 noites)                                                                               |
| 004/007             | Componente         | `ListingCard.test.tsx` (total, distância, selos, link com datas e pets)                                                      |
| 005/006/008/009/010 | Integração (jsdom) | `SearchResults.int.test.tsx` (MSW: chips mudam a query, lista anterior fica, mostrar mais acumula, vazio oferece raio maior) |
| 011/012             | Integração (jsdom) | erros de endereço e 400 no campo                                                                                             |
| 001                 | Integração (Node)  | página sem sessão redireciona com `next`                                                                                     |
| todos               | Storybook          | busca com pets, sem pets, vazio, sem endereço, celular                                                                       |
| 001 a 010           | E2E simulado       | `e2e/mocked/search/search.spec.ts`                                                                                           |
