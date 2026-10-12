---
spec: 020-my-pets
status: draft
updated: 2026-10-11
---

# 020 · Tarefas

Cada tarefa: um ciclo vermelho → verde → refatorar → documentar, um commit. Não pular a ordem: tarefas de baixo dependem das de cima.

- [ ] **T1 · Slice e contratos** (REQ-PETS-001)
  - Gerar: `npm run gen:feature -- pets`
  - Teste primeiro: `features/pets/api/mappers.test.ts` · casos: ativos e inativos separados, ordem mantida, enums estreitados
  - Implementar: `api/contracts.ts`, `api/mappers.ts`, `types.ts`
- [ ] **T2 · Lib pura de resumo** (REQ-PETS-011)
  - Teste primeiro: `describePet.test.ts`, `ageLabel.test.ts`, `speciesLabel.test.ts`
  - Implementar: `features/pets/lib/*`, `petsCopy.ts`
- [ ] **T3 · Queries e transporte** (REQ-PETS-006, 007)
  - Teste primeiro: `pets.server.int.test.ts` (MSW), `petQueries.int.test.tsx`
  - Implementar: `api/queries.ts`, `api/client/pets.client.ts`, `api/server/pets.server.ts`
- [ ] **T4 · PetIdCard** (REQ-PETS-001, 002)
  - Gerar: `npm run gen:component -- features/pets PetIdCard`
  - Teste primeiro: `PetIdCard.test.tsx` · nome acessível, link, silhueta sem foto, variantes
  - Stories: `compact`, `full`, sem foto, exótico, celular
- [ ] **T5 · PetList, NewPetTile, InactivePetsSection, EmptyState** (REQ-PETS-003, 004, 005, 008)
- [ ] **T6 · DraftBanner** (REQ-PETS-009) · depende do `readPetDraft` da 021 (T3 de lá); se a 021 ainda não existir, entra com a interface e o teste, e liga quando ela chegar
- [ ] **T7 · Rota** (REQ-PETS-006, 010): `page.tsx`, `loading.tsx`, `error.tsx`; ligar `NAV_ITEMS["pets"].available = true`
- [ ] **T8 · E2E** (REQ-PETS-001, 003, 004, 010): `e2e/mocked/pets/my-pets.spec.ts` (handlers do mock para `/pets/me`); `e2e/real/pets/my-pets.spec.ts`
- [ ] **T9 · Documentação:** TSDoc; catálogo do vault (`PetIdCard`, `describePet`, `petQueries`, schemas de espécie, mappers); nota `development/resources/pets.md` (criada aqui, ampliada na 021 a 023); `docs/validation.md` com resultados reais
