---
spec: 052-my-stays
status: in-progress
updated: 2026-10-15
---

# 052 · Design técnico

- Rotas `app/(owner)/owner/bookings/page.tsx` (aba em `?aba=`) e `app/(owner)/owner/bookings/[bookingId]/page.tsx`, com `requireRole(["owner"])`, prefetch e `HydrationBoundary`.
- Na feature `bookings` (da 050): `bookingQueries.mine({ statuses, page })` com `useInfiniteQuery`; `STAY_TABS` (aba → status); `StayList`, `StayListItem`, `StayDetail`, `StayTrail` (passos com `aria-current`), `ContactCard` (só com `contact`), `CancelStayDialog` (`ConfirmDialog` + motivo), `useCancelBooking`.
- `StayTrail` e o rótulo de status ficam em `features/bookings/lib/bookingStatus.ts` (`statusLabel`, `trailStep`), reaproveitados pela 053 e 054.
- `formatPhone` em `shared/lib/masks` (já existe máscara de telefone da 011; reusar).

## Matriz de testes

| REQ         | Nível                    | Arquivo                                                  |
| ----------- | ------------------------ | -------------------------------------------------------- |
| 001/002     | Unitário                 | `bookingStatus.test.ts` (abas, rótulos, passo da trilha) |
| 005         | Componente               | `StayDetail.test.tsx` (contato só nos status certos)     |
| 006/007/009 | Integração (jsdom)       | `CancelStayDialog.int.test.tsx`                          |
| 001/003     | Integração (jsdom)       | `StayList.int.test.tsx` (abas, mostrar mais, vazio)      |
| todos       | Storybook + E2E simulado | `e2e/mocked/bookings/my-stays.spec.ts`                   |
