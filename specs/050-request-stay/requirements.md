---
spec: 050-request-stay
status: draft
updated: 2026-10-15
area: REQST
---

# 050 · Pedir estadia

## Contexto

O tutor escolheu o cantinho (042) e pede a estadia. O pedido **não segura vaga**: o anfitrião tem 24h para responder e é o aceite que ocupa a vaga ([[jornada-da-estadia]], `modulo-bookings.md` seções 4 e 5). Hoje, **aceitar já confirma** (o pagamento ainda não existe).

## Referências

- **Design:** canvas → `Fluxo-Reserva` → "Pedir estadia" e "Pedido enviado" (checklist de ração e remédio antes de pedir). Vault: `produto/jornada-da-estadia.md`, `design/12-pagamento-e-fechado.md` (o "Fechado!" é da 051).
- **API:** `POST /api/v1/bookings` `{ listingId, petIds (1 a 10), checkIn, checkOut }` (datas `yyyy-MM-dd`), resposta `BookingResponse` com `status: requested`, `nights`, `petCount`, `nightlyRate`, `totalPrice`, `responseDeadline`. Erros na ordem da seção 4: `400` (campos e período), `404 BOOKING_OWNER_NOT_FOUND`, `403 BOOKING_OWNER_DEACTIVATED`, `404 BOOKING_LISTING_NOT_FOUND`, `404 BOOKING_PET_NOT_FOUND`, `422 BOOKING_PET_INACTIVE`, `422 BOOKING_PET_SPECIES_NOT_ACCEPTED`, `422 BOOKING_PET_SIZE_NOT_ACCEPTED`, `409 BOOKING_PET_PERIOD_CONFLICT`, `422 BOOKING_WEEKDAY_NOT_AVAILABLE` (com a data), `422 BOOKING_CAPACITY_EXCEEDED` (com a noite).
- **Depende de:** 042 (cantinho, `petFitsListing`), 041 (`stayRules`, `DateRangeField`), 020 (pets do tutor), 044 (`formatBRL`).

## Critérios de aceite

| ID            | Critério                                                                                                                                                                                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-REQST-001 | `/listings/{id}/request` DEVE exigir conta de **tutor**; anfitrião vê "Pra pedir uma estadia, entra com a conta de tutor." com a troca de conta (014)                                                                                                                         |
| REQ-REQST-002 | A tela DEVE vir preenchida com datas e pets da URL e permitir mudar: datas com as regras de `stayRules`; pets ativos do tutor como cartões marcáveis (1 a 10), cada um com "Combina" ou o motivo de não combinar (`petFitsListing`); pet que não combina não pode ser marcado |
| REQ-REQST-003 | O resumo DEVE mostrar cantinho (capa, título, bairro), período ("20 a 25 de dezembro · 5 noites"), pets e o total `diária × noites × pets` com a conta visível ("R$ 60,50 × 5 noites × 2 pets")                                                                               |
| REQ-REQST-004 | Antes de enviar, o checklist "Combinou de levar?" DEVE lembrar ração e remédio (marcações só na tela, não vão para a API e não bloqueiam o envio) e a frase "O pedido não segura a vaga: {anfitrião} tem até 24 horas pra responder."                                         |
| REQ-REQST-005 | "Pedir estadia" DEVE mandar `POST /bookings` uma vez (botão ocupado, sem repetir em clique duplo)                                                                                                                                                                             |
| REQ-REQST-006 | QUANDO der certo, O SISTEMA DEVE mostrar "Pedido enviado!" com o prazo de resposta (`responseDeadline` em horário de Brasília: "{anfitrião} responde até amanhã às 14h") e os caminhos "Ver minhas estadias" (052) e "Voltar pra busca"                                       |
| REQ-REQST-007 | Erros de campo do `400` DEVEM voltar ao campo (datas, pets); os `422`/`409` de regra DEVEM virar frase da PetHost no topo do formulário, com o dado que a API manda (a data do dia fechado, a noite sem vaga, o pet em conflito)                                              |
| REQ-REQST-008 | `BOOKING_LISTING_NOT_FOUND` DEVE dizer "Esse cantinho não está recebendo pedidos agora." com "Voltar pra busca"                                                                                                                                                               |
| REQ-REQST-009 | A lista de estadias (`bookingQueries.all`) DEVE ser invalidada depois do pedido                                                                                                                                                                                               |

## Microcopy

Título "Pedir estadia" · "Quem vai?" · "Combinou de levar?" ("A ração de costume", "Os remédios e como dar") · "Pedir estadia" · "Pedido enviado!" · erros (para o `errorCopy`):

- `BOOKING_PET_PERIOD_CONFLICT`: "Esse pet já tem outra estadia nessas datas."
- `BOOKING_WEEKDAY_NOT_AVAILABLE`: "O cantinho não recebe em {dia}. Tenta outras datas."
- `BOOKING_CAPACITY_EXCEEDED`: "Não tem vaga pra todos na noite de {data}. Tenta outras datas ou menos pets."
- `BOOKING_PET_SPECIES_NOT_ACCEPTED` / `…SIZE…`: "Esse cantinho não recebe {espécie ou porte}."
- `BOOKING_PET_INACTIVE`: "Esse pet está fora da sua lista. Volta ele pra lista pra pedir."
- `BOOKING_OWNER_DEACTIVATED`: "Sua conta de tutor está pausada."

## Fora do escopo

Pagamento e "Fechado!" (051: sem módulo de pagamento). Conversa (055).
