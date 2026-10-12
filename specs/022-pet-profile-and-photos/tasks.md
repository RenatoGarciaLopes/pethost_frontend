---
spec: 022-pet-profile-and-photos
status: draft
updated: 2026-10-11
---

# 022 · Tarefas

Cada tarefa: um ciclo vermelho → verde → refatorar → documentar, um commit. Depende da 020 e da 021 (T1, T2, T4, T5, T7, T8).

- [ ] **T1 · diffPatch genérico** (REQ-PEDIT-005, 006): `shared/lib/patch/diffPatch.test.ts` → `diffPatch.ts`
- [ ] **T2 · Patch do pet e troca de espécie** (REQ-PEDIT-005 a 007): `toUpdatePetRequest.test.ts`, `speciesChangeEffects.test.ts`, `toPetProfileValues.test.ts`
- [ ] **T3 · Detalhe e mutations** (REQ-PEDIT-002, 013, 014): `petQueries.detail`, `usePetMutations`; `pets.server.int.test.ts` (404), `PetEditScreen.int.test.tsx` (MSW)
- [ ] **T4 · Ficha** (REQ-PEDIT-001, 003, 016): `PetProfileScreen` + rota `[petId]/page.tsx`, `loading.tsx`, metadados
- [ ] **T5 · ConfirmDialog e tirar da lista** (REQ-PEDIT-011, 012, 013): `npm run gen:component -- shared/ui/feedback ConfirmDialog`; `DeactivatePetDialog`; `useFlashMessage`
- [ ] **T6 · Edição por seção** (REQ-PEDIT-004, 005, 007, 015, 017): prop `mode` nos passos da 021; `EditSection`; rota `edit/page.tsx`
- [ ] **T7 · Fotos** (REQ-PEDIT-008, 009, 010): `usePetPhotoMutations`, `PetPhotosSection`
- [ ] **T8 · E2E** : `e2e/mocked/pets/pet-profile.spec.ts` (handlers de detalhe, PATCH, desativação e fotos); `e2e/real/pets/pet-profile.spec.ts`
- [ ] **T9 · Documentação:** TSDoc; catálogo do vault (`diffPatch`, `ConfirmDialog`, `useFlashMessage`, `usePetPhotoMutations`, `toUpdatePetRequest`); ampliar `development/resources/pets.md`; levar ao backend a divergência 404 x 403 do PATCH; `docs/validation.md`
