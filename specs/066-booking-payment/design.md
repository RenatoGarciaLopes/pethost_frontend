---
spec: 066-booking-payment
status: approved
updated: 2026-10-23
---

# 066 · Design técnico

## Arquitetura e reutilização

Estender `src/features/bookings/`, sem feature paralela para a mesma reserva. A rota owner valida UUID, aguarda `connection()` e usa `requireRole`, conforme as rotas existentes e a documentação Next local antes da implementação. A composição de servidor prepara reserva/pagamento; fronteira client administra checkout. Entradas públicas ficam nos índices existentes, somente quando consumidas.

Recursos descobertos no catálogo e conferidos no código: `bookingQueries`, `bookingDtoSchema`, `bookingPaths`, `StayDetail`, `OWNER_TABS` (já inclui accepted), `StatusTimeline`, `formatPeriod`, `formatDeadline`, `formatBRL`, `toCents`/`fromCents`, `Notice`, `ErrorState`, `Announcer`, `bffClient`, `HttpTransport`, `unwrapData`, `accountQueryKey`, `getErrorMessage` e `applyFieldErrors`. Não duplicar tradução, cliente HTTP, providers ou formatadores.

Recursos novos planejados (nomes/path definitivos serão conferidos contra a implementação):

- `api/paymentContracts.ts`: schemas de dados extraídos dos quatro envelopes gerados BookingPayment; tipos inferidos, status estreitados e limites de plano conforme contrato.
- `api/paymentQueries.ts`: query account-scoped do pagamento, transporte injetável para servidor/testes.
- `api/client/paymentMutations.client.ts`: escolher plano, abrir sessão e sincronizar, usando transporte existente.
- `hooks/useBookingPayment.ts`: coordena seleção, sessão, retorno, invalidação de pagamento/reserva/listas e proteção contra envios concorrentes.
- `lib/paymentCopy.ts`: copy centralizada exclusiva do fluxo; sem catálogo de erros concorrente.
- `components/BookingPaymentScreen.tsx`: composição server da rota.
- `components/client/BookingPayment.tsx`: orquestração e `BookingPaymentView` com estados, plano, resumo, prazo, lembrete e sucesso; capa opcional recebida da rota por consulta existente de listing-page, com fallback.
- `components/client/StripePaymentForm.tsx`: fronteira do SDK, `Elements`, `PaymentElement`, `confirmPayment` e tratamento do retorno com `redirect: if_required` e URL de retorno na própria rota.
- `app/(owner)/owner/bookings/[bookingId]/payment/page.tsx`: metadata noindex e guarda owner.

`StayDetail` ganha entrada contextual em accepted e acesso a parcelas abertas. Mudança de trilha/rótulo só se necessária para não apresentar accepted como pagamento já confirmado. Privacidade de `ContactCard` preservada e testada.

## Contratos e segurança

| Operação | Uso |
| --- | --- |
| GET `/bookings/{bookingId}/payment` | Estado, opções, parcelas, valores e prazo. |
| PUT `/bookings/{bookingId}/payment` | `{ installmentCount }`; resposta substitui estado de pagamento. |
| POST `/bookings/{bookingId}/payment/installments/{installmentNumber}/payment-session` | Sessão Stripe: clientSecret, amount, lateFee, pixExpiresAt, paymentMethods. |
| POST `/bookings/{bookingId}/payment/synchronization` | Reconciliar; depois reler reserva. |

As quatro rotas aparecem em `bffRoutes` após o merge de dev; conferir testes de classificação e manter bloqueadas as demais sem consumidor. Não liberar ganhos/admin por conveniência. Schemas gerados nunca são editados manualmente.

Dinheiro da API em reais; usar conversão existente quando compor com Booking em centavos, sem recalcular plano. SDK recebe chave pública de teste do env; não usar a chave retornada pela sessão como fallback. Client secret existe apenas na memória do checkout; não desidratar sessão Stripe no prefetch. Nenhuma alteração no backend.

## Máquina de estados

Carregando → seleção de plano → abertura da sessão → checkout → enviando → aguardando confirmação → sincronizando → sucesso confirmado pela API. Erro recuperável retorna à operação apropriada. Reserva fechada ou prazo vencido bloqueia sessão. Sem chave, checkout não inicia. Reentrada e retorno do Stripe leem estado atual antes de criar sessão. Espera pode atualizar GET com intervalo limitado enquanto a página está visível; POST de sincronização em retorno/ação explícita, sem loop agressivo.

Status `active` permite pagar parcelas restantes; não significa quitação integral. `processing` impede tentativa duplicada. Não habilitar uma parcela posterior enquanto a anterior estiver em aberto. O servidor continua sendo autoridade para corrida/limite de prazo.

## Matriz de testes planejados

| REQ | Nível / casos | Arquivos previstos |
| --- | --- | --- |
| 003/004/005/011 | Unitário: schemas, elegibilidade, ordem, prazo limite, centavos e configuração ausente | `paymentContracts.test.ts`, `paymentState.test.ts` quando houver regra extraída |
| 001/002/006/010 | Funcional: CTA, resumo, lembrete, teclado, loading, sem foto e erro | `StayDetail.test.tsx`, `BookingPayment.test.tsx`, `StripePaymentForm.test.tsx` |
| 004/005/007/008/009/011 | Integração DOM/MSW: providers + HTTP + SDK simulado; plano válido/inválido, clique duplo, processing, 409, 422, 503, sync pendente e confirmação real do mock | `BookingPayment.int.test.tsx` |
| 001/005/009 | Integração Node: schemas, rotas permitidas, autorização e envelope do mock | suítes BFF existentes e `src/test/msw/bookingPaymentMock.int.test.ts` |
| 001 a 011 | E2E Playwright com backend e Stripe simulados: entrada por Minhas estadias, cartão/Pix, retorno, reload, expiração, falha e parcelas seguintes | `e2e/mocked/bookings/payment.spec.ts` |
| 002/010 | Stories por estado e prints 1440/390 comparados à prancha | stories ao lado dos componentes; `test-results/066/` |

Fixtures sintéticas em `src/test/fixtures/`; handlers no MSW existente e mock E2E em `e2e/support/handlers/`. SDK simulado somente pela infraestrutura de testes existente ou adaptador com isolamento verificável; produção sempre usa SDK real, sem flag pública que confirme pagamento fictício. E2E simulado não valida Stripe/banco reais; eventual E2E real depende de ambiente de teste e credenciais, com limitação registrada.

Funções triviais internas podem ser cobertas pela composição identificada. Não criar E2E separado para formatadores, pois a jornada já cobre sua composição e unidade cobre limites. Documentos não têm teste de comportamento; conferir links, paths e consistência.

## Documentação e validação

Na mesma entrega: TSDoc/interfaces, stories, nota do recurso, catálogo dos reutilizáveis, decisão sobre confirmação e parcelamento, linha do tempo e árvore/responsabilidades se a estrutura mudar. O coordenador autorizou edição direta no vault compartilhado em 2026-10-23. Não há pacote intermediário.

Executar suítes focadas pertinentes, `npx tsc --noEmit`, ESLint dos arquivos tocados e conferência visual. Dev próprio na 3177 (`next dev --webpack`); combinar 3100/5099 antes de usar os runners existentes. Sem npm install/ci, push ou PR. Registrar resultados reais e pendências; commits convencionais em português sem rodapé de atribuição.

Aprovada pelo coordenador em 2026-10-23: lembrete curto sem checkbox; edição direta do vault compartilhado autorizada, sem pacote intermediário. Erros usam helpers atuais, com futura tradução 090 por baixo.
