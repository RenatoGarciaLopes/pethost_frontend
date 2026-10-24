---
spec: 040-home
status: in-progress
updated: 2026-10-15
---

# 040 · Design técnico

## Atualização visual T7 (17/10/2026)

O primeiro lote da 005/T7 extrai AppHeader da casca, compõe-o na rota acima do HomeScreen e estende DoorScene/TrustList sem duplicá-los. A busca mantém seu contrato; `homeDateLabel` apresenta datas legíveis sem alterar ISO. Contratos, dependências, matriz de cobertura e limites em [implementação T7](../005-ui-conformance/home-fidelity-implementation.md). Consulta de casas próximas foi autorizada para tutor com endereço e pet, mas será implementada em segundo commit após o PR #21 entrar no dev; **a regra sem busca descrita abaixo ainda vale para este primeiro lote**. Visitante/host continuarão sem consulta; vazio/falha ocultarão a seção no segundo lote.

## Renovação na home — revisão do PR 18 (2026-10-16)

`src/app/page.tsx` recebe `searchParams` do Next, preserva valores repetidos e chama `getSession(currentPath)` com a raiz e seus parâmetros, depois de `connection()`. Não lê claims para definir o papel. Sem sessão continua visitante; sessão renovável passa pelo handler de refresh e volta ao mesmo destino; sessão válida mantém o fluxo existente. Os parâmetros são serializados por `URLSearchParams`, sem log ou cache persistido.

### Catálogo provisório: getSession(currentPath?)

| Nome       | Tipo/domínio                         | Status                           | Local real                             | Documentação                                                            |
| ---------- | ------------------------------------ | -------------------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| getSession | service, frontend/shared auth server | implemented, interface estendida | `src/shared/auth/server/getSession.ts` | Esta seção; atualização no vault pendente por instrução de não editá-lo |

Parâmetro opcional `currentPath?: string`: em `refresh-required`, redireciona por `refreshRedirectPath(currentPath)`, usando a mesma renovação de `requireSession`. Sem argumento preserva o comportamento dos consumidores existentes (`null` para sessão ausente/renovável, como no login). Retorna `Promise<SessionUser | null>`; o redirect do Next interrompe o render. Dependências: leitor de sessão memorizado por requisição, cookies/headers do Next, `redirect` e `refreshRedirectPath`. Uso na home: `await getSession("/?source=home")`. Apenas servidor, após dados da requisição e sob Suspense; não use o parâmetro para exigir login de visitante (para isso existe `requireSession`). Não grava cookies em RSC nem cria cache compartilhado entre usuários. Demais consumidores não precisam migrar.

Validação funcional e de integração em `src/app/page.int.test.tsx`: access vencido, ausente com refresh ou revogado pela API redirecionam antes de renderizar visitante/pets; retorno preserva parâmetros repetidos/codificados e a raiz sem query. Access vencido sem refresh permanece visitante. `getSession.int.test.ts` cobre o leitor/erros HTTP; componentes da home não mudaram. Nível unitário adicional N/A para o ramo trivial de redirect coberto na composição; E2E de renovação é aplicável, mas não executado nesta rodada sem portas. Comandos/resultados em `docs/validation.md`; vault não editado por instrução do usuário.

## Rota e renderização

`src/app/page.tsx` é uma RSC pública com metadata. A página coloca `HomeContent` dentro de `Suspense`; `HomeContent` chama `connection()` antes de `getSession()` para que leitura de cookies/tempo da sessão só ocorra na requisição. Visitante e anfitrião não fazem chamada de pets. Tutor autenticado usa `prefetchMyPets` e o `petQueries.mine` já existente; erro dessa consulta vira o estado genérico recuperável. O resultado é projetado para `{ id, name, species }`; URLs de fotos e campos privados não cruzam a fronteira RSC/client. Fallback `HomeLoading` não contém busca clicável. Não há cache compartilhado por sessão.

## Árvore de componentes

```text
src/app/page.tsx (RSC; sessão opcional, pets do tutor e metadata)
├─ AppHeader (widget app-shell; mesmo cabeçalho dos layouts)
└─ HomeScreen (widget home; único main, texto, cena, busca e confiança)
   ├─ DoorScene variant="house" (shared; casa, cerca, parallax e TurmaWalker)
   ├─ GroundLine (shared; gramado de borda a borda)
   └─ TrustList variant="cards" (shared; três garantias ilustradas)
```

Não se cria uma feature `home`: a home não possui domínio/API própria. O widget apenas compõe a página pública. Os componentes compartilhados são importados por seus índices públicos; a T7 acrescenta variantes ao DoorScene/TrustList, mantendo os modos usados por auth/registration.

## Contrato e montagem da busca

`src/widgets/home/lib/homeSearchPath.ts` fornece `buildHomeSearchPath` (função pura, testada) e monta apenas a URL de handoff:

| Estado                  | Query da URL de `/`                                                          |
| ----------------------- | ---------------------------------------------------------------------------- |
| Tutor com pet(s)        | `where`, `from`, `to`; `pets` repetido por id selecionado.                   |
| Visitante/tutor sem pet | `where`, `from`, `to`; `species` com `dog` ou `cat`.                         |
| Anfitrião               | `where`, `from`, `to`; `pets` como quantidade escolhida, conforme a 041/API. |

Valores vazios são omitidos; nomes e fotos nunca entram na URL. (Revisão 079) `HomeScreen` escreve a busca na URL de `/` por `useSearchUrl`, para qualquer sessão, sem passar pelo login. A 040 não replica o parser nem chama endpoint de listing; a 041 é responsável por consumir essa URL e adaptar parâmetros ao contrato real.

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

Neste primeiro lote da T7 a rota `/search` da 041 ainda não está no dev desta worktree. Stories Chromium/axe são executadas; Playwright e comparação dos prints aguardam a liberação das portas. Integração com API real não foi validada. A consulta de casas próximas autorizada pertence ao segundo lote, depois do merge do PR #21, sem implementar um cliente alternativo.
