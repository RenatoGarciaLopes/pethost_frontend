---
spec: 023-host-house-pets
status: draft
updated: 2026-10-11
---

# 023 · Design técnico

## Rota e renderização

Sem rota nova: `/pets`, `/pets/new`, `/pets/[petId]` e `/pets/[petId]/edit` (020 a 022) passam o `role` da sessão para as telas. A vitrine `HouseResidents` é usada na página do cantinho (042), um RSC público com prefetch.

## Árvore de componentes

```
MyPetsScreen (020)                     role="host" → textos de petsCopy.host
└─ PetList
   └─ KeeperPendingNotice (features/pets · server-safe)   REQ-HPETS-002

PetWizardScreen (021)                   role="host"
├─ KeeperPendingNotice                  REQ-HPETS-003 (quando o prefetch de /pets/me devolve PET_KEEPER_NOT_FOUND)
└─ PetWelcome (variante host)           REQ-HPETS-004

HouseResidents (features/pets · client, hidratado)   REQ-HPETS-006 a 009
└─ ResidentChip × N                                   foto redonda, nome, espécie, convivência
```

## Contratos e modelos

| Camada       | Símbolo                                                                                                                                | Origem                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| DTO          | `HostPetsResponse`                                                                                                                     | `unwrapData(GetApiV1HostsHostIdPetsResponse)`                                                               |
| Modelo de UI | `HouseResident` (`id`, `name`, `species`, `speciesDescription?`, `size?`, `coverUrl?`, `goodWithDogs`, `goodWithCats`, `goodWithKids`) | `features/pets/types.ts`; o mapper descarta saúde, veterinário, microchip, alergias e notas (REQ-HPETS-009) |
| Mapper       | `toHouseResidents(dto)`                                                                                                                | `features/pets/api/mappers.ts`                                                                              |
| Copy         | `petsCopy.owner` e `petsCopy.host` (mesmas chaves)                                                                                     | `features/pets/lib/petsCopy.ts`                                                                             |
| Lib pura     | `isKeeperPending(error)` = `hasErrorCode(error, "PET_KEEPER_NOT_FOUND")`; `coexistenceSummary(resident)`                               | `features/pets/lib/`                                                                                        |

## Fluxo de dados

- `petQueries.mine` (020) com `retry: false` para `PET_KEEPER_NOT_FOUND` (o `shouldRetry` da 003 já não repete 4xx).
- O prefetch do servidor captura `PET_KEEPER_NOT_FOUND` e entrega `keeperPending: true` à tela, em vez de lançar para o `error.tsx`.
- `petQueries.house(hostId)` → `["public", "host-pets", hostId]`: **sem** conta na chave, porque o dado é igual para qualquer pessoa logada; nunca contém dado privado (REQ-HPETS-009). Prefetch no RSC do cantinho.
- Mutations: as da 021 e 022, iguais. Depois de criar ou tirar da lista um pet da casa, invalida também `["public", "host-pets", hostId]` do próprio anfitrião (o id vem do `keeper.id` de `/pets/me`).

## Erros

| Código da API          | Onde aparece         | Comportamento                     |
| ---------------------- | -------------------- | --------------------------------- |
| `PET_KEEPER_NOT_FOUND` | `/pets`, `/pets/new` | `KeeperPendingNotice`; não é erro |
| `PET_HOST_NOT_FOUND`   | vitrine              | some em silêncio                  |
| rede, 5xx na vitrine   | vitrine              | some em silêncio (REQ-HPETS-008)  |
| demais                 | como na 020 a 022    | idem                              |

## Reutiliza

Tudo da 020 a 022; `hasErrorCode`, `accountQueryKey` (003); `NAV_ITEMS` (004).

## Cria de reutilizável

| Recurso              | Onde                                                        | Quem mais usa                                        |
| -------------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| `HouseResidents`     | `features/pets/components` (exportado em `index.client.ts`) | 042 (página do cantinho), 044 ("Quem mora com você") |
| `petQueries.house`   | `features/pets/api/queries.ts`                              | 042                                                  |
| `coexistenceSummary` | `features/pets/lib`                                         | 042, 050 ("Combina com seu pet")                     |

## Matriz de testes

| REQ         | Nível                   | Arquivo                                                                                            | Caso                                                                                                         |
| ----------- | ----------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 009         | Unitário                | `toHouseResidents.test.ts`                                                                         | campos privados nunca saem do mapper                                                                         |
| 006         | Unitário                | `coexistenceSummary.test.ts`                                                                       | combinações de convivência                                                                                   |
| 001/004     | Componente              | `MyPetsScreen.test.tsx`, `PetWelcome.test.tsx`                                                     | textos de anfitrião; ações finais do anfitrião                                                               |
| 002/003     | Componente              | `KeeperPendingNotice.test.tsx`                                                                     | mensagem e link (com e sem a 030 disponível)                                                                 |
| 006/007     | Componente              | `HouseResidents.test.tsx`                                                                          | lista com título; vazio não renderiza nada                                                                   |
| 002/003     | Integração (MSW)        | `pets.server.int.test.ts` (ampliado)                                                               | `PET_KEEPER_NOT_FOUND` vira `keeperPending` sem lançar                                                       |
| 008         | Integração (MSW, jsdom) | `HouseResidents.int.test.tsx`                                                                      | 500 e 404 somem em silêncio                                                                                  |
| 005         | Integração (MSW, jsdom) | `petQueries.int.test.tsx` (ampliado)                                                               | chaves de tutor e anfitrião da mesma pessoa não se misturam                                                  |
| 001 a 007   | Storybook               | `HouseResidents.stories.tsx`, `KeeperPendingNotice.stories.tsx`, `MyPetsScreen.stories.tsx` (host) | a11y sem violação                                                                                            |
| 001/002/004 | E2E simulado            | `e2e/mocked/pets/host-pets.spec.ts` (desktop e celular)                                            | anfitrião não aprovado vê o bloqueio; aprovado cadastra o Bóris; vitrine mostra o pet ativo                  |
| 001         | E2E real                | `e2e/real/pets/host-pets.spec.ts`                                                                  | anfitrião aprovado do seed lista os pets da casa (se o seed tiver anfitrião aprovado; senão, N/A registrado) |
| 010         | Unitário                | `shared/config/navigation.test.ts`                                                                 | `host-pets` com `available: true` aparece só para anfitrião                                                  |
