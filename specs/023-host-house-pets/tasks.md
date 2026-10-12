---
spec: 023-host-house-pets
status: draft
updated: 2026-10-11
---

# 023 · Tarefas

Cada tarefa: um ciclo vermelho → verde → refatorar → documentar, um commit. Depende da 020, 021 e 022.

- [ ] **T1 · Copy por papel** (REQ-HPETS-001, 004): `petsCopy.test.ts` (mesmas chaves para `owner` e `host`)
- [ ] **T2 · Bloqueio antes da aprovação** (REQ-HPETS-002, 003): `isKeeperPending`; prefetch que devolve `keeperPending`; `KeeperPendingNotice`; testes de componente e integração (MSW)
- [ ] **T3 · Telas com papel** (REQ-HPETS-001, 004, 005): `role` em `MyPetsScreen`, `PetWizardScreen`, `PetWelcome`; teste de chaves por conta
- [ ] **T4 · Vitrine** (REQ-HPETS-006 a 009): `toHouseResidents`, `coexistenceSummary`, `petQueries.house`, `HouseResidents` (`npm run gen:component -- features/pets HouseResidents`), stories
- [ ] **T5 · Navegação** (REQ-HPETS-010): `NAV_ITEMS["host-pets"].available = true`; ajustar o layout de `/pets` para aceitar `owner` e `host` (registrar na 004)
- [ ] **T6 · E2E** : `e2e/mocked/pets/host-pets.spec.ts` (handlers para `/pets/me` com 404 de keeper e para `/hosts/{hostId}/pets`); `e2e/real/pets/host-pets.spec.ts`
- [ ] **T7 · Documentação:** TSDoc; catálogo do vault (`HouseResidents`, `petQueries.house`, `coexistenceSummary`, `KeeperPendingNotice`); ampliar `development/resources/pets.md`; `docs/validation.md`
