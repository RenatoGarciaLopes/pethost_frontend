---
spec: 043-host-payouts
status: draft
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
      ├─ PayoutsIntro                                    not_started: os 90% e o botão
      ├─ PayoutsStatusNotice                             in_progress, under_review, restricted, enabled, rejected
      ├─ EmbeddedOnboarding (client, dynamic import)     Connect.js account-onboarding
      └─ HostedOnboardingFallback                        REQ-PAYOUT-010
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
- O `HostOnboardingPanel` (widget da 030) recebe a etapa 2 por props a partir de `payoutQueries.account` (a página do painel faz o prefetch das duas situações).

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
