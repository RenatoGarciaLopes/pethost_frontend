---
spec: 042-listing-page
status: in-progress
updated: 2026-10-22
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
| 001/003/005/006/007/010/011 | Componente           | `components/ListingPageScreen.test.tsx`                                                                                                                                                    |
| 001/008                 | Integração (Node/MSW)    | `api/server/listingPage.server.int.test.ts`                                                                                                                                                |
| 009                     | Integração da rota       | `app/(account)/listings/[listingId]/page.test.tsx`                                                                                                                                         |
| 004                     | Componente               | `components/client/StayBookingCard.test.tsx` (conta, total, pílulas de pet, URL)                                                                                                           |
| 001/010/011             | Unitário                 | `lib/listingFacts.test.ts`, `lib/searchOrigin.test.ts`                                                                                                                                     |
| 005                     | Componente               | `features/search/components/client/CompatibilityNotice/CompatibilityNotice.test.tsx`; `features/search/lib/compatibilityLabel.test.ts`                                                    |
| 010                     | Integração (Node/MSW)    | `api/server/listingPage.server.int.test.ts` (avaliações e falha silenciosa)                                                                                                                |
| 001                     | Contrato/consulta        | `api/queries.test.ts`                                                                                                                                                                      |
| 001/002/003/004/006/007 | Storybook + E2E simulado | Stories do detalhe (`TutorCompativel`, `ComAviso`, `SemFotos`, `SemAvaliacao`, `TutorSemEscolha`, `AnfitriaoVisitante`, `DonoDoCantinho`, `Celular`), da lateral, das ações, de `CompatibilityNotice` e `HouseResidents`; `e2e/mocked/search/listing-page.spec.ts` cobre conta, compatibilidade, avaliações, voltar e troca de pet (sem residentes); a integração/story de 023 cobre residentes presentes |

## Revisão 078: página fiel à prancha (22/10/2026)

Pedido do Renato: fonte, itens, chips, selos, tons e cabeçalho estavam longe do planejado. Sem mudança no backend: o que a prancha mostra e a API não manda vira lacuna, não dado inventado.

- **Composição:** `ListingPageScreen` (servidor) monta "voltar", `ListingGallery`, título display, linha da casa (`houseLine`), selos (`StatusPill` do shared; nota em pílula gema clara), o slot `compatibility`, as seções (`Section` interna, divisória tracejada) e a lateral em `Surface` com sombra dura. Grade com áreas: no computador `head | aside` e `body | aside` (lateral fixa com `sticky`); no celular `head`, `aside`, `body`.
- **`ListingGallery`:** capa grande + duas empilhadas (as fotos 4 e 5 só no carrossel do celular); moldura de tinta, raio `media`, `hardShadow(5)`; "Vizinho" com `Sticker`; sem foto, estado vazio com `DoorMark` no fundo cartão.
- **`StayBookingCard` (client):** `NightlyPrice`, `DateRangeField` (o calendário da 075 entra depois do merge, sem mudar esta interface), pílulas de pet com `aria-pressed`, conta `stayTotal`, "Pedir estadia" e o recado de pagamento + privacidade do endereço. Datas e pets vão para a URL por `router.replace` (só datas que formam estadia válida); `stayParams` troca apenas `from`, `to` e `pets` e preserva o resto da busca. No celular o botão vai para a barra fixa.
- **`ListingPageActions`:** ficou só com os recados de quem não pede (dono e outra conta de anfitrião).
- **Compatibilidade:** `CompatibilityNotice` mora na feature search (dona de `searchQueries.compatibility`, `compatibilityWarnings` e da copy dos avisos) e reaproveita `Notice` do shared; a rota compõe uma por pet escolhido, com os motivos de `compatibilityReasons` (listing-page), e pré-carrega cada resposta com `prefetchCompatibility` (search `index.server`) no mesmo `QueryClient` dos residentes, para a caixa chegar hidratada. Feature não importa feature: a rota é o ponto de encontro, como já era com `HouseResidents`.
- **Avaliações:** `getListingReviews` lê `GET /reviews` no servidor (pública, fora do BFF), as 4 mais novas; erro vira lista vazia. Mês da estadia por `formatMemberSince`.
- **Voltar:** `searchOriginHref` é o único ponto que sabe onde ficam os resultados (home com os parâmetros da busca). Se o destino mudar, muda só lá.
- **Removidos:** `ListingSearchControls` (rota) e seus teste/story; copy sem uso (`choose`, `fit`, `mismatch*`, `weekdays`, `property`, `description`, `host`); a seção "Combina com" local por `petFitsListing` (a função segue no pedido, spec 050).

### Lacunas da prancha (a API não manda)

| Prancha | Hoje | Por quê |
| --- | --- | --- |
| "2,1 km de você" | linha sem distância | o detalhe não traz `distanceKm` (só a busca) |
| "6 casas perto da Zona 7" | "← Casas perto de {onde}" ou "← Voltar pra busca" | o card da busca não leva a contagem nem sempre o lugar |
| "No PetHost desde outubro · já criou três cachorros" | só nome (e "Empresa parceira") | `listing.host` público só tem nome, foto e empresa; `GET /hosts/{id}` é do admin |
| Fala do anfitrião | a descrição do cantinho entre aspas | não há campo de fala; a descrição é o texto do anfitrião |
| "Puxar conversa" | ausente | Conversas (055) não tem tela na dev; decisão do coordenador em 22/10: fica fora até a tela existir |
| "Marina · Thor" | só o primeiro nome de quem avaliou | avaliação do tutor não traz o pet |
| "casa com quintal murado" | "casa com quintal" | não há campo de muro |
| "R$ 60" | "R$ 60,00" | `formatBRL` é o padrão do app em todo valor |
| Selos | rótulos repetidos de `badgeLabel` da busca | feature não importa feature e o card da 070 não pode ser mexido agora; unificar em `shared` depois do merge da 070 |
