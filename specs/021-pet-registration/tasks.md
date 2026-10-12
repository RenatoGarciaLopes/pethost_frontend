---
spec: 021-pet-registration
status: draft
updated: 2026-10-11
---

# 021 · Tarefas

Cada tarefa: um ciclo vermelho → verde → refatorar → documentar, um commit. Não pular a ordem: tarefas de baixo dependem das de cima. Depende da 020 (T1 a T4).

- [ ] **T1 · Regras por espécie** (REQ-PNEW-003, 004, 005, 023)
  - Teste primeiro: `petProfileSchema.test.ts`, `pruneForSpecies.test.ts`
  - Implementar: `features/pets/schemas/petProfileSchema.ts`, `lib/species.ts`
- [ ] **T2 · Lib pura do cadastro** (REQ-PNEW-009, 010, 016)
  - Teste primeiro: `ageBucketToBirthDate.test.ts`, `gramsToKg.test.ts`, `normalizeMicrochip.test.ts`, `toCreatePetRequest.test.ts`
- [ ] **T3 · Rascunho** (REQ-PNEW-021): `useSessionDraft.test.tsx` (shared), `petDraft.test.ts`
- [ ] **T4 · Arquivos e sessão para upload** (REQ-PNEW-007, 019): `validatePhotoFile.test.ts`, `fileFingerprint.test.ts` (shared/lib/files); `withSessionRetry.int.test.ts` (shared/api/client)
- [ ] **T5 · PhotoSlots** (REQ-PNEW-007): `npm run gen:component -- shared/ui/media PhotoSlots`; teste, stories, a11y
- [ ] **T6 · Store e provider** (REQ-PNEW-001, 005, 021): `petWizardStore.test.ts`
- [ ] **T7 · Passos 1 a 3** (REQ-PNEW-002 a 009): `SpeciesStep`, `IdentityStep`, `BodyStep` com testes e stories
- [ ] **T8 · Passos 4 a 6** (REQ-PNEW-010 a 012): `HealthStep`, `RoutineStep`, `SocialStep`
- [ ] **T9 · Revisão e carteirinha ao vivo** (REQ-PNEW-013, 015): `ReviewStep`, `LivePetCard`
- [ ] **T10 · PetWizard e salvar** (REQ-PNEW-014, 016, 017, 018): `useCreatePet`, `useUploadPetPhotos`, `PhotoUploadStatus`; `PetWizard.int.test.tsx` (MSW); copy nova em `errorCopy` (`PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`)
- [ ] **T11 · Comemoração** (REQ-PNEW-020, 022): `PetWelcome` com `Celebration`
- [ ] **T12 · Rota** (REQ-PNEW-002): `page.tsx`, `loading.tsx`
- [ ] **T13 · E2E** : `e2e/mocked/pets/new-pet.spec.ts` (handlers do mock para `POST /pets` e `/photos`), `e2e/real/pets/new-pet.spec.ts`
- [ ] **T14 · Documentação:** TSDoc; catálogo do vault (`PhotoSlots`, `validatePhotoFile`, `fileFingerprint`, `withSessionRetry`, `useSessionDraft`, `petProfileSchema`, passos); notas `development/resources/pets.md` (ampliar) e `development/resources/photo-slots.md`; `docs/validation.md`
