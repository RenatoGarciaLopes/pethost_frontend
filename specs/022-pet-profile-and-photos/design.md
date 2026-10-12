---
spec: 022-pet-profile-and-photos
status: draft
updated: 2026-10-11
---

# 022 · Design técnico

## Rota e renderização

| Arquivo                                  | Tipo         | Faz                                                                                                                                                                                                                                      |
| ---------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(owner)/pets/[petId]/page.tsx`      | RSC dinâmico | `requireRole(["owner","host"])`; valida `petId` (UUID; inválido → `notFound()`); prefetch de `petQueries.detail(user.id, petId)` pelo `backendClient`; `PET_NOT_FOUND` → `notFound()`; `HydrationBoundary`; renderiza `PetProfileScreen` |
| `app/(owner)/pets/[petId]/edit/page.tsx` | RSC dinâmico | mesmo prefetch; renderiza `PetEditScreen`                                                                                                                                                                                                |
| `…/[petId]/loading.tsx`                  | RSC          | esqueleto da carteirinha                                                                                                                                                                                                                 |

Metadados: `title` = "{nome} · Meus pets" (gerado a partir do prefetch), `robots: noindex`. Sem `'use cache'`.

## Árvore de componentes

```
[petId]/page.tsx (RSC)
└─ PetProfileScreen (features/pets · client, hidratado)
   ├─ PetIdCard variant="full"
   ├─ InactiveBadge + ReactivateButton            REQ-PEDIT-003/013
   ├─ link "Editar ficha"
   └─ DeactivatePetDialog (features/pets · client) REQ-PEDIT-011/012

[petId]/edit/page.tsx (RSC)
└─ PetEditScreen (features/pets · client)
   ├─ PetIdCard variant="full" (prévia do que está salvo)
   ├─ PetPhotosSection                              PhotoSlots ligado a usePetPhotoMutations
   └─ EditSection × 6 (features/pets · client)      um useForm por seção, mesmo schema
      ├─ SpeciesStep (como seção) + SpeciesChangeNotice
      ├─ IdentityStep (sem fotos)
      ├─ BodyStep · HealthStep · RoutineStep · SocialStep
      └─ FormActions variante "seção" (Salvar)
```

Os passos da 021 recebem a prop `mode: "wizard" | "section"`: em `section` não mostram navegação de passo nem texto de onboarding.

## Contratos e modelos

| Camada         | Símbolo                                                                                                                                                                           | Origem                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| DTO            | `PetDto`                                                                                                                                                                          | `unwrapData(GetApiV1PetsPetIdResponse)` (mesmo formato nas respostas de PATCH, desativação e fotos) |
| DTO de entrada | `UpdatePetRequest`                                                                                                                                                                | `PatchApiV1PetsPetIdBody` estreitado                                                                |
| Schema         | `petProfileSchema` (021)                                                                                                                                                          | validação da ficha resultante                                                                       |
| Mapper         | `toPetProfileValues(pet)` (DTO → valores do formulário), `toUpdatePetRequest(original, edited)`                                                                                   | `features/pets/api/mappers.ts`                                                                      |
| Lib pura       | `diffPetProfile(original, edited)` → campos alterados; `clearableFields`; `speciesChangeEffects(from, to)` → `{ removes: ("size" \| "speciesDescription")[], requires: (...)[] }` | `features/pets/lib/`                                                                                |

Regras do `toUpdatePetRequest`:

- só chaves alteradas; texto opcional que ficou vazio → `""`;
- `weightKg` nunca vai como `""` nem `null` (REQ-PEDIT-006);
- troca de espécie para `dog` exige `size` no patch; para `exotic`, `speciesDescription`;
- `microchip` normalizado com `normalizeMicrochip` (021) antes de comparar.

## Fluxo de dados

- Query: `petQueries.detail(accountId, petId)` → `[...accountQueryKey(accountId, "pets"), "detail", petId]`.
- Mutations (`features/pets/hooks/usePetMutations.ts`), todas com `onSuccess: setQueryData(detail, pet)` + `invalidateQueries(petQueries.all)` (REQ-PEDIT-014):
  - `useUpdatePet(petId)` → `PATCH /api/pets/{petId}`;
  - `useDeactivatePet(petId)` → `POST /api/pets/{petId}/deactivation`; sucesso → `router.push("/pets")`; o aviso "A ficha de {nome} saiu da lista." vai por `useFlashMessage` (em memória, de `shared/hooks`), nunca na URL;
  - `useReactivatePet(petId)` → `DELETE /api/pets/{petId}/deactivation`;
  - `usePetPhotoMutations(petId)` → `add(file)`, `replace(photoId, file)`, `remove(photoId)`; multipart pelo proxy, com `withSessionRetry`; uma operação por vez (fila simples no hook).
- Sem atualização otimista: a resposta da API é a fonte (ela decide vaga e capa).

## Erros

| Código da API                                                                                        | Onde aparece                                | Comportamento                                             |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| `VALIDATION_ERROR`                                                                                   | campos da seção ou `Notice` da seção        | REQ-PEDIT-015                                             |
| `PET_NOT_FOUND`                                                                                      | página                                      | `notFound()` no servidor; no cliente, navega para o 404   |
| `PET_MICROCHIP_ALREADY_REGISTERED`                                                                   | campo microchip ou botão "Voltar pra lista" | `getErrorMessage`                                         |
| `PET_PHOTO_ALREADY_EXISTS`, `PET_PHOTO_LIMIT_REACHED`, `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE` | vaga                                        | `getErrorMessage`                                         |
| `PET_PHOTO_NOT_FOUND`                                                                                | nenhum                                      | refaz o detalhe (a foto já tinha saído)                   |
| rede, 5xx                                                                                            | `Notice`                                    | `getErrorMessage`; o formulário mantém o que foi digitado |

## Reutiliza

`PetIdCard`, `petQueries`, `toPet`, `describePet` (020); `petProfileSchema`, passos, `PhotoSlots`, `withSessionRetry`, `validatePhotoFile`, `fileFingerprint`, `normalizeMicrochip` (021); `applyFieldErrors`, `getErrorMessage`, `bffClient`, `createBackendClient` (003); `Notice`, `FormActions`, `Dialog` do tema (002); casca e 404 (004).

## Cria de reutilizável

| Recurso                                                                              | Onde                               | Quem mais usa                                                                                |
| ------------------------------------------------------------------------------------ | ---------------------------------- | -------------------------------------------------------------------------------------------- |
| `diffPatch(original, edited, { clearable })` genérico (base do `toUpdatePetRequest`) | `shared/lib/patch/diffPatch.ts`    | 015 (perfil `PATCH /owners/me` e `/hosts/me`, mesma regra de `""` e ausente), 044 (cantinho) |
| `ConfirmDialog` neutro (foco inicial na ação segura)                                 | `shared/ui/feedback/ConfirmDialog` | 015 (desativar conta), 030 (desistir da verificação)                                         |
| `useFlashMessage` (aviso de uma navegação para a próxima, em memória)                | `shared/hooks/useFlashMessage.ts`  | 015, 044                                                                                     |
| `usePetPhotoMutations`                                                               | `features/pets/hooks`              | 023                                                                                          |

## Matriz de testes

| REQ                 | Nível                     | Arquivo                                                                                  | Caso                                                                                                     |
| ------------------- | ------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 005/006             | Unitário                  | `diffPatch.test.ts`, `toUpdatePetRequest.test.ts`                                        | só alterados; vazio → `""`; peso nunca vazio; nada mudou → objeto vazio                                  |
| 007                 | Unitário                  | `speciesChangeEffects.test.ts`                                                           | cão → coelho remove porte; gato → cão exige porte; qualquer → exótico exige descrição; cão ↔ gato mantém |
| 001/003             | Componente                | `PetProfileScreen.test.tsx`                                                              | blocos; selo de inativo; "Editar" só para o dono                                                         |
| 004/005/007/017     | Componente                | `EditSection.test.tsx`                                                                   | salva só a seção; "Nada mudou por aqui."; aviso de troca de espécie; pergunta ao sair com alteração      |
| 011                 | Componente                | `DeactivatePetDialog.test.tsx`                                                           | texto exato; foco em "Deixar como está"; sem cor de erro (token de tom neutro)                           |
| 008/010             | Componente                | `PetPhotosSection.test.tsx`                                                              | adicionar, substituir, tirar; uma por vez; erro na vaga                                                  |
| 002                 | Integração (MSW, Node)    | `pets.server.int.test.ts`                                                                | `PET_NOT_FOUND` vira `notFound()`                                                                        |
| 005/013/014/015     | Integração (MSW, jsdom)   | `PetEditScreen.int.test.tsx`                                                             | PATCH com corpo mínimo; 400 nos campos certos; 409 de microchip; cache do detalhe atualizado             |
| 009                 | Integração (MSW, jsdom)   | `usePetPhotoMutations.int.test.tsx`                                                      | 401 → refresh → reenvio; 409; 422; 404 de foto refaz o detalhe                                           |
| 012                 | Integração (MSW, jsdom)   | `useDeactivatePet.int.test.tsx`                                                          | volta para `/pets` com aviso; lista invalidada                                                           |
| 001 a 011           | Storybook                 | `PetProfileScreen.stories.tsx`, `PetEditScreen.stories.tsx`, `ConfirmDialog.stories.tsx` | ativo, inativo, sem foto, 3 fotos, celular; a11y sem violação                                            |
| 001/004/008/011/012 | E2E simulado              | `e2e/mocked/pets/pet-profile.spec.ts` (desktop e celular)                                | editar saúde; trocar foto; tirar da lista e voltar; id de outra conta mostra 404                         |
| 004/011             | E2E real                  | `e2e/real/pets/pet-profile.spec.ts`                                                      | edita o pet criado no E2E real da 021 e tira da lista (limpeza)                                          |
| 016                 | Integração + E2E simulado | `requireRole` no layout (004) e `e2e/mocked/pets/profile.spec.ts`                        | outra conta recebe 404/403 da API e vê o estado de erro; "Editar" só para o dono                         |
