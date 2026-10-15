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
| 001/009     | Integração (Node)        | `src/test/msw/bookingsMock.int.test.ts` (mock do tutor)  |
| 001/004     | Unitário                 | `page.test.ts` das duas rotas (título e noindex)         |

## Como ficou na implementação (15/10/2026)

- **Rotas:** `/owner/bookings` (`?aba=proximas|acontecendo|anteriores`, aba desconhecida vira Próximas) e `/owner/bookings/{id}` (id que não é UUID vira 404 antes da sessão). As duas esperam a requisição (`connection()`) antes de `requireRole("owner")`, como as do anfitrião.
- **Telas de servidor** em `index.server`: `OwnerStaysScreen` (prefetch da primeira página com `prefetchInfiniteQuery`) e `OwnerStayDetailScreen` (`getBookingDetail` da 053: de outra conta ou inexistente vira o 404 da casca).
- **Lista:** `bookingQueries.infinite(accountId, statuses, pageSize?)` com `useInfiniteQuery` e "Mostrar mais", em vez de `mine({ page })`. `OWNER_TABS`/`ownerTabOf` ao lado de `HOST_TABS`. Cada item é um link cujo nome é o próprio texto visível (sem `aria-label`, para quem usa comando de voz).
- **Detalhe:** a trilha é o `StatusTimeline` com `trailSteps` (sem `StayTrail` próprio); o contato do anfitrião é um bloco interno do `StayDetail` (sem exportar `ContactCard`), só em `confirmed`, `in_progress` e `completed`, mesmo se a API mandar em outro status. Telefone com `maskPhone` (não `formatPhone`) e `tel:`; CEP com `maskCep`.
- **Cancelar:** `CancelStayDialog` com `useCancelBooking` da 053 e `mutateAsync`: a estadia cancelada deixa de ser cancelável e o diálogo some, então "Estadia cancelada." e o reembolso vêm do próprio status. Na estadia mudada (409) o aviso sobe para o detalhe (`onConflict`).
- **Desvio:** a frase da regra do reembolso (48 horas) fica fora da confirmação até existir pagamento (051); o "Reembolso de {n}%" aparece quando a API manda `refundPercentage`.
- **Rótulos:** `declined` virou "Não aceita" e `expired` virou "Expirou" (vale também para o anfitrião); `accepted` ganhou "Aceita".
- **Shared:** o `ConfirmDialog` só devolve o foco à ação segura ao terminar de abrir se a pessoa ainda não foi a um campo do corpo; antes, quem digitava o motivo rápido perdia letras.
- **Mock do E2E:** `seedBooking(hostUserId, overrides, ownerUserId?)` e `POST /__e2e/bookings { hostUserId?, ownerUserId?, booking }`; lista e detalhe valem para quem participa; aceitar, recusar, chegada e volta só para o anfitrião (o tutor recebe 404); cancelar dos dois lados, com `cancelledBy`, motivo e o reembolso do tutor pela regra das 48 horas.
