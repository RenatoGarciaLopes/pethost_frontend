---
spec: 054-stay-day
status: in-progress
updated: 2026-10-15
---

# 054 · Design técnico

- Sem rota nova: o detalhe `/host/bookings/{id}` (053) ganha `StayMilestones` (client), e o detalhe do tutor (052) usa a trilha já existente.
- Feature `bookings`: `isCheckInWindow` (pura, em `lib/stayMilestones.ts`, usa o "hoje" de Brasília de `shared/lib/date/stayRules`), `useCheckIn`, `useCheckOut` (gravam a resposta e invalidam as listas), `MilestoneButton` (botão XL, 64 px, ocupado durante o envio), `MilestoneDone` (comemoração curta com a porta da marca; sem movimento com `prefers-reduced-motion`).

## Matriz de testes

| REQ             | Nível                    | Arquivo                                                                              |
| --------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| 001/008         | Unitário                 | `stayMilestones.test.ts` (véspera da saída, dia da chegada, fuso de Brasília às 23h) |
| 002/004/005/006 | Integração (jsdom)       | `StayMilestones.int.test.tsx`                                                        |
| 003             | Componente               | contato em destaque em `in_progress`                                                 |
| todos           | Storybook + E2E simulado | `e2e/mocked/bookings/stay-day.spec.ts` (relógio do navegador fixo no dia da chegada) |

## Como ficou na implementação (15/10/2026)

- `checkInWindow` (`"early" | "open" | "closed"`) e `isCheckInWindow` em `features/bookings/lib/stayMilestones.ts`, com o dia de hoje de `shared/lib/date/stayRules` (`brasiliaToday`, UTC−3 fixo, criado na 053).
- `StayMilestones` fica no próprio detalhe do anfitrião (mesma feature, sem passar pela página). O botão grande, a confirmação e a comemoração estão no mesmo componente. A comemoração usa a porta da marca (`DoorScene`): ela fecha na chegada (o pet está dentro) e abre na volta. O `DoorScene` já para com movimento reduzido.
- "Desfazer" não existe na API: a confirmação diz "Depois de confirmar, não dá pra desfazer.".
- A trilha do tutor (REQ-STDAY-007) está pronta em `trailSteps` ("Chegou", "Voltou pra casa"), com teste. A tela do tutor é da 052.
- E2E: o pedido é semeado com a chegada no dia de hoje em Brasília. Assim o relógio do navegador e o do mock concordam, sem fixar o relógio.
