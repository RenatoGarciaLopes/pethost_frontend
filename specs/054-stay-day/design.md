---
spec: 054-stay-day
status: draft
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
