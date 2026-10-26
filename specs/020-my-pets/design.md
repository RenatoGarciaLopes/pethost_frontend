---
spec: 020-my-pets
status: in-progress
updated: 2026-10-13
---

# 020 · Design técnico

## Decisões tomadas na implementação (2026-10-13)

- **`/pets` no grupo `(account)`:** a casca do tutor e do anfitrião já cobre `/pets`; a página usa `requirePersonalUser("/pets")`.
- **Primeiro atalho do cabeçalho:** "Meus pets" entra em `NAV_ITEMS` (`shared/config/navigation.ts`, só telas que existem, sem `available`) e traz o `HeaderNav` com a gaveta do celular (pendências da 004: REQ-SHELL-002, 006, 008). Anfitrião ganha o atalho dele na 023 ("Pets da casa").
- **Patinha no lugar das silhuetas por espécie:** sem ilustrações por espécie ainda, pet sem foto e o tile "Apresentar outro pet" usam `PawMark` (`shared/ui/brand`), traço de mão como os ícones de feedback. Silhuetas por espécie ficam para o design.
- **Carteirinha só `compact`:** a variante `full` nasce na ficha (022), que é o primeiro uso. O modelo `Pet` traz só o que a carteirinha usa; a ficha amplia.
- **Enums no contrato:** espécie, porte e sexo são estreitados em `petDtoSchema` (maiúsculas aceitas, como a API); valor desconhecido vira `CONTRACT_MISMATCH`, sem rótulo inventado.
- **`describePet`:** raça ou espécie (exótico usa a descrição) · porte · idade (anos para baixo; meses abaixo de 1 ano; "menos de 1 mês") · sexo (desconhecido fica de fora) · castração ("castrada" só para fêmea). Uma data só por visita para todas as carteirinhas.
- **`backendForRequest()`** (`shared/api/server`): o cliente do backend da requisição (cookie + IP) estava copiado no prefetch da 014 e da 015; virou peça única, usada também aqui.
- **Rascunho (T6, REQ-PETS-009) fica para a 021:** a faixa depende do `readPetDraft` da 021; sem ele seria código sem uso.
- **Sem `loading.tsx` e `error.tsx` próprios:** o fallback do `<Suspense>` da página é a grade-esqueleto com o título; erro de rota usa o `error.tsx` do app (004); erro da API aparece dentro da lista (`ErrorState`).

## Rota e renderização

| Arquivo                        | Tipo                     | Faz                                                                                                                                                                                       |
| ------------------------------ | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(owner)/pets/page.tsx`    | RSC dinâmico (lê sessão) | `requireRole(["owner","host"], "/pets")`; prefetch de `petQueries.mine(user.id)` com o `backendClient` num `QueryClient` novo; `HydrationBoundary` com o estado; renderiza `MyPetsScreen` |
| `app/(owner)/pets/loading.tsx` | RSC                      | `PetListSkeleton` (navegação no cliente)                                                                                                                                                  |
| `app/(owner)/pets/error.tsx`   | client                   | `ErrorState` com `reset`                                                                                                                                                                  |

`/pets` atende tutor e anfitrião (023), então o grupo de rota precisa aceitar os dois papéis: o layout de `(owner)` chama `requireRole(["owner","host"])` só para `/pets/*` (ajuste a registrar na 004, que hoje põe `/pets` em `(owner)`; ver Perguntas em aberto da 023). Sem `'use cache'` (dados privados).

## Árvore de componentes

```
page.tsx (RSC)
└─ MyPetsScreen (features/pets · server)            título, faixa de rascunho, lista
   ├─ DraftBanner (features/pets · client)          lê o rascunho da 021 (REQ-PETS-009)
   └─ PetList (features/pets · client)              useQuery(petQueries.mine)
      ├─ PetIdCard variant="compact" (features/pets · server-safe, sem estado)
      ├─ NewPetTile (features/pets)                 link para /pets/new
      ├─ EmptyState (shared/ui/feedback)            REQ-PETS-004
      └─ InactivePetsSection (features/pets · client) disclosure "Fora da lista"
```

`PetIdCard` não usa hooks: renderiza no servidor e no cliente. Variantes: `compact` (lista, escolha de pets) e `full` (ficha 022, revisão e prévia ao vivo da 021).

## Contratos e modelos

| Camada            | Símbolo                                                                                   | Origem                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| DTO               | `MyPetsResponse`                                                                          | `unwrapData(GetApiV1PetsMeResponse)` em `features/pets/api/contracts.ts` |
| DTO               | `PetDto`                                                                                  | `unwrapData(GetApiV1PetsPetIdResponse)`                                  |
| Enums estreitados | `petSpeciesSchema` (12 valores), `petSizeSchema`, `petSexSchema`                          | `features/pets/api/contracts.ts`; o OpenAPI descreve como string livre   |
| Modelo de UI      | `Pet`, `PetKeeper`, `PetPhoto`                                                            | `features/pets/types.ts`                                                 |
| Mapper            | `toPet(dto)`, `toPetList(dto)` (separa `active` e `inactive`)                             | `features/pets/api/mappers.ts`                                           |
| Lib pura          | `describePet(pet, now)` → resumo; `speciesLabel`, `sizeLabel`, `ageLabel(birthDate, now)` | `features/pets/lib/`                                                     |
| Copy              | `petsCopy`                                                                                | `features/pets/lib/petsCopy.ts`                                          |

Espécies (valor → rótulo): `dog` Cachorro, `cat` Gato, `cockatiel` Calopsita, `parrot` Papagaio, `parakeet` Periquito, `canary` Canário, `rabbit` Coelho, `hamster` Hamster, `guinea_pig` Porquinho-da-índia, `fish` Peixe, `turtle` Tartaruga ou jabuti, `exotic` usa a `speciesDescription`.

## Fluxo de dados

- `petQueries` (`features/pets/api/queries.ts`, fábrica de `queryOptions`):
  - `petQueries.all(accountId)` → `accountQueryKey(accountId, "pets")` (raiz para invalidar);
  - `petQueries.mine(accountId)` → `[...all, "mine"]`, `queryFn` = transporte injetado (`bffClient` no navegador, `createBackendClient` no prefetch);
  - `petQueries.detail(accountId, petId)` (usada na 022).
- `api/client/pets.client.ts` e `api/server/pets.server.ts` declaram só método, caminho e schema; o transporte vem de fora (DIP).
- Mutations das specs 021 e 022 invalidam `petQueries.all(accountId)`.
- Rascunho: `DraftBanner` lê `readPetDraft(accountId)` da 021 (só nome e passo; nunca foto).

## Erros

| Código da API          | Onde aparece                 | Texto                                                             |
| ---------------------- | ---------------------------- | ----------------------------------------------------------------- |
| rede, 5xx              | `ErrorState`                 | `getErrorMessage(error)`                                          |
| `PET_KEEPER_NOT_FOUND` | 023 (anfitrião não aprovado) | "Os pets da casa entram depois que sua verificação for aprovada." |
| `FORBIDDEN`            | não acontece (guard da rota) | redireciona antes                                                 |

## Reutiliza

`requireRole`, `accountQueryKey`, `bffClient`, `createBackendClient`, `unwrapData`, `getErrorMessage`, `EmptyState`, `ErrorState`, `Sticker`, `StatusPill`.

## Cria de reutilizável

| Recurso                                                | Onde                             | Quem mais usa                                                   |
| ------------------------------------------------------ | -------------------------------- | --------------------------------------------------------------- |
| `PetIdCard` (`compact`, `full`)                        | `features/pets/components`       | 021 (prévia e revisão), 022 (ficha), 023, 050 (escolha de pets) |
| `describePet`, `ageLabel`, `speciesLabel`, `sizeLabel` | `features/pets/lib`              | 021, 022, 050, 052                                              |
| `petQueries`                                           | `features/pets/api/queries.ts`   | 021, 022, 023                                                   |
| `petSpeciesSchema`, `petSizeSchema`, `petSexSchema`    | `features/pets/api/contracts.ts` | 021, 022                                                        |
| `toPet`, `toPetList`                                   | `features/pets/api/mappers.ts`   | 022, 023                                                        |

Exporta pelo `features/pets/index.ts` (tipos, lib, `PetIdCard`) e `index.client.ts` (hooks, `PetList`).

## Matriz de testes

| REQ             | Nível                   | Arquivo                                               | Caso                                                                                                                       |
| --------------- | ----------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 011             | Unitário                | `describePet.test.ts`, `ageLabel.test.ts`             | cão com porte e castrado; exótico com descrição; sem data de nascimento; menos de 1 ano em meses; `unknown` fora do resumo |
| 001/005         | Unitário                | `mappers.test.ts`                                     | separa ativos e inativos mantendo a ordem; espécie desconhecida falha no contrato                                          |
| 001/002/003     | Componente              | `PetIdCard.test.tsx`, `PetList.test.tsx`              | nome acessível "Ficha de …"; link para `/pets/{id}`; silhueta sem foto; tile no fim                                        |
| 004             | Componente              | `PetList.test.tsx`                                    | lista vazia mostra o `EmptyState` e o botão                                                                                |
| 005             | Componente              | `InactivePetsSection.test.tsx`                        | recolhido por padrão; `aria-expanded`; contagem                                                                            |
| 009             | Componente              | `DraftBanner.test.tsx`                                | com rascunho mostra nome; "Descartar" apaga; sem rascunho não renderiza                                                    |
| 006             | Integração (MSW, Node)  | `pets.server.int.test.ts`                             | prefetch chama `GET /pets/me` com Bearer e o estado desidratado traz os pets                                               |
| 008             | Integração (MSW, jsdom) | `PetList.int.test.tsx`                                | 500 mostra `ErrorState`; "Tentar de novo" refaz a busca                                                                    |
| 007             | Integração (MSW, jsdom) | `petQueries.int.test.tsx`                             | invalidar `petQueries.all` refaz `mine`                                                                                    |
| 001 a 005       | Storybook               | `PetIdCard.stories.tsx`, `PetList.stories.tsx`        | variantes, vazio, inativos, celular; a11y sem violação                                                                     |
| 001/003/004/010 | E2E simulado            | `e2e/mocked/pets/my-pets.spec.ts` (desktop e celular) | lista renderizada no servidor; vazio; clique abre a ficha; admin é redirecionado                                           |
| 001             | E2E real                | `e2e/real/pets/my-pets.spec.ts`                       | com o tutor de demonstração do seed, a lista carrega da API real                                                           |
