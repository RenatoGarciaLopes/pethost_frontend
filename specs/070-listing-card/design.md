# 070 · Design

- **Contrato:** `openapi/pethost.v1.json` sincronizado da API (`api:sync`, `api:generate`). `listingSummarySchema` ganha o selo `well_rated`; `rating` e `approximateLocation` vêm do schema gerado. `compatibilitySchema` estreita a resposta de compatibilidade.
- **Compatibilidade:** `searchQueries.compatibility(accountId, listingId, petId, { checkIn, checkOut })` (chave por conta, rota BFF `/listings/{listingId}/compatibility` já existia). `CompatibilityChip` consulta com `useQuery`; `compatibilityLabel(result)` monta o texto a partir do código (`searchCopy.compat`). A spec 042 só tem `petFitsListing` (espécie e porte locais), sem aviso por código: não serve de base.
- **Card:** `ListingCard` com a prop opcional `compatibility: { accountId, pets }`. Reusa `Sticker` (selo), `initialsOf`, `quintalRadii`. Ícones em `AttributeIcon`.
- **Consumidores:** `SearchExperience` passa os pets escolhidos via `SearchResults`; `HomeScreen` passa pets e datas a `NearbyListings`.
- **Reserva da vitrine (herdada do Ember):** `searchQueries.all` e `useAllListings` avaliados e mantidos; sem discordância.
