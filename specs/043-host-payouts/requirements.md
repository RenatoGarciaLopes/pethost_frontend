---
spec: 043-host-payouts
status: in-progress
updated: 2026-10-15
area: PAYOUT
---

# 043 · Como você recebe (Stripe Connect)

## Contexto

Segunda etapa do caminho do anfitrião: **1. Mostrar quem eu sou** (030) → **2. Como eu recebo** (esta) → **3. Montar meu cantinho** (044). A Dona Cida tem medo de "e se não me pagarem?" ([[personas]], [[19-abrir-meu-cantinho]] etapa 2). A tela explica antes de abrir o cadastro que o tutor paga antes e que a PetHost passa 90% quando o pet volta, e depois abre o cadastro **embutido** do Stripe (componente `account-onboarding` do Connect.js) com a aparência da PetHost.

Enquanto o Stripe não libera os repasses, o anfitrião não cadastra cantinho (`422 LISTING_HOST_PAYOUTS_NOT_ENABLED`) e nada dele aparece na busca.

## Referências

- **Design:** canvas → `Fluxo-Verificacao` → "Aprovada" (passo 2) e a tela própria do Stripe com Appearance ([[09-componentes-mui]]). Vault: `design/19-abrir-meu-cantinho.md` (etapa 2), `design/04-confianca.md`.
- **API** (`pethost_backend/docs/modulo-hosts.md` seções 3, 4.3 e 9; implementada):
  - `GET /api/v1/hosts/me/stripe-account`: situação gravada (`status`: `not_started`, `in_progress`, `under_review`, `restricted`, `enabled`, `rejected`; `payoutsEnabled`, `disabledReason`, `listingsVisible`, `syncedAt`). Não chama o Stripe.
  - `POST /api/v1/hosts/me/stripe-account/onboarding-session`: cria a conta conectada na primeira vez e devolve `clientSecret` (uso único, não guardar), `publishableKey`, `expiresAt` (Unix, s) e `account`. `Cache-Control: no-store`.
  - `POST /api/v1/hosts/me/stripe-account/onboarding-link`: alternativa pela página hospedada (`url` de uso único). Usada só como plano B (REQ-PAYOUT-010).
  - `POST /api/v1/hosts/me/stripe-account/synchronization`: relê a conta agora ("o app chama ao voltar do cadastro").
  - Erros: `404 HOST_NOT_FOUND` (sem verificação aprovada), `422 HOST_STRIPE_ONBOARDING_NOT_ALLOWED` (inativo ou suspenso), `422 HOST_STRIPE_ACCOUNT_REJECTED`, `409 HOST_STRIPE_ACCOUNT_ALREADY_EXISTS`, `422 HOST_STRIPE_REQUEST_REJECTED`, `503 HOST_STRIPE_UNAVAILABLE`.
- **Depende de:** 030 (`HostOnboardingPanel` em `widgets/host-onboarding`, etapa 1), 004 (casca, `requireRole`), 003 (BFF, erros).
- **Usada por:** 044 (só abre com `payoutsEnabled`), 057 (ganhos, futuro).

## Histórias

- Como anfitrião aprovado, quero entender como e quando recebo antes de passar meus dados bancários.
- Como anfitrião, quero fazer o cadastro de recebimento sem sair da PetHost e voltar depois se parar no meio.
- Como anfitrião, quero saber o que falta quando o Stripe pede algo, sem jargão.

## Critérios de aceite

| ID             | Critério                                                                                                                                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| REQ-PAYOUT-001 | `/host/payments` DEVE exigir conta de anfitrião; o prefetch de `GET /hosts/me/stripe-account` chega hidratado, sem loader no primeiro acesso                                                                                                                                                     |
| REQ-PAYOUT-002 | SE a API responder `404 HOST_NOT_FOUND`, O SISTEMA DEVE mostrar "Primeiro a gente confere quem você é. Depois é aqui que você diz como quer receber." com o link "Ver minha verificação" (`/host/application`), sem tratar como erro                                                             |
| REQ-PAYOUT-003 | QUANDO `status` for `not_started`, a tela DEVE explicar, antes de qualquer cadastro: "O tutor paga antes. A PetHost guarda o dinheiro e te passa 90% quando o pet volta pra casa." e oferecer o botão "Cadastrar como eu recebo"                                                                 |
| REQ-PAYOUT-004 | QUANDO a pessoa escolher cadastrar (ou continuar, em `in_progress` e `restricted`), O SISTEMA DEVE pedir `POST …/onboarding-session` e montar o componente embutido `account-onboarding` com a `publishableKey` e o `clientSecret` recebidos, só em memória (nunca storage, URL, log ou Zustand) |
| REQ-PAYOUT-005 | O componente embutido DEVE usar a Appearance gerada dos tokens do tema Quintal (`toStripeAppearance(theme)`, função pura testada): cores de fundo, texto, ação primária, borda, raio e fonte                                                                                                     |
| REQ-PAYOUT-006 | QUANDO o Stripe pedir uma sessão nova (sessão vencida ou recarregada), O SISTEMA DEVE pedir outra `onboarding-session` sem perder a tela; segredo vencido nunca é reaproveitado                                                                                                                  |
| REQ-PAYOUT-007 | QUANDO o componente avisar que a pessoa saiu ou terminou (`onExit`), O SISTEMA DEVE chamar `POST …/synchronization`, gravar a resposta no cache e mostrar a situação nova                                                                                                                        |
| REQ-PAYOUT-008 | Cada situação DEVE ter um estado próprio (ver "Estados da tela"); `restricted` mostra o que falta em linguagem simples (`disabledReason` → frase), e `rejected` não oferece cadastro, só o contato do suporte                                                                                    |
| REQ-PAYOUT-009 | QUANDO `status` for `enabled`, a tela DEVE mostrar "Recebimento conectado ✓" e o próximo passo "Montar meu cantinho" (`/host/listings/new`, 044); a etapa 2 do `HostOnboardingPanel` fica concluída                                                                                              |
| REQ-PAYOUT-010 | SE o componente embutido não carregar (script do Stripe bloqueado ou falha de rede), O SISTEMA DEVE oferecer "Abrir o cadastro no site do Stripe", que pede `POST …/onboarding-link` e navega para a `url` (uso único)                                                                           |
| REQ-PAYOUT-011 | QUANDO a pessoa voltar do Stripe para `/host/payments?stripe=retorno` ou `?stripe=renovar`, O SISTEMA DEVE sincronizar a conta uma vez, tirar o parâmetro da URL (`router.replace`) e, em `renovar`, oferecer continuar o cadastro                                                               |
| REQ-PAYOUT-012 | Erros DEVEM virar frase da PetHost (`errorCopy`): `HOST_STRIPE_UNAVAILABLE` ("O Stripe não respondeu agora. Tenta de novo em alguns minutos."), `HOST_STRIPE_REQUEST_REJECTED`, `HOST_STRIPE_ONBOARDING_NOT_ALLOWED`, `HOST_STRIPE_ACCOUNT_REJECTED`, `HOST_STRIPE_ACCOUNT_ALREADY_EXISTS`       |
| REQ-PAYOUT-013 | O `HostOnboardingPanel` (030) DEVE mostrar a etapa 2 com a situação real: travada sem verificação, "Agora" em `not_started`/`in_progress`/`restricted`, "O Stripe está conferindo" em `under_review`, concluída em `enabled`                                                                     |

## Estados da tela

| Estado                                 | O que aparece                                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Sem verificação (`404 HOST_NOT_FOUND`) | Frase do REQ-002 + "Ver minha verificação"                                                                                                |
| `not_started`                          | Explicação dos 90% + "Cadastrar como eu recebo"                                                                                           |
| Cadastro aberto                        | Componente embutido do Stripe, com "Voltar pro painel" acima                                                                              |
| `in_progress`                          | "Seu cadastro de recebimento ficou pela metade." + "Continuar"                                                                            |
| `under_review`                         | "O Stripe está conferindo seus dados. Leva até 2 dias úteis." + "Atualizar" (sincroniza)                                                  |
| `restricted`                           | "O Stripe precisa de mais uma coisa: {frase}." + "Resolver agora" (abre o componente)                                                     |
| `enabled`                              | "Recebimento conectado ✓" + "Montar meu cantinho"                                                                                         |
| `rejected`                             | "O Stripe não aprovou o recebimento dessa conta. Fala com a gente pra entender o que aconteceu." (sem cor de erro, sem botão de cadastro) |
| Stripe fora do ar                      | `Notice` com a frase de `HOST_STRIPE_UNAVAILABLE` e "Tentar de novo"                                                                      |

## Microcopy

| Lugar            | Texto                                                                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Título           | "Como você recebe"                                                                                                                                                                                     |
| Explicação       | "O tutor paga antes. A PetHost guarda o dinheiro e te passa 90% quando o pet volta pra casa." · "Quem cuida dos pagamentos é o Stripe, a mesma empresa que muitos apps usam."                          |
| Botões           | "Cadastrar como eu recebo" · "Continuar" · "Resolver agora" · "Atualizar" · "Montar meu cantinho" · "Abrir o cadastro no site do Stripe" · "Voltar pro painel"                                         |
| `disabledReason` | `requirements.past_due` e `requirements.pending_verification` → "confirmar alguns dados"; `requirements.*` desconhecido → "terminar alguns dados do cadastro"; outros → frase genérica de `restricted` |

## Acessibilidade e responsividade

- O componente do Stripe fica numa região com título ("Cadastro de recebimento"); ao abrir, o foco vai para esse título.
- Botões de 56 px no celular; uma coisa por tela.
- Estados anunciados com `role="status"` ao mudar depois da sincronização.

## Fora do escopo

- Pagamento do tutor, repasse e ganhos (051, 057).
- Painel de pagamentos do Stripe (`payouts`, `balances`): só o onboarding.
- Trocar de conta conectada (pelo suporte) e a nova chance do admin (`stripe-account-reset`, 032).

## Perguntas em aberto

- **URL de retorno:** o backend usa por padrão `/anfitriao/recebimentos?stripe=retorno`; o front usa `/host/payments`. Configurar `STRIPE_CONNECT_RETURN_URL` e `STRIPE_CONNECT_REFRESH_URL` no ambiente do backend para `/host/payments?stripe=retorno|renovar`.
- **`rejected`** aparece no texto do módulo, mas a descrição do campo no OpenAPI lista só cinco situações; o mapper aceita `rejected` e trata valor desconhecido como `CONTRACT_MISMATCH`.
