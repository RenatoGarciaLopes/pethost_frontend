# Revisão da arquitetura inicial (11/10/2026)

> Escopo: scaffold em `pethost_frontend` (Next 16.4 App Router, React 19.3, MUI 9.5/Emotion, TanStack Query 5, Zustand 5, React Hook Form 7 + Zod 3, TypeScript estrito), documentos em `docs/` e notas em `PetHost obsidian/.../development/`. Comparado com a API real (`pethost_backend/src`, 11 controllers) e com o design (vault + canvas "PetHost · Resultados de cantinhos").
> Veredito: **a direção está certa e escala**. Os ajustes abaixo evitam que ela vire custo de manutenção quando o desenvolvimento for orientado por IA (muitas mudanças pequenas, feitas por agentes que seguem o que encontram no repositório ao pé da letra).

## O que está bom e deve ficar

| Decisão                                                                                                               | Por que está certa                                                                               |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Slices por domínio (`features/<recurso>`) com nomes iguais à API                                                      | Um agente acha o código pelo nome do endpoint; contas owner/host/users separadas como no backend |
| `widgets` para compor domínios e proibição de feature importar feature                                                | Mantém as features substituíveis e testáveis isoladamente                                        |
| `api/contracts` (DTO) separado de `types` (modelo de UI) com `api/mappers`                                            | A tela não quebra quando um DTO muda; o mapper é o único ponto de ajuste                         |
| Server Components por padrão, ilhas `use client` mínimas                                                              | Menos JS, SSR de verdade, alinhado ao Next 16                                                    |
| BFF com tokens em cookie HttpOnly, sem token no JavaScript                                                            | Requisito de segurança correto para JWT + refresh rotativo                                       |
| Query para estado remoto, Zustand só para rascunho/fluxo, filtros na URL                                              | Responsabilidades de estado bem separadas; evita duas fontes da verdade                          |
| QueryClient por requisição no servidor e limpeza no logout/troca de conta                                             | Evita vazamento de dados entre contas (crítico com contas owner/host do mesmo e-mail)            |
| Política de testes por nível com justificativa de N/A                                                                 | Evita tanto "sem teste" quanto "4 suítes artificiais"                                            |
| Regras do domínio já anotadas (centavos, datas de calendário, endereço só após pagamento, confirmação só por webhook) | São exatamente os pontos onde frontend costuma errar                                             |

## O que ajustar (por prioridade)

### P1 · Contratos gerados da API, não escritos à mão

A API publica OpenAPI em desenvolvimento (`/openapi/v1.json`, com `BearerSecuritySchemeTransformer`). Escrever DTOs à mão em 14 `api/contracts` garante divergência silenciosa.
**Recomendação:** gerar tipos e schemas Zod a partir do OpenAPI (Orval com saída `zod` + tipos, ou `openapi-typescript` + `openapi-zod-client`) para **um** módulo `src/shared/api/generated/` (nunca editado à mão). Versionar o documento em `openapi/pethost.v1.json` para o CI ser determinístico (`npm run api:sync` atualiza; `npm run api:generate` gera). As features continuam com `api/contracts`, mas ele só **reexporta e estreita** o gerado.
**Verificar antes:** se o OpenAPI do backend descreve o envelope `ApiResponse<T>` e os tipos de resposta (`[ProducesResponseType]`). Se não descrever, é um pedido ao time da API, não um motivo para escrever à mão.

### P2 · BFF: 1 proxy com lista permitida + handlers só onde há cookie

`app/api` espelha ~45 endpoints em pastas. Cada uma viraria um `route.ts` quase igual (ler cookie, pôr Bearer, repassar, tratar 401). Isso é duplicação, e cada cópia é um lugar para esquecer o CSRF ou o refresh.
**Recomendação:**

- `app/api/[...path]/route.ts` único, guiado por uma **lista permitida tipada** (`shared/api/server/bffRoutes.ts`: método + padrão de caminho + papéis + se aceita multipart). Ele não é proxy aberto: o que não está na lista responde 404. Concentra a injeção do Bearer, o refresh rotativo com execução única, a checagem de origem/CSRF, o streaming de upload e o repasse de `Retry-After`.
- **Handlers dedicados apenas** para o que grava ou apaga cookie: `auth/sessions/login`, `refresh`, `logout`, `switch`, `owners/register`, `users/register`, `owners/reactivate`, `hosts/reactivate`, `auth/password/reset`.
- De ~45 arquivos para ~10, e um teste de contrato da lista permitida substitui dezenas de testes repetidos.

### P3 · Fronteiras de importação verificadas pelo lint desde o primeiro commit

Hoje as regras ("feature não importa feature", "shared não importa nada acima", server-only) estão só no texto. Agentes de IA seguem o que compila, não o que está escrito.
**Recomendação:** `eslint-plugin-boundaries` (ou `import/no-restricted-paths`) com os elementos `app`, `bootstrap`, `widgets`, `features/*`, `shared` + regra que proíbe importar `api/server` em arquivo com `'use client'`. Fronteira quebrada vira erro de lint e de CI. `src/__tests__/unit/architecture` fica para o que o lint não alcança.

### P4 · Pastas vazias: trocar ~700 diretórios por um gerador

São 14 features × 12 segmentos, 9 widgets e 222 pastas de teste, todas vazias. Problemas:

- o Git não versiona diretório vazio, então um clone já nasce diferente da documentação;
- um agente lê "pasta existe" como "preencher";
- a árvore documentada (84 KB) vira manutenção sem código.

**Recomendação:**

- Manter só pastas com arquivo. A anatomia da slice fica documentada em `docs/conventions.md`.
- Um gerador (`npm run gen:feature -- pets`, `gen:component`, com Plop ou script Node) cria a estrutura **quando a spec começa**, já com o arquivo, o teste, a story e o bloco de documentação.

### P5 · Testes ao lado do código, `src/__tests__` só para infraestrutura de teste

O espelho `src/__tests__/{unit,component,integration}/features/<x>/<segmento>` duplica a árvore de produção em três cópias. Mover ou remover uma feature exige mexer em quatro lugares, e a ligação requisito → teste fica longe do código.
**Recomendação:**

- **Unitário e componente:** `PetCard.test.tsx` ao lado de `PetCard.tsx`.
- **Integração:** `*.int.test.ts` ao lado do hook ou handler.
- **`src/test/`** (ou o `src/__tests__` atual, renomeado) apenas para `msw/` (handlers, server), `builders/`, `render.tsx` (renderWithProviders) e `setup/`.
- **E2E:** em `e2e/` na raiz (`mocked/`, `real/`, `support/`), fora do `src`, porque não é código de aplicação.

**Isto contraria a decisão de copiar o AquaGas.** É a recomendação mais impactante para SDD, mas é uma escolha do Renato.

### P6 · Uma fonte da verdade para a documentação técnica

Hoje cada documento existe duas vezes, em `pethost_frontend/docs/*.md` e em `development/*.md` no vault, com a regra "manter os dois alinhados". Isso garante divergência.
**Recomendação:**

- **No repositório**, versionado e revisado junto com o código: convenções, arquitetura, specs e documentação de componente.
  - A documentação de componente fica em TSDoc no export, mais a story do Storybook (documentação viva, que também é teste de interação e de acessibilidade).
- **No vault:** o índice, o catálogo de recursos reutilizáveis (uma linha com link para o arquivo e a story) e as decisões de design.
- A nota de vault por componente fica só para recursos de `shared/` e `widgets/`.
- **Isto ajusta a política de documentação definida pelo Renato.** Proposta: "documentação explícita" passa a ser TSDoc + story + linha no catálogo, e a nota longa só para recursos reutilizáveis.

### P7 · `cacheComponents: true` com dados privados

Com Cache Components ligado, qualquer leitura de cookie torna o trecho dinâmico. O risco real é um `'use cache'` envolvendo dado de conta e servindo uma pessoa com o cache de outra.
**Regra a documentar e testar:**

- Nunca usar `'use cache'` em código que lê sessão.
- Cache só para dados públicos: tipos de pet, conteúdo da home e, no futuro, a página pública do cantinho sem compatibilidade.

### P8 · Peças que faltam na infraestrutura

| Falta                 | Proposta                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Validação de ambiente | `shared/config/env.server.ts` com Zod (`BACKEND_URL`, `BACKEND_API_PREFIX`, segredos de cookie); a subida falha se faltar algo |
| Fontes da marca       | `next/font/local` com Caprasimo e Atkinson Hyperlegible Next em `src/assets/fonts`                                             |
| Ícones desenhados     | `shared/ui/icons` (SVG em componente, `aria-hidden` por padrão)                                                                |
| Datas                 | `date-fns`; data de estadia trafega como `yyyy-MM-dd` (string), nunca `Date` com fuso                                          |
| Dinheiro              | `shared/lib/money` (`formatCents`, `sumCents`); nunca `float`                                                                  |
| Máscaras e documentos | `shared/lib/validation` (CPF/CNPJ com dígito, CEP, telefone) + componentes de campo mascarado                                  |
| CEP                   | Cliente ViaCEP em `shared/api/external/viaCep` (externo, sem BFF), com tempo limite e fallback para preenchimento manual       |
| Movimento             | Tokens de mola (`assentar`, `acolher`) em `shared/lib/motion` e respeito a `prefers-reduced-motion` em um hook único           |
| Storybook             | Documentação viva dos componentes e mesas de teste ligadas aos boards do canvas                                                |

### P9 · Ajustes menores de rota

- **Pedido de estadia:** `/owner/booking-requests/[listingId]` vira `/listings/[listingId]/request`. A ação nasce na página do cantinho e o `listingId` já está no caminho público.
- **Detalhe do pet e ficha (carteirinha):** `/pets/[petId]` e `/pets/[petId]/edit` estão certos. A ficha vista pelo anfitrião entra pelo pedido (`/host/booking-requests/[bookingId]`), não por `/pets/[petId]`, porque a permissão vem da reserva.

### P10 · Dependências

O `npm audit` aponta 5 alertas altos só na cadeia de desenvolvimento do ESLint, já anotados em `docs/validation.md`. Reavaliar ao montar o CI (spec 001).

## Decisões pedidas ao Renato

**D1 a D6 aprovadas pelo Renato em 11/10/2026.** D1/D3/D4/D5/D6 entregues na 001; D2 entra na 003. Recomendações originais preservadas.

| ID  | Decisão                                                | Recomendação |
| --- | ------------------------------------------------------ | ------------ |
| D1  | Gerar contratos do OpenAPI                             | Sim (P1)     |
| D2  | BFF com proxy por lista permitida + handlers de sessão | Sim (P2)     |
| D3  | Testes ao lado do código                               | Sim (P5)     |
| D4  | Remover pastas vazias e criar gerador                  | Sim (P4)     |
| D5  | Documentação: TSDoc + Storybook + catálogo no vault    | Sim (P6)     |
| D6  | Storybook como documentação viva                       | Sim          |

As specs em `specs/` foram escritas **assumindo as recomendações**. Se alguma for recusada, só os caminhos e as tarefas de infraestrutura da spec 001 mudam; os requisitos das telas continuam valendo.
