---
spec: 044-host-listing
status: draft
updated: 2026-10-15
---

# 044 · Tarefas

Depende da 030 (painel) e da 043 (`payoutsEnabled`).

- [ ] **T1 · Dinheiro** (REQ-LIST-009): `shared/lib/money` (`formatBRL`, centavos) e `netEarnings`
- [ ] **T2 · Contratos, mappers e schemas** (REQ-LIST-005, 007, 010, 013): `listingDtoSchema`, `toListing`, `toListingValues`, `toCreateListingRequest`, `toUpdateListingRequest`, `listingSchema` por seção
- [ ] **T3 · Queries, prefetch e mutations** (REQ-LIST-016): `listingQueries`, server, client, hooks
- [ ] **T4 · Peças de formulário** : `NumberStepper`, `WeekdayPicker` em `shared/ui/forms`
- [ ] **T5 · Rascunho e painel** (REQ-LIST-002, 003, 004, 011, 012): `ListingSectionsPanel`, seções, `ListingDraftScreen`, `/host/listings/new`
- [ ] **T6 · Edição** (REQ-LIST-013, 015, 017): `ListingEditorScreen`, `/host/listings/[listingId]`, pausar e reabrir
- [ ] **T7 · Fotos** (REQ-LIST-014): `PhotoSlots` com 5 vagas e reordenação; `useListingPhotoMutations`
- [ ] **T8 · Painel do anfitrião** (REQ-LIST-001): `/host`, `MyListingsSummary`, etapa 3 do `HostOnboardingPanel`
- [ ] **T9 · Stories, E2E e documentação**
