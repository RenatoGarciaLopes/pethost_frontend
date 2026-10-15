---
spec: 052-my-stays
status: draft
updated: 2026-10-15
area: STAYS
---

# 052 · Minhas estadias (tutor)

## Contexto

Depois de pedir, o tutor acompanha: esperando resposta, confirmada (com o contato e o endereço do cantinho), acontecendo, concluída, recusada, expirada ou cancelada. Pode cancelar até a chegada do pet ([[jornada-da-estadia]], `modulo-bookings.md` seções 1, 3.2 e 6).

## Referências

- **Design:** canvas → `Fluxo-Reserva` → "Minhas estadias" (trilha de status; estados Aceita, Em andamento, Concluída, Expirada).
- **API:** `GET /api/v1/bookings/me?status=&page=&pageSize=` (paginada, da chegada mais recente para a mais antiga); `GET /api/v1/bookings/{id}` (`contact` com telefone do anfitrião e endereço exato só em `confirmed`, `in_progress`, `completed`); `POST /api/v1/bookings/{id}/cancellation` `{ reason? }` (até o check-in; `refundPercentage` na resposta); erros `422 BOOKING_CANNOT_CANCEL_AFTER_CHECK_IN`, `BOOKING_ALREADY_CLOSED`, `BOOKING_ALREADY_CANCELLED`, `409 BOOKING_CONFLICT`, `404 BOOKING_NOT_FOUND`.
- **Depende de:** 050 (feature `bookings`), 022 (`ConfirmDialog`, `useFlashMessage`).

## Critérios de aceite

| ID            | Critério                                                                                                                                                                                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-STAYS-001 | `/owner/bookings` DEVE listar as estadias do tutor em abas: "Próximas" (`requested`, `confirmed`), "Acontecendo" (`in_progress`) e "Anteriores" (`completed`, `declined`, `expired`, `cancelled`), com a aba na URL; o primeiro carregamento vem do servidor                             |
| REQ-STAYS-002 | Cada item DEVE mostrar capa ou bairro do cantinho, título, período, pets (nomes), total e o status com `StatusPill` em texto ("Esperando resposta", "Confirmada", "Acontecendo", "Concluída", "Não aceita", "Expirou", "Cancelada"); o item é um link para o detalhe                     |
| REQ-STAYS-003 | A paginação DEVE ser "Mostrar mais" por aba; aba vazia tem frase própria ("Nenhuma estadia por vir. Bora procurar um cantinho?" com link para a busca)                                                                                                                                   |
| REQ-STAYS-004 | `/owner/bookings/{id}` DEVE mostrar a trilha Pedido → Confirmada → Chegou → Voltou pra casa com o passo atual, o resumo (cantinho, período, pets, conta do total) e, em `requested`, o prazo "{anfitrião} responde até {dia e hora}"                                                     |
| REQ-STAYS-005 | ENQUANTO a estadia estiver `confirmed`, `in_progress` ou `completed`, o detalhe DEVE mostrar o contato: telefone do anfitrião formatado (link `tel:`) e o endereço exato do cantinho; em qualquer outro status, nenhum dado de contato aparece                                           |
| REQ-STAYS-006 | "Cancelar estadia" DEVE aparecer só em `requested` e `confirmed`, com confirmação neutra que explica a regra: em `confirmed`, "Cancelando com 48 horas ou mais antes da chegada, o reembolso é total. Com menos, metade." (quando houver pagamento) e campo de motivo opcional (até 500) |
| REQ-STAYS-007 | QUANDO cancelar der certo, o detalhe DEVE mostrar "Estadia cancelada." e, se `refundPercentage` vier, "Reembolso de {n}%"; a lista é invalidada                                                                                                                                          |
| REQ-STAYS-008 | `declined` DEVE mostrar o motivo do anfitrião quando houver ("{anfitrião} não pôde receber dessa vez.") e "Procurar outro cantinho"; `expired`, "{anfitrião} não respondeu a tempo." com o mesmo caminho                                                                                 |
| REQ-STAYS-009 | `404 BOOKING_NOT_FOUND` DEVE mostrar o 404 da casca; `409 BOOKING_CONFLICT` recarrega o detalhe e avisa "A estadia mudou enquanto você olhava. Confere de novo."                                                                                                                         |

## Fora do escopo

Pagar (051), avaliar (056), conversa (055), "Fechado!".
