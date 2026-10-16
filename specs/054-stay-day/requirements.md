---
spec: 054-stay-day
status: in-progress
updated: 2026-10-15
area: STDAY
---

# 054 · Chegou e voltou pra casa

## Contexto

No dia, a Dona Cida marca "A Pipoca chegou" e, no fim, "A Pipoca voltou pra casa" ([[13-estadia-chat-e-cartao-postal]], [[jornada-da-estadia]]). São os marcos da estadia: botões grandes, confirmação clara e uma pequena comemoração. Só o anfitrião marca.

## Referências

- **Design:** canvas → `Fluxo-Anfitriao` → "Dia da chegada" e "Em andamento" (botões XL com **Desfazer**; contatos de emergência).
- **API:** `POST /api/v1/bookings/{id}/check-in` (só `confirmed`, do dia da chegada até a véspera da saída) e `POST …/check-out` (só `in_progress`, pode ser antes do dia de saída). Erros: `422 BOOKING_NOT_CONFIRMED`, `BOOKING_CHECK_IN_TOO_EARLY`, `BOOKING_CHECK_IN_WINDOW_CLOSED`, `BOOKING_NOT_IN_PROGRESS`, `409 BOOKING_CONFLICT`.
- **Depende de:** 053 (detalhe do anfitrião), 052 (trilha do tutor).

## Critérios de aceite

| ID            | Critério                                                                                                                                                                                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-STDAY-001 | No detalhe do anfitrião, ENQUANTO a estadia estiver `confirmed` e hoje (Brasília) estiver entre a chegada e a véspera da saída, O SISTEMA DEVE mostrar o botão grande "{Pet} chegou" (com mais de um pet: "Os pets chegaram"); antes do dia, o texto "A chegada é {dia}." sem botão |
| REQ-STDAY-002 | Marcar a chegada DEVE pedir confirmação curta ("Confirmar que {pet} chegou?") e, ao dar certo, mostrar "{Pet} chegou! Boa estadia." com a porta fechando (respeita movimento reduzido) e o anúncio em `role="status"`                                                               |
| REQ-STDAY-003 | ENQUANTO `in_progress`, O SISTEMA DEVE mostrar o contato do tutor em destaque (emergência) e o botão grande "{Pet} voltou pra casa", disponível também antes do dia de saída                                                                                                        |
| REQ-STDAY-004 | Marcar a saída DEVE pedir confirmação e, ao dar certo, mostrar "{Pet} voltou pra casa. Obrigado por cuidar!" e a estadia em "Anteriores"                                                                                                                                            |
| REQ-STDAY-005 | "Desfazer" (do design) NÃO é possível na API: depois de confirmar, o marco é definitivo; a confirmação diz isso ("Depois de confirmar, não dá pra desfazer.")                                                                                                                       |
| REQ-STDAY-006 | Erros DEVEM virar frase: `BOOKING_CHECK_IN_TOO_EARLY` ("Ainda não é o dia da chegada."), `BOOKING_CHECK_IN_WINDOW_CLOSED` ("O período dessa estadia já passou."), `BOOKING_CONFLICT` (recarrega: "A estadia mudou enquanto você olhava.")                                           |
| REQ-STDAY-007 | O tutor DEVE ver o marco na trilha do detalhe (052): "Chegou" em `in_progress` e "Voltou pra casa" em `completed`                                                                                                                                                                   |
| REQ-STDAY-008 | `isCheckInWindow(checkIn, checkOut, today)` DEVE ser função pura testada com o "hoje" de Brasília (`stayRules`)                                                                                                                                                                     |

## Fora do escopo

Foto do dia e boletim (conversa, 055), repasse (057), avaliação (056).
