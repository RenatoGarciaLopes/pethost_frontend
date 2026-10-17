---
spec: 041-search
status: in-progress
updated: 2026-10-15
area: SRCH
---

# 041 · Busca de cantinhos

## Contexto

O tutor procura quem cuide do pet perto de casa, nas datas da viagem ([[11-busca-e-cards]], [[15-estados-com-e-sem-pet]]). A busca da API é **para conta logada** e, sem lugar, procura num raio em volta do **endereço da conta** ("perto de casa"). Com datas, só vêm cantinhos com vaga em todas as noites. A ordem é fixa: por distância (com raio) ou do mais novo (só lugar).

## Referências

- **Design:** canvas → `Busca-Mapa` (computador, celular em lista, celular em mapa) e `Quintal-Casas` (cards). Vault: `design/11-busca-e-cards.md`, `design/15-estados-com-e-sem-pet.md`, `design/14-loading.md` ("Farejando cantinhos…").
- **API** (`modulo-listings.md` seção 5; implementada): `GET /api/v1/listings` com `radiusKm` (5 a 50, padrão 10), `latitude`+`longitude`, `state`, `city`, `neighborhood`, `species`, `sizes`, `weekdays`, `minNightlyRate`, `maxNightlyRate`, `minCapacity`, `hasYard`, `homeType`, `hasDogs`, `hasCats`, `hasKids`, `checkIn`+`checkOut`, `pets`, `page`, `pageSize`. Item: `ListingSummaryResponse` (`distanceKm` só com raio, `coverPhotoUrl`, `badges`: `neighbor`, `fast_responder`, `yard`, `experienced`). Erros: `400` por filtro, `422 LISTING_SEARCH_ADDRESS_REQUIRED`, `422 LISTING_SEARCH_ADDRESS_NOT_LOCATED`, `503 LISTING_GEOCODER_UNAVAILABLE`.
- **Depende de:** 020 (pets do tutor, para "Pet"), 044 (`formatBRL`, `NumberStepper`), 003, 004.
- **Usada por:** 040 (home leva para cá), 042 (card leva ao cantinho com as datas e os pets).

## Histórias

- Como tutor, quero ver os cantinhos com vaga perto de casa nas datas da viagem.
- Como tutor, quero filtrar pelo que importa para o meu pet (aceita gato, porte grande, casa com quintal, sem criança).
- Como tutor que vai viajar para outra cidade, quero procurar lá.

## Critérios de aceite

| ID           | Critério                                                                                                                                                                                                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-SRCH-001 | `/search` DEVE exigir conta de tutor ou anfitrião (a API exige login); visitante vai para `/login?next=` com a busca preservada                                                                                                                                                                                                                                                       |
| REQ-SRCH-002 | O estado da busca DEVE viver na URL (`where`, `from`, `to`, `pets` como ids dos pets do tutor, `radius` e os filtros), lido e escrito por um único parser testado (`searchParamsToQuery`/`queryToSearchParams`); voltar e recarregar repetem a mesma busca                                                                                                                            |
| REQ-SRCH-003 | O campo de reserva DEVE ter rótulos visíveis: Onde (vazio = "Perto de casa"; texto = cidade e, opcional, bairro), Chegada, Saída e Pet; datas seguem as regras da API (de hoje a 365 dias, saída depois, até 30 noites) e o erro aparece no campo antes de buscar                                                                                                                     |
| REQ-SRCH-004 | "Pet" DEVE oferecer os pets ativos do tutor (020); escolher pets manda `pets` (quantos), `species` (as espécies escolhidas) e `sizes` (os portes informados), e o título diz "Cantinhos que recebem {nomes}"                                                                                                                                                                          |
| REQ-SRCH-005 | O título DEVE dizer a contagem na voz da marca: "{n} cantinhos com vaga perto de casa" (raio) ou "{n} cantinhos em {cidade}" (lugar); com datas, "com vaga" só quando `checkIn` vier                                                                                                                                                                                                  |
| REQ-SRCH-006 | Chips de filtro: "Casa com quintal" (`hasYard=true`), "Sem criança" (`hasKids=false`), "Sem cachorro" (`hasDogs=false`), "Sem gato" (`hasCats=false`), "Casa" e "Apartamento" (`homeType`), "Até R$ {x} a diária" (`maxNightlyRate`); ativo fica grama; "Limpar filtros" quando houver algum                                                                                          |
| REQ-SRCH-007 | Cada card DEVE ser um link único para `/listings/{id}` levando datas e pets na URL, com capa 4:3, aba do anfitrião (avatar e nome; empresa pelo nome fantasia), título, bairro e cidade, distância ("a 1,4 km", só com raio), os selos traduzidos (Vizinho, Responde rápido, Casa com quintal, Experiente) e o preço: diária por pet ou, com datas e pets, o total "R$ X as N noites" |
| REQ-SRCH-008 | ENQUANTO a busca carrega depois de mudar um filtro, a lista anterior fica visível e a faixa "Farejando cantinhos…" aparece (o corgi atravessa uma vez; sem movimento com movimento reduzido); a primeira carga vem do servidor, sem loader                                                                                                                                            |
| REQ-SRCH-009 | A paginação DEVE ser "Mostrar mais cantinhos" (`page + 1`, acumulando), sem rolagem infinita automática                                                                                                                                                                                                                                                                               |
| REQ-SRCH-010 | Vazio ou fim de lista com raio DEVE oferecer "Bora olhar até {raio maior} km" (10 → 20 → 50); sem raio maior, "Tenta outras datas ou tira um filtro."                                                                                                                                                                                                                                 |
| REQ-SRCH-011 | SE vier `LISTING_SEARCH_ADDRESS_REQUIRED` ou `…_NOT_LOCATED`, O SISTEMA DEVE explicar ("Pra procurar perto de casa, a gente precisa do seu endereço.") com o link para `/users/profile` e oferecer procurar por cidade                                                                                                                                                                |
| REQ-SRCH-012 | Erros `400` dos filtros DEVEM voltar ao campo da busca correspondente; `503` mostra `Notice` com "Tentar de novo" mantendo a lista anterior                                                                                                                                                                                                                                           |
| REQ-SRCH-013 | O mapa (Leaflet + OpenStreetMap, pino por bairro com o preço) é OPCIONAL nesta entrega; sem ele, nada da lista depende do mapa                                                                                                                                                                                                                                                        |

## Estados da tela

| Estado         | O que aparece                               |
| -------------- | ------------------------------------------- |
| Primeira carga | Lista vinda do servidor                     |
| Atualizando    | Lista anterior + "Farejando cantinhos…"     |
| Vazio          | Frase com o lugar e "Bora olhar até {n} km" |
| Sem endereço   | REQ-SRCH-011                                |
| Erro           | `Notice` + "Tentar de novo"                 |

## Microcopy

"Onde" · "Perto de casa" · "Chegada" · "Saída" · "Pet" · "Buscar" · "Farejando cantinhos…" · "Mostrar mais cantinhos" · "Limpar filtros" · "a {km} km" · "R$ {total} as {n} noites" · "R$ {diária} a diária por pet" · selos: "Vizinho", "Responde rápido", "Casa com quintal", "Experiente".

## Acessibilidade e responsividade

- A lista é `ul` de cards-link; a contagem fica numa região `aria-live="polite"` que anuncia o resultado novo.
- Chips são botões com `aria-pressed`.
- Celular: campo de reserva vira pílula que abre um painel; lista em uma coluna.

## Fora do escopo

- Ordenar por preço ou nota (a API não ordena por eles; nota depende das avaliações).
- Filtro "Responde rápido" e "Vizinho" (são selos calculados, sem filtro na API): só aparecem no card.
- Agenda de dias bloqueados (045).
