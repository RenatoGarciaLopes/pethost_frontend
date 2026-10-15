---
spec: 043-host-payouts
status: in-progress
updated: 2026-10-15
---

# 043 · Design técnico

## Rota e renderização

| Arquivo                             | Tipo         | Faz                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(host)/host/payments/page.tsx` | RSC dinâmico | `requireRole(["host"], "/host/payments")` dentro de `Suspense`; prefetch de `payoutQueries.account(user.id)` pelo `backendForRequest`; `404 HOST_NOT_FOUND` vira o estado "sem verificação" (não `notFound()`); `HydrationBoundary`; renderiza `HostPayoutsScreen`. Metadados: "Como você recebe · PetHost", `noindex` |

Sem `'use cache'`. O `searchParams` `stripe` é lido no cliente (`useSearchParams`) para sincronizar uma vez e limpar a URL.

## Árvore de componentes

```
page.tsx (RSC)
└─ HostPayoutsScreen (features/host-payouts · server)   prefetch + HydrationBoundary
   └─ HostPayouts (features/host-payouts · client)       escolhe o estado pela situação
   ├─ conteúdo interno de HostPayouts                 mensagem e ação para cada estado
      ├─ EmbeddedOnboarding (client, dynamic import)     Connect.js account-onboarding
   └─ HostedFallback (interno)                        REQ-PAYOUT-010
```

`EmbeddedOnboarding` é carregado com `next/dynamic` (`ssr: false`): o script do Stripe só baixa quando a pessoa abre o cadastro.

## Dependências novas

- `@stripe/connect-js` e `@stripe/react-connect-js` (oficiais do Stripe). Instalar com `npm install --ignore-scripts`. `loadConnectAndInitialize({ publishableKey, fetchClientSecret, appearance, locale: "pt-BR" })`; `fetchClientSecret` chama `onboarding-session` a cada pedido do Stripe (REQ-PAYOUT-006), sem guardar o segredo.

## Contratos e modelos

| Camada   | Símbolo                                     | Origem                                                                                            |
| -------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| DTO      | `StripeAccountDto`                          | `unwrapData(GetApiV1HostsMeStripeAccountResponse)` com `status` estreitado em `PayoutStatus`      |
| DTO      | `OnboardingSessionDto`, `OnboardingLinkDto` | respostas de `onboarding-session` e `onboarding-link`                                             |
| Modelo   | `PayoutAccount`                             | `{ status, payoutsEnabled, listingsVisible, missing: PayoutRequirement \| null, syncedAt }`       |
| Mapper   | `toPayoutAccount(dto)`                      | `features/host-payouts/api/mappers`                                                               |
| Lib pura | `toStripeAppearance(theme)`                 | `features/host-payouts/lib` (variáveis do Connect.js a partir de `theme.palette` e `theme.shape`) |
| Lib pura | `payoutRequirementOf(disabledReason)`       | `features/host-payouts/lib` → chave de copy                                                       |

## Fluxo de dados

- Query `payoutQueries.account(accountId, transport)` → `[...accountQueryKey(accountId, "payouts"), "account"]`, `staleTime` 30 s.
- `useStartOnboarding()` → `fetchClientSecret` para o Connect.js; atualiza o cache com `account` de cada resposta.
- `useSyncPayoutAccount()` → `POST …/synchronization`; `setQueryData`; usado no `onExit` e no retorno `?stripe=`.
- `useHostedOnboardingLink()` → `POST …/onboarding-link` e `window.location.assign(url)`.
- `payoutStageOf(account)` exporta o contrato para a etapa 2 da 030: `locked`, `current`, `reviewing`, `complete` ou `rejected`, com título, rótulo e `/host/payments`. A integração ao painel foi pulada conforme divisão com Lynx.
- A API de sincronização também pode responder `404 HOST_STRIPE_ACCOUNT_NOT_FOUND` antes da primeira sessão. O cliente preserva esse erro e apresenta a frase específica; ele não altera o `404 HOST_NOT_FOUND` da consulta inicial.
- O suporte é indicado por texto conforme a spec; não existe rota ou endereço de suporte neste frontend para ligar o CTA.

## Recursos implementados e validação

| Recurso                     | Localização                                                                                      | Interface e uso                                                               | Dependências e limites                                                                           | Cobertura                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| Conta de recebimento e DTOs | `api/contracts.ts`, `api/mappers.ts`, `types.ts`                                                 | valida DTOs e projeta `PayoutAccount` sem `disabledReason` bruto              | OpenAPI gerado + Zod; status desconhecido falha fechado                                          | unitários por status e contrato inválido         |
| Requisitos e appearance     | `lib/payoutRequirementOf.ts`, `lib/toStripeAppearance.ts`                                        | converte motivo Stripe e tema MUI para valores usados na tela/SDK             | funções puras, sem dependência de UI além do tema no appearance                                  | unitários                                        |
| Query e operações BFF       | `api/queries.ts`, `api/server/payoutAccount.server.ts`, `api/client/payouts.client.ts`, `hooks/` | consulta, prefetch, cria sessões, sincroniza e obtém link                     | TanStack Query e cliente autenticado existente; clientSecret e URL hospedada não entram em cache | integração MSW Node/jsdom                        |
| `EmbeddedOnboarding`        | `components/client/EmbeddedOnboarding/`                                                          | inicializa Connect.js quando solicitado e solicita novo segredo ao SDK        | fronteira runtime Stripe; segredo permanece em closure e não cruza props/cache                   | componente + integração jsdom com SDK mockado    |
| `HostPayouts`               | `components/client/HostPayouts/`                                                                 | apresenta estados, sincroniza retorno e oferece onboarding embutido/hospedado | depende de rota e painel ainda pertencente a outras specs; sem painel 030                        | componente + integração jsdom                    |
| `HostPayoutsScreen` e rota  | `components/server/HostPayoutsScreen/`, `app/(host)/host/payments/`                              | exige sessão host, prefetch e hidrata a tela                                  | backend autenticado existente; Next App Router                                                   | integração RSC/guards                            |
| `payoutStageOf`             | `lib/payoutStageOf.ts`                                                                           | contrato exportável para status da etapa 2 do painel 030                      | composição leve; ainda sem consumidor no painel em paralelo                                      | teste unitário; integração pendente com 030      |
| Handlers simulados          | `e2e/support/handlers/stripeAccount.mjs`                                                         | simula estado, sessão, link e sincronização para navegador                    | apenas backend de teste; link e segredo são sintéticos                                           | MSW dos handlers; Playwright pendente das portas |

Os três arquivos de stories usam `export default meta`. Arquivos desta entrega estão em UTF-8 sem BOM. A documentação do vault e seu catálogo serão completados pelo Renato.

## Erros

| Código                                                               | Onde                 | Comportamento                             |
| -------------------------------------------------------------------- | -------------------- | ----------------------------------------- |
| `HOST_NOT_FOUND`                                                     | página               | estado "sem verificação" (REQ-PAYOUT-002) |
| `HOST_STRIPE_UNAVAILABLE` (503)                                      | `Notice`             | "Tentar de novo"                          |
| `HOST_STRIPE_ACCOUNT_REJECTED`, `HOST_STRIPE_ONBOARDING_NOT_ALLOWED` | `Notice`             | sem botão de cadastro                     |
| `HOST_STRIPE_REQUEST_REJECTED`, `HOST_STRIPE_ACCOUNT_ALREADY_EXISTS` | `Notice`             | frase + contato do suporte                |
| falha ao carregar o Connect.js                                       | região do componente | plano B hospedado (REQ-PAYOUT-010)        |

## Matriz de testes

| REQ             | Nível                   | Arquivo                                                  | Caso                                                                                                                                            |
| --------------- | ----------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 005             | Unitário                | `toStripeAppearance.test.ts`                             | cores, raio e fonte vindos do tema; nenhuma cor fixa                                                                                            |
| 008             | Unitário                | `toPayoutAccount.test.ts`, `payoutRequirementOf.test.ts` | cada situação; `rejected`; valor desconhecido falha no contrato                                                                                 |
| 001/002         | Integração (MSW, Node)  | `payoutAccount.server.int.test.ts`                       | prefetch; 404 vira estado, não erro                                                                                                             |
| 004/006/007     | Integração (MSW, jsdom) | `HostPayouts.int.test.tsx`                               | `fetchClientSecret` pede sessão nova a cada chamada; segredo não vai para storage; `onExit` sincroniza (Connect.js mockado no limite do pacote) |
| 003/008/009/013 | Componente              | `HostPayouts.test.tsx`                                   | um estado por situação; próximo passo em `enabled`                                                                                              |
| 010/011         | Integração (jsdom)      | `HostPayouts.int.test.tsx`                               | falha do script oferece o link; `?stripe=retorno` sincroniza uma vez e limpa a URL                                                              |
| 012             | Unitário                | `getErrorMessage.test.ts`                                | frases dos códigos novos                                                                                                                        |
| todos           | Storybook               | `HostPayouts.stories.tsx`                                | um estado por situação, celular; a11y                                                                                                           |
| 002/003/009     | E2E simulado            | `e2e/mocked/host/payouts.spec.ts`                        | sem verificação; not_started → abre (Connect.js trocado por página fake no mock); voltar com `?stripe=retorno` mostra `enabled`                 |
