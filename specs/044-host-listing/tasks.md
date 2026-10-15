---
spec: 044-host-listing
status: in-progress
updated: 2026-10-15
---

# 044 · Tarefas

Depende da 030 (painel) e da 043 (`payoutsEnabled`).

- [x] **T1 · Dinheiro** (2026-10-15) (REQ-LIST-009): `shared/lib/money` (`formatBRL`, centavos) e `netEarnings`
- [x] **T2 · Contratos, mappers e schemas** (2026-10-15) (REQ-LIST-005, 007, 010, 013): `listingDtoSchema`, `toListing`, `toListingValues`, `toCreateListingRequest`, `toUpdateListingRequest`, `listingSchema` por seção
- [x] **T3 · Queries, prefetch e mutations** (2026-10-15) (REQ-LIST-016): `listingQueries`, server, client, hooks
- [x] **T4 · Peças de formulário** (2026-10-15) : `NumberStepper`, `WeekdayPicker` em `shared/ui/forms`
- [x] **T5 · Rascunho e painel** (2026-10-15) (REQ-LIST-002, 003, 004, 011, 012): `ListingSectionsPanel`, seções, `ListingDraftScreen`, `/host/listings/new`
- [x] **T6 · Edição** (2026-10-15) (REQ-LIST-013, 015, 017): `ListingEditorScreen`, `/host/listings/[listingId]`, pausar e reabrir
- [x] **T7 · Fotos** (2026-10-15) (REQ-LIST-014): `PhotoSlots` com 5 vagas e reordenação; `useListingPhotoMutations`
- [x] **T8 · Painel do anfitrião** (2026-10-15) (REQ-LIST-001): `/host`, `MyListingsSummary`, etapa 3 do `HostOnboardingPanel`
- [ ] **T9 · Stories, E2E e documentação**
