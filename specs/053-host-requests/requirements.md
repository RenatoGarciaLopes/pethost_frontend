---
spec: 053-host-requests
status: in-progress
updated: 2026-10-15
area: HREQ
---

# 053 · Pedidos e estadias do anfitrião

## Contexto

A Dona Cida recebe um pedido e precisa decidir em até 24h, sabendo **quem é o pet**: a API deixa o anfitrião ler a ficha completa dos pets do pedido ("lê a ficha antes de aceitar e durante a estadia"). Aceitar hoje já confirma (sem pagamento) e manda a ela o telefone do tutor; ao tutor, o endereço exato.

## Referências

- **Design:** canvas → `Fluxo-Anfitriao` → "Início do painel" e "Pedido com a ficha".
- **API:** `GET /api/v1/bookings/me` (do anfitrião: as dos cantinhos dele); `GET /api/v1/bookings/{id}`; `POST …/acceptance`; `POST …/refusal` `{ reason? }`; `POST …/cancellation` `{ reason? }`; `GET /api/v1/pets/{petId}` (ficha do pet do pedido, só enquanto o pedido é mostrado ao anfitrião). Erros: `422 BOOKING_NOT_AWAITING_RESPONSE`, `422 BOOKING_RESPONSE_EXPIRED`, `422 BOOKING_CAPACITY_EXCEEDED`, `422 BOOKING_OWNER_INACTIVE`, `403 BOOKING_HOST_DEACTIVATED`, `404 BOOKING_HOST_NOT_FOUND`, `409 BOOKING_CONFLICT`.
- **Depende de:** 050 e 052 (feature `bookings`, `bookingStatus`, `StayTrail`, `ContactCard`, `CancelStayDialog`), 022 (`PetProfileCard` pela composição em `widgets`), 044 (painel `/host`).

## Critérios de aceite

| ID           | Critério                                                                                                                                                                                                                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| REQ-HREQ-001 | `/host/bookings` DEVE listar em abas "Pedidos" (`requested`, com contador), "Próximas" (`confirmed`), "Acontecendo" (`in_progress`) e "Anteriores"; aba na URL; o painel `/host` mostra "{n} pedidos esperando resposta" com link                                                                                                                            |
| REQ-HREQ-002 | Cada pedido DEVE mostrar tutor (foto e nome), pets (nome, espécie e porte), período, total e o prazo "Responda até {dia e hora}" (`responseDeadline`, Brasília), com destaque quando faltar menos de 3 horas                                                                                                                                                 |
| REQ-HREQ-003 | `/host/bookings/{id}` DEVE mostrar a ficha completa de cada pet do pedido (saúde, rotina, manias e convivência), lida de `GET /pets/{petId}`; falha numa ficha não impede decidir e mostra "Não deu pra abrir a ficha de {nome} agora."                                                                                                                      |
| REQ-HREQ-004 | "Aceitar" DEVE confirmar com "Você recebe {pets} de {período}. O tutor recebe seu endereço e seu telefone." e, ao dar certo, mostrar "Estadia confirmada!" com o telefone do tutor (`contact`)                                                                                                                                                               |
| REQ-HREQ-005 | "Não posso receber" DEVE pedir confirmação neutra com motivo opcional (até 500; chips "Não estarei em casa", "Já estou com a casa cheia", "Esse pet não combina com os meus") e nenhuma cor de erro                                                                                                                                                          |
| REQ-HREQ-006 | Erros de decisão DEVEM virar frase: `BOOKING_RESPONSE_EXPIRED` ("O prazo de 24 horas passou e o pedido expirou."), `BOOKING_CAPACITY_EXCEEDED` ("Não cabe mais ninguém nessas noites."), `BOOKING_OWNER_INACTIVE` ("Esse tutor não está mais ativo. Dá pra recusar ou deixar expirar."), `BOOKING_NOT_AWAITING_RESPONSE` (recarrega e mostra o status atual) |
| REQ-HREQ-007 | Em `confirmed`, o anfitrião DEVE poder cancelar (confirmação: "O tutor recebe o valor de volta, inteiro.") e ver o contato do tutor                                                                                                                                                                                                                          |
| REQ-HREQ-008 | Toda decisão DEVE gravar a resposta no detalhe e invalidar as listas (as duas abas mudam)                                                                                                                                                                                                                                                                    |

## Fora do escopo

Check-in e check-out (054), conversa (055), ganhos (057).
