# 110 — Avatar do pet

Origem: pedido de Renato em 25/10/2026, brief `brief-110-avatar-do-pet.md`: substituir a ausência de foto por animais simpáticos, separando cães e gatos. A foto real conserva sua posição e dimensão. Não executar E2E nesta entrega: CI sob responsabilidade do solicitante.

- Foto disponível tem prioridade; foto quebrada também recebe desenho.
- Quatro cães e quatro gatos, escolhidos pelo id persistido, sem aleatoriedade.
- Grupos adicionais: aves (cockatiel/parrot/parakeet/canary), coelho, roedores (hamster/guinea_pig), peixe, tartaruga e outros (exotic/desconhecido).
- Nome acessível quando isolado; em controles com nome visível, avatar decorativo para evitar nomes duplicados.
- Desenhos locais, paleta do tema, contorno de tinta 2,4 px, sem gradientes nem dependência de CDN.
- Comparação e capturas em `test-results/110/`, com viewport 1440 e 390 px.

## Auditoria dos consumidores

| Lugar                  | Resultado                                                                      |
| ---------------------- | ------------------------------------------------------------------------------ |
| PetPickCards           | PetAvatar 48 px, espécie e id já disponíveis                                   |
| PetList                | Indiretamente por PetIdCard, inclusive inativos                                |
| PetIdCard              | PetAvatar 64 px substitui PawMark                                              |
| PetProfileCard         | PetAvatar 72 px; `petId` opcional, `draft` durante cadastro                    |
| PetProfile / PetEditor | Passam o id persistido à ficha                                                 |
| HouseResidents         | PetAvatar 64 px com espécie pública                                            |
| StayBookingCard        | PetAvatar 30 px; rota agora preserva espécie na projeção                       |
| StaySummary            | Chips 28 px com id/espécie; BookingPet não fornece foto, sem inventar URL      |
| Detalhe do anfitrião   | BookingPetProfiles passa id à mesma PetProfileCard                             |
| Conversas              | ConversationHeader e ConversationList mostram pessoas, não pets; nenhuma troca |

Não há novo serviço, schema, provider ou store. InitialsAvatar é destinado a pessoas e continua com esse limite.
