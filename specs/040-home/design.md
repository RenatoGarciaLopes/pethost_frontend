---
spec: 040-home
status: in-progress
updated: 2026-10-15
---

# 040 · Design técnico

## Rota e renderização

`src/app/page.tsx` é uma RSC pública com metadata. A página coloca `HomeContent` dentro de `Suspense`; `HomeContent` chama `connection()` antes de `getSession()` para que leitura de cookies/tempo da sessão só ocorra na requisição. Visitante e anfitrião não fazem chamada de pets. Tutor autenticado usa `prefetchMyPets` e o `petQueries.mine` já existente; erro dessa consulta vira o estado genérico recuperável. O resultado é projetado para `{ id, name, species }`; URLs de fotos e campos privados não cruzam a fronteira RSC/client. Fallback `HomeLoading` não contém busca clicável. Não há cache compartilhado por sessão.

## Árvore de componentes

```text
src/app/page.tsx (RSC; sessão opcional, pets do tutor e metadata)
└─ src/widgets/home/components/HomeScreen/HomeScreen.tsx (client; texto, cena, busca e confiança)
   ├─ DoorScene (shared, quintal/porta/parallax existente)
   ├─ TurmaWalker (shared, turma existente)
   └─ TrustList (shared, garantias existentes)
```

Não se cria uma feature `home`: a home não possui domínio/API própria. O widget apenas compõe a página pública. Os componentes compartilhados são importados por seus índices públicos; não se altera nenhum deles.

## Contrato e montagem da busca

`src/widgets/home/lib/homeSearchPath.ts` fornece `buildHomeSearchPath` (função pura, testada) e monta apenas a URL de handoff:

| Estado                  | Query de `/search`                                                           |
| ----------------------- | ---------------------------------------------------------------------------- |
| Tutor com pet(s)        | `where`, `from`, `to`; `pets` repetido por id selecionado.                   |
| Visitante/tutor sem pet | `where`, `from`, `to`; `species` com `dog` ou `cat`.                         |
| Anfitrião               | `where`, `from`, `to`; `pets` como quantidade escolhida, conforme a 041/API. |

Valores vazios são omitidos; nomes e fotos nunca entram na URL. `HomeScreen` escolhe `/search?...` para qualquer sessão pessoal e `loginRedirectPath(searchPath)` para visitante, reaproveitando a validação segura de `next` em `shared/config/appRoutes`. A 040 não replica o parser nem chama endpoint de listing; a 041 é responsável por consumir essa URL e adaptar parâmetros ao contrato real.

## Reutilização

- `DoorScene`, `TurmaWalker`, `TrustList` e `SniffLoader` do catálogo existente.
- `getSession`, `connection`, `getQueryClient`, `prefetchMyPets` e `petQueries` existentes.
- A garantia das datas é delegada à validação da spec 041; a home só coleta strings de calendário e as preserva.

## Erros e estados

Falha em `/pets/me` não impede a home: a página sinaliza `petsUnavailable` sem mensagem técnica e exibe seleção dog/cat. Falha em `GET /users/me` não é convertida em visitante; erro inesperado sobe para o limite global, sem afirmar estado de sessão incorreto. A busca nunca é prefetched nem chamada nessa tela.

## Recurso reutilizável criado

`HomeScreen`: widget de composição do Início, props serializáveis `viewer`, `pets`, `petsUnavailable`. Export interno ao widget, sem API de domínio e sem armazenamento. Story exercita visitante, tutor sem pet, tutor com pets e anfitrião. Documentação de interface, estados e validação na nota `development/resources/home.md` do vault.

`buildHomeSearchPath`: utilitário interno puro, sem efeitos. Teste unitário cobre parâmetros opcionais, repetidos, codificação e omissão de vazio. Não precisa story.

## Matriz de testes

| REQ            | Nível           | Arquivo                                                      | Caso                                                                                      |
| -------------- | --------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 001, 010       | Integração Node | `src/app/page.int.test.tsx`                                  | Metadata, `connection`, visitante, tutor com/sem pets; chamadas MSW; fallback carregando. |
| 002 a 006, 009 | Unitário        | `src/widgets/home/lib/homeSearchPath.test.ts`                | URL encode, arrays, query opcional, espécies/contagem.                                    |
| 002 a 009      | Componente      | `src/widgets/home/components/HomeScreen/HomeScreen.test.tsx` | Estados, seleção, submit autenticado/visitante, erro e expansão acessível.                |
| todos          | Storybook       | `HomeScreen.stories.tsx`                                     | Visitante, tutor sem pet, tutor com pets, anfitrião, indisponível e celular.              |
| 001 a 009      | E2E simulado    | `e2e/mocked/home/home.spec.ts`                               | Entrada pública, seleção, redirect de visitante com query preservada e envio autenticado. |

E2E real não se aplica nesta entrega: a rota `/search` pertence à spec 041 e ainda não está presente no `dev` desta worktree. Storybook e Playwright serão escritos, não executados, conforme o fluxo do proprietário da spec. A API de busca é deliberadamente N/A na home.
