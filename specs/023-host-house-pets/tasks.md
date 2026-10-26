---
spec: 023-host-house-pets
status: in-progress
updated: 2026-10-15
---

# 023 · Tarefas

Implementação em ciclos de teste, código e documentação. Sem commits nesta entrega. Depende da 020, 021 e 022.

- [x] **T1 · Copy por papel** (REQ-HPETS-001, 004): `petsCopy.test.ts` (mesmas chaves para `owner` e `host`)
- [x] **T2 · Bloqueio antes da aprovação** (REQ-HPETS-002, 003): `isKeeperPending`; prefetch que devolve `keeperPending`; `KeeperPendingNotice`; testes de componente e integração (MSW)
- [x] **T3 · Telas com papel** (REQ-HPETS-001, 004, 005): `role` em `MyPetsScreen`, `PetWizardScreen`, `PetWelcome`; teste de chaves por conta
- [x] **T4 · Vitrine** (REQ-HPETS-006 a 009): `toHouseResidents`, `coexistenceSummary`, `petQueries.house`, `HouseResidents` (`npm run gen:component -- features/pets/components/client HouseResidents`), stories
- [x] **T5 · Navegação** (REQ-HPETS-010): entrada disponível `host-pets` em `NAV_ITEMS`; layout `(account)` existente já aceita `owner` e `host` (sem alteração)
- [x] **T6 · E2E** : `e2e/mocked/pets/host-pets.spec.ts` (handlers para `/pets/me` com 404 de keeper e para `/hosts/{hostId}/pets`); `e2e/real/pets/host-pets.spec.ts`
- [x] **T7 · Documentação:** TSDoc; documentação no repositório e linhas para catálogo do vault (`HouseResidents`, `petQueries.house`, `coexistenceSummary`, `KeeperPendingNotice`); registro de `development/resources/pets.md` delegado ao responsável do vault; `docs/validation.md`

## Entrega de implementação (15/10/2026)

T1 a T7 implementadas na worktree 023. Os componentes novos foram gerados pelo Plop; a documentação por recurso está na nota de pets do vault.

- [ ] **Aceite de navegador:** Claude Code executa E2E simulado desktop/celular, stories/a11y, build e inspeção visual, reservados a ele por spec-owner-common.md. Testes estão escritos; execução pendente.
- [ ] **E2E real:** precisa de API de teste e seed de host aprovado em E2E_HOST_EMAIL/E2E_HOST_PASSWORD. Sem seed configurado o teste indica skipped; não executado aqui.
- [x] **Registro do vault:** nota de pets e catálogo atualizados.

O status continua in-progress até o aceite final de navegador e o registro do vault. Números reais dos checks executados: `docs/validation.md`, seção 023.
