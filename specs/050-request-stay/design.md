---
spec: 050-request-stay
status: in-progress
updated: 2026-10-15
---

# 050 · Design técnico

- Rota `app/(account)/listings/[listingId]/request/page.tsx`: `requireRole(["owner"], …)` (anfitrião cai no estado do REQ-001, não no 403); prefetch do cantinho (`getPublicListing` da 042, pela página) e dos pets do tutor; `RequestStayScreen`.
- Feature nova `features/bookings` (também da 052 a 054): `api/contracts.ts` (`bookingDtoSchema` com `status` estreitado em `BookingStatus`, `contact` opcional), `toBooking`, `bookingQueries` (`all`, `mine(filters)`, `detail`), `api/client/bookingMutations.client.ts` (`requestBooking`; depois aceitar, recusar, cancelar, check-in e check-out), `hooks/useRequestBooking`, `lib/bookingCopy.ts`, `lib/formatStay.ts` (período, prazo em Brasília), `lib/bookingErrorDetail.ts` (lê do `details` da API a data ou a noite citada no erro).
- `RequestStayForm` (client): RHF + `requestStaySchema` (datas com `stayRules`, `petIds` 1 a 10); `PetPickCards` recebe os pets e o resultado de `petFitsListing` por prop (a página compõe; sem import entre features).

## Matriz de testes

| REQ                     | Nível                    | Arquivo                                                                             |
| ----------------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| 002/003                 | Unitário                 | `requestStaySchema.test.ts`, total e período                                        |
| 006                     | Unitário                 | `formatStay.test.ts` (prazo em Brasília, "amanhã")                                  |
| 007                     | Unitário                 | `bookingErrorDetail.test.ts`                                                        |
| 002/004/005/007/008/009 | Integração (jsdom)       | `RequestStayForm.int.test.tsx` (MSW: um POST só, erros no lugar certo, invalidação) |
| 001                     | Componente               | anfitrião vê a troca de conta                                                       |
| todos                   | Storybook + E2E simulado | `e2e/mocked/bookings/request.spec.ts` (busca → cantinho → pedido enviado)           |

## Como ficou na implementação (15/10/2026)

- **Base de `bookings`** já existia (053): a 050 acrescentou `requestBooking` (cliente), `useRequestBooking` (sem nova tentativa automática; grava o pedido no detalhe e invalida `bookingQueries.all`), `lib/requestStay.ts` (`requestStaySchema(today)`, `toRequestBookingBody`, `requestStayErrorMessage`) e o `bookingCopy.request`.
- **Rota** `app/(account)/listings/[listingId]/request/page.tsx`: `requirePersonalUser` (as duas contas entram no grupo); anfitrião vê `RequestStayHostNotice` (recado e "Trocar de conta"), não o 403. Id que não é UUID vira 404 antes da sessão. O cantinho vem do `getListingPageDetail` da 042 (indisponível vira o 404 dela) e os pets do `petQueries.mine`.
- **Composição sem import entre features:** `RequestStayComposer` (cliente, na pasta da rota) calcula "combina" com o `petFitsListing` e o total com o `stayTotal` da 042 e passa ao `RequestStayForm` por prop. Fica na rota porque funções não passam do servidor ao cliente.
- **Formulário:** RHF com `requestStaySchema` (datas pelo `validateStay` do `stayRules`, exigindo as duas; 1 a 10 pets). `DateRangeField` da 041. `PetPickCards` (checkbox nativo em cartão; o que não combina fica travado com o motivo). O checklist "Combinou de levar?" é só estado da tela.
- **Envio único:** botão ocupado e uma trava contra o clique duplo antes do botão travar.
- **Erros:** `400` volta ao campo (`applyFieldErrors`); regra (`422`/`409`/`404`) vira `Notice` no topo. A data do dia fechado e da noite cheia sai da mensagem da API (`bookingErrorDetail`, a API não manda `details`), e o pet em conflito sai do id citado. `BOOKING_LISTING_NOT_FOUND` ganha "Voltar pra busca".
- **Pedido enviado:** troca o formulário, com o foco no título, o prazo em Brasília (`formatDeadline`) e os caminhos "Ver minhas estadias" e "Voltar pra busca".
- **Desvio:** o período usa o `formatPeriod` curto das outras telas ("20 a 25 de dez. · 5 noites"), não o mês por extenso do exemplo.
- **Shared unificado no merge com a 042:** `shared/lib/money` (uma implementação) e `shared/lib/date/stayRules` (`brasiliaToday` em UTC−3 fixo, como o `BookingClock`; `addDays` com validação, `nightsBetween` e `validateStay` da 041).
- **Mock do E2E:** `POST /bookings` na ordem da seção 4 (campos, cantinho, pets do tutor e ativos, espécie e porte, conflito do pet, dia da semana com a data na mensagem; sem capacidade). O cantinho do mock da 042 passou a receber de segunda a sábado (`publicListing` exportado), e o mock de pets exporta `petsOfAccount`. O `GET /listings/:id` do mock do anfitrião (044) só responde o cantinho do próprio anfitrião e deixa os outros para o mock público.
