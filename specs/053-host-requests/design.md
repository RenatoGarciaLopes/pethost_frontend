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
