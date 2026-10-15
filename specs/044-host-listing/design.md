---
spec: 044-host-listing
status: in-progress
updated: 2026-10-15
---

# 044 · Design técnico

## Rotas

| Arquivo                                         | Faz                                                                                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/(host)/host/page.tsx`                      | Painel: `requireRole(["host"], "/host")`; prefetch de `myApplicationQuery` (030), `payoutQueries.account` (043) e `listingQueries.mine`; `HostOnboardingPanel` + `MyListingsSummary` |
| `app/(host)/host/listings/new/page.tsx`         | Gate de `payoutsEnabled` e do limite PF (prefetch de `listingQueries.mine`); `ListingDraftScreen`                                                                                    |
| `app/(host)/host/listings/[listingId]/page.tsx` | UUID conferido (`notFound()` se inválido); prefetch de `listingQueries.detail`; `LISTING_NOT_FOUND` → `notFound()`; `ListingEditorScreen`                                            |

Todas dinâmicas, `Suspense` com esqueleto, `noindex`.

## Feature `features/host-listings`

```
api/contracts.ts        listingDtoSchema (estreita homeType, species, weekdays), myListingsSchema
api/mappers.ts          toListing, toListingValues (DTO → formulário), toCreateListingRequest, toUpdateListingRequest (diffPatch)
api/queries.ts          listingQueries.all/mine/detail
api/server/*.server.ts  prefetch + getListingDetail (cache())
api/client/listingMutations.client.ts  create, update, deactivate, reactivate, addPhoto, replacePhoto, removePhoto, reorderPhotos
hooks/                  useCreateListing, useUpdateListing, usePauseListing, useListingPhotoMutations (uma por vez, como usePetPhotoMutations)
schemas/listingSchema.ts  um schema por seção + listingSchema (ficha inteira; regras PF × PJ por parâmetro)
lib/netEarnings.ts      centavos inteiros, 90%; formatBRL de shared
lib/listingDraft.ts     chave por conta, schema do rascunho (sem fotos)
lib/listingCopy.ts
components/client/ListingSectionsPanel.tsx   painel com check por seção (rascunho e edição)
components/client/sections/*                  HomeSection, HouseholdSection, GuestsSection, AddressSection, RulesSection, WeekdaysSection, RateSection
components/client/ListingPhotosSection.tsx    PhotoSlots (5 vagas) + reordenar por botões
components/client/ListingOpened.tsx            comemoração
components/MyListingsSummary.tsx, ListingDraftScreen.tsx, ListingEditorScreen.tsx (server)
```

As seções seguem o padrão da 022: recebem `values` e `accept` de um anfitrião de seção (rascunho: grava no store do rascunho; edição: `PATCH` com o diff), mostram "Salvar" e o aviso da seção. Reusar a ideia do `PetStepHost` (não o código, que é da feature pets): um contexto `ListingSectionHost` dentro da feature.

## Peças a criar em `shared`

| Recurso                                                       | Onde                                                     | Quem mais usa                    |
| ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------- |
| `formatBRL(value)` e `toCents`/`fromCents`                    | `shared/lib/money`                                       | 041, 042, 050, 052 (preço total) |
| `Stepper` numérico acessível ("+" e "−", `role="spinbutton"`) | `shared/ui/forms/NumberStepper`                          | 041 (pets), 050                  |
| `WeekdayPicker`                                               | `shared/ui/forms/WeekdayPicker`                          | 041 (filtro de dias)             |
| `PhotoSlots` com mais vagas e reordenação                     | ampliar `shared/ui/media/PhotoSlots` (`slots`, `onMove`) | 044                              |

## Erros

| Código                                                      | Onde                                     |
| ----------------------------------------------------------- | ---------------------------------------- |
| `VALIDATION_ERROR`                                          | campos da seção (o painel marca a seção) |
| `LISTING_HOST_PAYOUTS_NOT_ENABLED`, `LISTING_LIMIT_REACHED` | gate da página                           |
| `LISTING_GEOCODER_UNAVAILABLE`                              | `Notice` atenção, rascunho mantido       |
| `LISTING_PHOTO_*`                                           | vaga                                     |
| `LISTING_NOT_FOUND`                                         | 404 da casca                             |

## Matriz de testes

| REQ                         | Nível              | Arquivo                                                                                                              |
| --------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 009                         | Unitário           | `netEarnings.test.ts` (arredondamento em centavos, 90%)                                                              |
| 005/007/010                 | Unitário           | `listingSchema.test.ts` (PF × PJ, portes só com cão ou gato, faixas)                                                 |
| 013/016                     | Unitário           | `toUpdateListingRequest.test.ts` (lista substitui, endereço parcial, `""` limpa)                                     |
| 002                         | Integração (Node)  | gate da página com `payoutsEnabled` e PF com cantinho                                                                |
| 003/004/011/012             | Integração (jsdom) | `ListingDraftScreen.int.test.tsx` (rascunho restaurado, POST único, erro de campo leva à seção, geocodificador fora) |
| 013/015                     | Integração (jsdom) | `ListingEditorScreen.int.test.tsx`                                                                                   |
| 014                         | Integração (jsdom) | `useListingPhotoMutations.int.test.tsx` (ordem, capa, limite)                                                        |
| todos                       | Storybook          | painel, cada seção, comemoração, celular                                                                             |
| 001/002/003/011/013/014/015 | E2E simulado       | `e2e/mocked/host/listing.spec.ts`                                                                                    |
