# Convenções de código do frontend

> Regra para humanos e agentes. Se o código existente contradiz este documento, o documento vale para código novo e o antigo vira tarefa de refatoração. Decisões D1–D6 em [architecture-review.md](architecture-review.md).

## 1. Nomes

### Arquivos e pastas

| O quê                                        | Padrão                                                                            | Exemplo                                                                      |
| -------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Pastas de domínio, rota e segmento           | kebab-case, inglês, plural para recurso                                           | `features/host-applications`, `app/(authenticated)/pets/[petId]`             |
| Componente React                             | PascalCase, um componente público por arquivo, pasta própria                      | `components/client/PetIdCard/PetIdCard.tsx`                                  |
| Hook                                         | camelCase com `use`                                                               | `hooks/useCreatePetMutation.ts`                                              |
| Função pura, mapper, schema, constante, tipo | camelCase pelo conteúdo principal                                                 | `lib/calculateStayTotalCents.ts`, `schemas/petFormSchema.ts`, `types/pet.ts` |
| Ambiente explícito                           | sufixo `.server.ts` / `.client.ts` quando o mesmo nome existe nos dois            | `api/server/pets.server.ts`, `api/client/pets.client.ts`                     |
| Testes                                       | `*.test.ts(x)` unidade/componente, `*.int.test.ts(x)` integração, `*.spec.ts` E2E | `PetIdCard.test.tsx`, `useCreatePetMutation.int.test.tsx`                    |
| Story                                        | `*.stories.tsx` ao lado do componente                                             | `PetIdCard.stories.tsx`                                                      |
| Arquivos especiais do Next                   | os nomes do framework                                                             | `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, `proxy.ts` |

### Símbolos

| O quê                              | Padrão                                                       | Exemplo                                                                             |
| ---------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Componente                         | PascalCase, substantivo do que **é**                         | `PetIdCard`, `StepTrail`, `ChoiceCardGroup`                                         |
| Props                              | `<Componente>Props`                                          | `PetIdCardProps`                                                                    |
| Evento recebido / tratador interno | `on<Evento>` / `handle<Evento>`                              | `onSubmit` → `handleSubmit`                                                         |
| Booleano                           | `is`, `has`, `can`, `should`                                 | `isNeutered`, `canStartNew`, `hasYard`                                              |
| Função                             | verbo + objeto                                               | `formatCents`, `toPet`, `isSafeRedirect`, `resolvePostLoginPath`                    |
| Chamada HTTP                       | verbo do recurso, igual nos dois ambientes                   | `getMyPets`, `getPetById`, `createPet`, `updatePet`, `deactivatePet`, `addPetPhoto` |
| Mapper                             | `to<Destino>`                                                | `toPet(dto)`, `toCreatePetRequest(values)`                                          |
| Query keys                         | fábrica `<recurso>Keys`                                      | `petKeys.mine(accountId)`                                                           |
| Opções de query                    | `<recurso>Queries.<consulta>` com `queryOptions`             | `petQueries.mine(accountId)`                                                        |
| Hook de query / mutation           | `use<Recurso><Consulta>Query` / `use<Ação><Recurso>Mutation` | `useMyPetsQuery`, `useCreatePetMutation`                                            |
| Schema Zod / tipo inferido         | `<coisa>Schema` / `<Coisa>Values`                            | `petFormSchema` / `PetFormValues`                                                   |
| DTO / request / modelo de UI       | `<Recurso>Dto` / `<Ação><Recurso>Request` / `<Recurso>`      | `PetDto`, `CreatePetRequest`, `Pet`                                                 |
| Store Zustand                      | fábrica `create<Fluxo>Store` + hook `use<Fluxo>Store`        | `createPetWizardStore`, `usePetWizardStore`                                         |
| Constante de regra                 | SCREAMING_SNAKE com a regra no nome                          | `MAX_PET_PHOTOS = 3`, `PLATFORM_FEE_RATE = 0.1`                                     |
| IDs de requisito                   | `REQ-<ÁREA>-<NNN>`                                           | `REQ-AUTH-003`                                                                      |

Nomes técnicos em inglês e iguais à API (`fullName`, `birthDate`, `goodWithDogs`). Texto exibido em português, sempre vindo de um arquivo de microcopy da feature (`lib/<feature>Copy.ts`), nunca solto no JSX quando aparece em mais de um lugar.

**Exportação:** só exports nomeados. `export default` apenas onde o Next exige (`page`, `layout`, `route`, `loading`, `error`, `not-found`).

## 2. Anatomia

### Slice de feature

```
features/pets/
  index.client.ts        API pública para ilhas (componentes client, hooks)
  index.server.ts        API pública para RSC/BFF (import 'server-only')
  index.ts               API pública neutra (tipos, schemas, lib pura)
  api/server/            chamadas ao backend (server-only)
  api/client/            chamadas ao BFF
  api/contracts/         reexporta e estreita o gerado do OpenAPI
  api/mappers/           DTO <-> modelo de UI
  components/server/     RSC sem estado
  components/client/     ilhas
  hooks/  queries/  schemas/  lib/  types/  stores/
```

Fora da slice, importar **só** pelos `index*`. Dentro, imports relativos. Criar segmento apenas quando houver arquivo (gerador: `npm run gen:feature`).

### Componente

```
PetIdCard/
  PetIdCard.tsx          implementação + TSDoc
  PetIdCard.test.tsx     comportamento
  PetIdCard.stories.tsx  estados (padrão, vazio, carregando, erro, celular)
  index.ts               export { PetIdCard } e o tipo de props
```

## 3. Responsabilidades (SOLID aplicado a React/Next)

| Princípio                     | Como se aplica aqui                                                                                                                                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S** · uma razão para mudar  | Componente **apresenta**; hook **orquestra estado e efeitos**; `api/*` faz **E/S**; mapper **converte**; `lib` **calcula**; schema **valida**. Um arquivo que faz duas destas coisas é dividido |
| **O** · aberto para extensão  | Variação visual por variant/`styleOverrides` do tema, não por `if` no componente; composição por `children` e slots em vez de props booleanas que trocam layout                                 |
| **L** · substituível          | Wrapper de componente MUI aceita e repassa as mesmas props (`...rest`, `ref`); quem usa `ChoiceCard` pode usar como um `ButtonBase`                                                             |
| **I** · interfaces pequenas   | Props recebem o mínimo (`petName`, `photoUrl`), não o DTO inteiro; componentes de apresentação não conhecem a API                                                                               |
| **D** · depender de abstração | Features dependem de `HttpTransport` (porta em `shared/api`); componentes dependem de hooks, não de `fetch`; testes trocam a borda com MSW, nunca com mock de módulo interno                    |

## 4. Código limpo, regras objetivas

1. **Funções curtas**, com um nível de abstração. Uma função de mais ou menos 30 linhas já é sinal para extrair.
2. **Retorno antecipado** em vez de `if` aninhado.
3. **Sem parâmetro booleano** que muda o comportamento: crie duas funções.
4. **Sem número mágico.** Regra de negócio vira constante nomeada em `lib/constants.ts` da feature, citando a regra da API.
5. **Erros tipados:** a borda HTTP lança `ApiError` (`code`, `status`, `fieldErrors`, `retryAfterSeconds`). Nenhum `catch` vazio. A tela traduz o código pelo mapa de microcopy.
6. **Imutabilidade:** nada de mutar props, estado ou cache. Atualização otimista só via `setQueryData` com rollback.
7. **Sem `any`.** `unknown` e estreitamento por schema na fronteira.
8. **Dinheiro e datas:**
   - dinheiro sempre em centavos (`number` inteiro);
   - datas de calendário como `yyyy-MM-dd`;
   - instantes como ISO ou Unix, convertidos só para exibir.
9. **Acessibilidade é requisito:**
   - rótulo visível em todo campo;
   - foco visível;
   - estados com `role="status"` ou `alert`;
   - alvo de toque de 44 px ou mais;
   - `prefers-reduced-motion` respeitado.
10. **Sem lógica no `page.tsx`:** a página lê params e sessão, busca no servidor e compõe. A regra mora na feature.

## 5. Documentação de cada componente e recurso

Obrigatória na mesma entrega:

1. **TSDoc** no export, com o que é, quando usar, quando **não** usar, cada prop e um exemplo mínimo.
2. **Story** com os estados da tela (o board do canvas que ele materializa vai no `parameters.design`).
3. **Linha no catálogo** do vault (`development/resource-catalog.md`) se for reutilizável (`shared/`, `widgets/` ou exportado pelo `index*` da feature).
4. **Nota em `development/resources/`** só para recursos de `shared/` e `widgets/` (template do vault).

## 6. Testes (TDD)

Ciclo por tarefa: **vermelho** (teste escrito a partir do critério de aceite, falhando) → **verde** (o mínimo para passar) → **refatorar** (com o teste verde) → documentar.

| Unidade                                            | Nível obrigatório                                     | Ferramenta                                    |
| -------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| `lib`, mapper, schema, store                       | Unitário                                              | Vitest (node)                                 |
| Componente                                         | Componente: comportamento observável por papel/rótulo | Vitest + Testing Library + user-event (jsdom) |
| Hook com query/mutation, Route Handler, transporte | Integração                                            | Vitest + MSW                                  |
| Jornada de tela                                    | E2E simulado; real quando a API existe                | Playwright                                    |

- O nome do teste carrega o requisito: `it('REQ-AUTH-003 mostra o aviso de conta pausada com reativação', …)`.
- Fixture e builder vêm de `src/test/builders`, com dados sintéticos.
- Requisição sem handler no MSW **falha**.
- Proibido: snapshot como única prova, `sleep` fixo, testar classe do MUI ou ordem de hooks.

## 7. Comandos

`npm run verify` = lint + typecheck + teste unitário/componente/integração. Uma tarefa só está pronta com o `verify` verde e o E2E da tela (quando a spec pedir) passando.
