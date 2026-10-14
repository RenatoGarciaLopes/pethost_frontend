---
spec: 021-pet-registration
status: in-progress
updated: 2026-10-14
---

# 021 · Design técnico

## Decisões tomadas na implementação (2026-10-14)

- **Gato sem pergunta de porte:** segue o design (`allowsSize` aceita o porte do gato só para poda e edição; o cadastro não pergunta). Porte obrigatório só no cachorro (`bodyStepSchema(species)`, fábrica que recebe a espécie do store).
- **Store Zustand por instância** (`createPetWizardStore` + `PetWizardProvider`): passo, respostas aceitas, fotos (só memória), erros por vaga, `petId` depois de criado, erros de campo da API. Cada passo valida a sua parte com o próprio formulário e chama `acceptStep`.
- **Erros da API por passo:** `VALIDATION_ERROR` e microchip repetido vão para o store (`showServerErrors`) com o passo do primeiro campo; o passo aplica ao montar (`useServerErrors`) e volta para a revisão ao aceitar.
- **Foco no título só depois de navegar:** o store marca `navigated`; a primeira tela não puxa o foco.
- **Carteirinha completa nasce aqui:** `PetProfileCard` (blocos com "Editar" na revisão; só leitura ao vivo). A ficha (022) reaproveita.
- **Foto repetida:** `PhotoSlots` confere tipo e tamanho; a impressão do arquivo (`fileFingerprint`) é conferida no passo, porque é assíncrona.
- **Reaproveitado da 015:** `validateImageFile` (em vez de um `validatePhotoFile` novo). `StepHeading` saiu da feature auth para `shared/ui/navigation`.
- **Sair com dados preenchidos:** o rascunho por conta sobrevive a recarregar e a sair; não há confirmação extra ao sair. "Começar de novo" apaga o rascunho.
- **"Procurar um cantinho pra {nome}"** entra com a busca (041); hoje a comemoração oferece "Ver meus pets" e "Apresentar outro pet".
- **Rota:** `/pets/new` no grupo `(account)`, sem `loading.tsx` próprio (fallback do `Suspense`).

## Rota e renderização

| Arquivo                            | Tipo         | Faz                                                                                                                                                                                              |
| ---------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/(owner)/pets/new/page.tsx`    | RSC dinâmico | `requireRole(["owner","host"], "/pets/new")`; lê `species` da URL (validado por `petSpeciesSchema`, inválido é ignorado); renderiza `PetWizardScreen` com `accountId`, `role` e `initialSpecies` |
| `app/(owner)/pets/new/loading.tsx` | RSC          | esqueleto do passo 1                                                                                                                                                                             |

A ilha é o assistente inteiro (`PetWizard`, client). O título da página e a coluna de layout são servidor. Sem `'use cache'`.

## Árvore de componentes

```
page.tsx (RSC)
└─ PetWizardScreen (features/pets · server)          duas colunas no computador; uma no celular
   └─ PetWizardProvider (features/pets · client)     cria o store por instância (Zustand + context)
      ├─ PetWizard (features/pets · client)          orquestra passos, validação por passo, salvar
      │  ├─ WizardProgress (shared/ui/navigation)
      │  ├─ SpeciesStep         ChoiceCardGroup + TextField (exótico)
      │  ├─ IdentityStep        TextField nome · PhotoSlots · SegmentedControl sexo
      │  ├─ BodyStep            Autocomplete raça · SizePicker (ChoiceCardGroup) · AgeInput · WeightInput
      │  ├─ HealthStep          SegmentedControl ×2 · ToggleRow ×2 · TextField vet · MaskedTextField microchip
      │  ├─ RoutineStep         TextField + ChipPicker ×2
      │  ├─ SocialStep          SegmentedControl ×3 + Hint
      │  ├─ ReviewStep          PetIdCard full + "Editar" por bloco
      │  └─ FormActions (shared/ui/forms)
      ├─ LivePetCard (features/pets · client)        PetIdCard full ligado ao store (só ≥ 900 px)
      ├─ PhotoUploadStatus (features/pets · client)  progresso e falhas por foto (REQ-PNEW-018)
      └─ PetWelcome (features/pets · client)         Celebration "Prazer, {nome}!"
```

Um formulário React Hook Form por passo (`useForm` com o schema do passo, `mode: "onSubmit"`); os valores aceitos vão para o store. O store guarda o rascunho; o RHF guarda só a edição do passo em curso.

## Contratos e modelos

| Camada                | Símbolo                                                                                                                                                                                                                                       | Origem                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| DTO de entrada        | `CreatePetRequest`                                                                                                                                                                                                                            | `PostApiV1PetsBody` (gerado), estreitado em `features/pets/api/contracts.ts` |
| DTO de saída          | `PetDto`                                                                                                                                                                                                                                      | `unwrapData(PostApiV1PetsResponse)`                                          |
| Schema compartilhado  | `petProfileSchema` (ficha inteira, com `superRefine` das regras por espécie) e `petStepSchemas` (recortes por passo)                                                                                                                          | `features/pets/schemas/petProfileSchema.ts`                                  |
| Valores de formulário | `PetProfileValues`                                                                                                                                                                                                                            | `z.infer<typeof petProfileSchema>`                                           |
| Mapper                | `toCreatePetRequest(values)`                                                                                                                                                                                                                  | `features/pets/api/mappers.ts`                                               |
| Lib pura              | `requiresSize(species)`, `allowsSize(species)`, `requiresDescription(species)`, `pruneForSpecies(values)`, `ageBucketToBirthDate(bucket, today)`, `normalizeMicrochip(text)`, `gramsToKg`, `validatePhotoFile(file)`, `fileFingerprint(file)` | `features/pets/lib/`                                                         |
| Store                 | `petWizardStore` (`step`, `values`, `photos: File[]`, `status`)                                                                                                                                                                               | `features/pets/stores/petWizardStore.ts`                                     |
| Rascunho              | `readPetDraft(accountId)`, `writePetDraft`, `clearPetDraft`                                                                                                                                                                                   | `features/pets/lib/petDraft.ts`                                              |

Regras do `petProfileSchema` (espelham `modulo-pets.md` seção 4):

| Campo                                                                        | Regra no cliente                                                             |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `species`                                                                    | enum de 12                                                                   |
| `speciesDescription`                                                         | obrigatória e até 60 só em `exotic`; removida nas outras (`pruneForSpecies`) |
| `name`                                                                       | trim, 1 a 60                                                                 |
| `breed`                                                                      | até 60, opcional                                                             |
| `size`                                                                       | `small`/`medium`/`large`; obrigatório em `dog`; removido fora de `dog`/`cat` |
| `birthDate`                                                                  | `yyyy-MM-dd`, não no futuro, opcional                                        |
| `sex`                                                                        | `male`/`female`/`unknown`, obrigatório                                       |
| `isNeutered`, `isVaccinated`, `goodWithDogs`, `goodWithCats`, `goodWithKids` | boolean obrigatório                                                          |
| `medicationNotes`, `feedingNotes`, `allergies`                               | até 1000; texto vazio vira ausente                                           |
| `vetContact`                                                                 | até 160                                                                      |
| `notes`                                                                      | até 2000                                                                     |
| `weightKg`                                                                   | > 0 e ≤ 150, até 3 casas                                                     |
| `microchip`                                                                  | 15 dígitos depois de `normalizeMicrochip` (aceita espaço e hífen)            |

O mesmo `petProfileSchema` é usado pela edição (022): um único lugar para as regras por espécie.

## Fluxo de dados

1. **Salvar** (`useCreatePet`, `features/pets/hooks`):
   - `mutationFn`: `createPet(toCreatePetRequest(values))` → `POST /api/pets` pelo `bffClient`.
   - Guarda o `petId` no store **antes** das fotos (`status: "created"`): qualquer nova tentativa só reenvia fotos.
2. **Fotos** (`useUploadPetPhotos`): para cada `File` na ordem das vagas, `uploadPetPhoto(petId, file)` → `POST /api/pets/{petId}/photos` com `FormData` (`file`), uma por vez.
   - `401 UNAUTHORIZED`: `refreshSession()` (`POST /api/auth/sessions/refresh` pelo `bffClient`) e repete aquela foto uma vez (REQ-PNEW-019). Esse utilitário (`withSessionRetry`) fica em `shared/api/client` porque a 015 (avatar) e a 030 (documentos) precisam do mesmo.
   - `409 PET_PHOTO_ALREADY_EXISTS` e `400` de arquivo: marca o slot com erro e segue para a próxima.
   - Rede ou 5xx: marca o slot com erro (REQ-PNEW-018).
3. **Fim:** `queryClient.invalidateQueries({ queryKey: petQueries.all(accountId).queryKey })`, `clearPetDraft(accountId)`, mostra `PetWelcome`.
4. **Rascunho:** o store assina mudanças e grava em `sessionStorage["pethost:pet-draft:{accountId}"]` com debounce de 500 ms: `{ step, values }` sem `microchip`, sem fotos. Leitura com `try/catch` (storage pode falhar) e validação por `petProfileSchema.partial()`; rascunho inválido é descartado.

Query keys: nenhuma query nova; só invalida as da 020.

## Erros

| Código da API                                                                                        | Onde aparece              | Comportamento                                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VALIDATION_ERROR`                                                                                   | campos                    | `applyFieldErrors` com a lista de campos; volta ao primeiro passo com erro (mapa campo → passo em `fieldStep`)                                                                          |
| `PET_MICROCHIP_ALREADY_REGISTERED`                                                                   | campo microchip (passo 4) | `getErrorMessage`, volta ao passo 4                                                                                                                                                     |
| `PET_KEEPER_NOT_FOUND`                                                                               | `Notice` erro             | anfitrião não aprovado (023); link "Ver minha verificação"                                                                                                                              |
| `FORBIDDEN`                                                                                          | não acontece              | guard da rota                                                                                                                                                                           |
| `PET_PHOTO_ALREADY_EXISTS`, `PET_PHOTO_LIMIT_REACHED`, `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE` | slot da foto              | `getErrorMessage`; os dois últimos ganham entrada em `errorCopy` nesta spec ("A foto é grande demais. Escolhe uma de até 5 MB." e "Esse arquivo não é uma foto. Usa JPG, PNG ou WebP.") |
| rede, 5xx                                                                                            | `Notice` erro             | `getErrorMessage`; o rascunho fica                                                                                                                                                      |

## Reutiliza

`WizardProgress`, `ChoiceCardGroup`, `SegmentedControl`, `ToggleRow`, `ChipPicker`, `FormActions`, `MaskedTextField` e máscaras (002), `Notice`, `Hint`, `Celebration`, `TurmaWalker`, `usePrefersReducedMotion` (002); `bffClient`, `applyFieldErrors`, `getErrorMessage`, `accountQueryKey` (003); `PetIdCard`, `petQueries`, `petSpeciesSchema`, `describePet` (020).

## Cria de reutilizável

| Recurso                                                                                        | Onde                                    | Quem mais usa                                                                                           |
| ---------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `PhotoSlots` (vagas com capa, prévia, erro por vaga; controlado, sem saber de API)             | `shared/ui/media/PhotoSlots`            | 022 (fotos do pet), 015 (`AvatarUploader` com 1 vaga), 030 (frente, verso, selfie), 044 (fotos da casa) |
| `validatePhotoFile`, `fileFingerprint` (SHA-256 com `crypto.subtle`)                           | `shared/lib/files`                      | 015, 022, 030, 044                                                                                      |
| `withSessionRetry` (renova e repete uma vez em `401 UNAUTHORIZED`, para corpos não repetíveis) | `shared/api/client/withSessionRetry.ts` | 015, 022, 030, 044                                                                                      |
| `petProfileSchema`, `petStepSchemas`, `pruneForSpecies`, `requiresSize`, `allowsSize`          | `features/pets`                         | 022 (edição), 023                                                                                       |
| Passos (`SpeciesStep` … `SocialStep`) como seções reutilizáveis                                | `features/pets/components/steps`        | 022 (edição por seção)                                                                                  |
| `ageBucketToBirthDate`, `normalizeMicrochip`, `gramsToKg`                                      | `features/pets/lib`                     | 022                                                                                                     |
| `useSessionDraft(key, schema)` (rascunho em `sessionStorage` com validação e `try/catch`)      | `shared/hooks/useSessionDraft.ts`       | 044 (cantinho); nos cadastros 011/012 só sem senha, CPF e documento; a 030 guarda o rascunho na API     |

`PhotoSlots` e `withSessionRetry` vão para `shared` porque não têm domínio; o resto fica na slice `pets`.

## Matriz de testes

| REQ             | Nível                   | Arquivo                                                                                                     | Caso                                                                                                                                                                       |
| --------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 003/004/005/023 | Unitário                | `petProfileSchema.test.ts`                                                                                  | cada regra por espécie; cão sem porte falha; coelho com porte é podado; exótico sem descrição falha; mínimo do REQ-PNEW-023 passa                                          |
| 005             | Unitário                | `pruneForSpecies.test.ts`                                                                                   | cão → coelho remove porte; cão → gato mantém; exótico → cão remove descrição                                                                                               |
| 009             | Unitário                | `ageBucketToBirthDate.test.ts`, `gramsToKg.test.ts`                                                         | cada faixa com data fixa; 35 g → 0.035; arredondamento a 3 casas                                                                                                           |
| 010             | Unitário                | `normalizeMicrochip.test.ts`                                                                                | espaços e hífens; 14 ou 16 dígitos falham                                                                                                                                  |
| 007             | Unitário                | `validatePhotoFile.test.ts`, `fileFingerprint.test.ts`                                                      | tipo, 5 MB, mesmo arquivo = mesma impressão                                                                                                                                |
| 016             | Unitário                | `toCreatePetRequest.test.ts`                                                                                | sem campos vazios; sem porte fora de cão e gato; peso numérico                                                                                                             |
| 021             | Unitário                | `petDraft.test.ts`                                                                                          | grava sem microchip e sem fotos; chave por conta; storage que lança não quebra; rascunho inválido descartado                                                               |
| 019             | Integração (MSW)        | `withSessionRetry.int.test.ts`                                                                              | 401 → refresh → repete uma vez; refresh 401 → `SESSION_EXPIRED`                                                                                                            |
| 001/006/014     | Componente              | `PetWizard.test.tsx`                                                                                        | avança só com o passo válido; foco no primeiro erro; voltar não valida; nome nos títulos                                                                                   |
| 002/003/004     | Componente              | `SpeciesStep.test.tsx`, `BodyStep.test.tsx`                                                                 | `?species=` marca; exótico abre descrição; porte some para coelho e aparece obrigatório para cão                                                                           |
| 007             | Componente              | `PhotoSlots.test.tsx`                                                                                       | capa na vaga 1; arquivo inválido recusado no slot; teclado e leitor de tela                                                                                                |
| 010/011/012     | Componente              | `HealthStep.test.tsx`, `RoutineStep.test.tsx`, `SocialStep.test.tsx`                                        | `ToggleRow` revela campo; chip insere texto; dica de convivência                                                                                                           |
| 013/015         | Componente              | `LivePetCard.test.tsx`, `ReviewStep.test.tsx`                                                               | carteirinha acompanha o store; "Editar" volta ao passo e retorna                                                                                                           |
| 016/017/018/020 | Integração (MSW, jsdom) | `PetWizard.int.test.tsx`                                                                                    | cria uma vez com clique duplo; 400 com campos volta ao passo certo; foto 409 marca o slot e o pet fica; "Tentar de novo" reenvia só a foto; fim invalida e mostra "Prazer" |
| 022             | Componente              | `PetWelcome.test.tsx`                                                                                       | movimento reduzido sem `TurmaWalker`; anúncio para leitor de tela                                                                                                          |
| 001 a 015       | Storybook               | `PetWizard.stories.tsx` (um story por passo, cão, gato, coelho, exótico, celular), `PhotoSlots.stories.tsx` | a11y sem violação                                                                                                                                                          |
| 001/016/020     | E2E simulado            | `e2e/mocked/pets/new-pet.spec.ts` (desktop e celular)                                                       | cão completo com 2 fotos; coelho sem porte; rascunho sobrevive a recarregar; foto falha e o pet existe                                                                     |
| 016/020         | E2E real                | `e2e/real/pets/new-pet.spec.ts`                                                                             | tutor de demonstração cria um pet com 1 foto pequena na API real e o desativa no fim (limpeza)                                                                             |
