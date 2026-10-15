---
spec: 053-host-requests
status: in-progress
updated: 2026-10-15
---

# 053 · Design técnico

- Rotas `app/(host)/host/bookings/page.tsx` e `…/[bookingId]/page.tsx` (`requireRole(["host"])`, prefetch, `HydrationBoundary`).
- Feature `bookings`: `HOST_TABS`, `HostBookingList`, `HostBookingDetail`, `AcceptDialog`, `DeclineDialog` (`ConfirmDialog` + `ReasonChips`), `useAcceptBooking`, `useDeclineBooking`, `useCancelBooking` (da 052), `isDeadlineNear(deadline, now)` (pura).
- Ficha dos pets: a feature bookings não importa a pets. Um widget `widgets/booking-pet-profiles` compõe `PetProfileCard` (exportar pelo índice client de pets) com uma query de leitura `petQueries.detail` aberta a pets alheios (a 022 já tem `toPetDetail`; a chave fica sob a conta que lê). O widget recebe os ids do pedido.

## Matriz de testes

| REQ             | Nível                    | Arquivo                                                                                    |
| --------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| 002             | Unitário                 | `isDeadlineNear.test.ts`                                                                   |
| 003             | Integração (jsdom)       | widget com uma ficha falhando                                                              |
| 004/005/006/008 | Integração (jsdom)       | `HostBookingDetail.int.test.tsx`                                                           |
| 001             | Integração (jsdom)       | abas e contador                                                                            |
| todos           | Storybook + E2E simulado | `e2e/mocked/bookings/host-requests.spec.ts` (pedido do tutor da 050 aceito pelo anfitrião) |

## Como ficou na implementação (15/10/2026)

- **Base de `features/bookings` (para 050, 052, 053 e 054):** `bookingDtoSchema` e `bookingPageSchema` (status estreitado, maiúsculas aceitas), `toBooking` (valores em centavos, contato só depois da confirmação), `bookingQueries` (`all`, `lists`, `mine({ statuses, page })`, `detail`), `bookingMutations.client` (aceitar, recusar, cancelar, chegada, volta) e hooks que gravam a resposta, invalidam todas as listas e recarregam quando a reserva mudou. Em `lib`: `statusLabel`, `HOST_TABS`/`hostTabOf`, `trailSteps` para o `StatusTimeline`, `formatPeriod`, `formatDeadline` e `isDeadlineNear` (Brasília), `bookingErrorDetail` (a data só vem na mensagem da API, sem `details`) e `describeBookingPet`. As frases `BOOKING_*` estão no `errorCopy`.
- **Shared:** `shared/lib/date/stayRules` com `brasiliaToday` (UTC−3 fixo, como o `BookingClock`) e `addDays`. O `ConfirmDialog` ganhou `children` (motivo e chips da recusa).
- **Ficha dos pets:** o widget `booking-pet-profiles` compõe o `PetProfileCard` (agora exportado pelo `index.client` de pets) com `petQueries.detail` (agora no `index` neutro). A página do detalhe monta o widget e o passa à tela, porque a feature `bookings` não importa `pets`.
- **Abas e paginação na URL:** `?aba=` e `?pagina=`. O painel `/host` mostra "{n} pedidos esperando resposta" (`WaitingRequestsSummary`); se a contagem falhar, vale zero.
- **Sem `StayTrail`, `ContactCard` nem `CancelStayDialog` da 052** (que não existe ainda): o `StatusTimeline` com `trailSteps` faz a trilha, e o contato e o cancelamento do anfitrião ficam no detalhe.
