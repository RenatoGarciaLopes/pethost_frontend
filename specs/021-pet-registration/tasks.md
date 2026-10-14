---
spec: 021-pet-registration
status: in-progress
updated: 2026-10-14
---

# 021 · Tarefas

Cada tarefa: um ciclo vermelho → verde → refatorar → documentar, um commit. Não pular a ordem: tarefas de baixo dependem das de cima. Depende da 020 (T1 a T4).

- [x] **T1 · Regras por espécie** (REQ-PNEW-003, 004, 005, 023)
  - Teste primeiro: `petProfileSchema.test.ts`, `pruneForSpecies.test.ts`
  - Implementar: `features/pets/schemas/petProfileSchema.ts`, `lib/species.ts`
- [x] **T2 · Lib pura do cadastro** (REQ-PNEW-009, 010, 016)
  - Teste primeiro: `ageBucketToBirthDate.test.ts`, `gramsToKg.test.ts`, `normalizeMicrochip.test.ts`, `toCreatePetRequest.test.ts`
- [x] **T3 · Rascunho** (REQ-PNEW-021): `useSessionDraft.test.tsx` (shared), `petDraft.test.ts`
- [x] **T4 · Arquivos e sessão para upload** (REQ-PNEW-007, 019): `validatePhotoFile.test.ts`, `fileFingerprint.test.ts` (shared/lib/files); `withSessionRetry.int.test.ts` (shared/api/client)
- [x] **T5 · PhotoSlots** (REQ-PNEW-007): `npm run gen:component -- shared/ui/media PhotoSlots`; teste, stories, a11y
- [x] **T6 · Store e provider** (REQ-PNEW-001, 005, 021): `petWizardStore.test.ts`
- [x] **T7 · Passos 1 a 3** (REQ-PNEW-002 a 009): `SpeciesStep`, `IdentityStep`, `BodyStep` com testes e stories
- [x] **T8 · Passos 4 a 6** (REQ-PNEW-010 a 012): `HealthStep`, `RoutineStep`, `SocialStep`
- [x] **T9 · Revisão e carteirinha ao vivo** (REQ-PNEW-013, 015): `ReviewStep`, `LivePetCard`
- [x] **T10 · PetWizard e salvar** (REQ-PNEW-014, 016, 017, 018): `useCreatePet`, `useUploadPetPhotos`, `PhotoUploadStatus`; `PetWizard.int.test.tsx` (MSW); copy nova em `errorCopy` (`PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`)
- [x] **T11 · Comemoração** (REQ-PNEW-020, 022): `PetWelcome` com `Celebration`
- [x] **T12 · Rota** (REQ-PNEW-002): `page.tsx`, `loading.tsx`
- [ ] **T13 · E2E** : `e2e/mocked/pets/new-pet.spec.ts` (handlers do mock para `POST /pets` e `/photos`), `e2e/real/pets/new-pet.spec.ts`
- [x] **T14 · Documentação:** TSDoc; catálogo do vault (`PhotoSlots`, `validatePhotoFile`, `fileFingerprint`, `withSessionRetry`, `useSessionDraft`, `petProfileSchema`, passos); notas `development/resources/pets.md` (ampliar) e `development/resources/photo-slots.md`; `docs/validation.md`

## Registro (2026-10-14)

- T1 a T12 e T14 feitos; T13 com o E2E simulado (`e2e/mocked/pets/new-pet.spec.ts`, computador e celular). Falta o E2E real (`e2e/real/pets/new-pet.spec.ts`), que precisa da API de teste.
- Bugs achados pelos testes e corrigidos: foco do primeiro erro não chegava às perguntas de Sim/Não; Sim/Não sem resposta fora da ordem do Tab; peso não numérico tratado como vazio; no celular as opções de idade passavam de 390 px e deslocavam o rodapé fixo; "Começar de novo" regravava um rascunho vazio.
- Decisões no `design.md` (gato sem porte, store por instância, erros da API por passo, carteirinha completa, sair com rascunho).
