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
