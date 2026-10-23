---
spec: 041-search
status: in-progress
updated: 2026-10-22
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
| REQ-SRCH-003 | Faixa única SearchBar compartilhada com a home: Onde (cidade ou vazio para perto de casa), Chegada, Saída, Pet e Achar um cantinho. Sem bairro separado nem formulário avançado. Datas validadas antes de buscar.                                                                                                                                                                     |
| REQ-SRCH-004 | Pet oferece os pets ativos; a busca deriva quantidade, espécie e porte. O chip ativo ✓ Combina com {nomes} permite retirar a seleção; sem pets, o campo informa quantidade.                                                                                                                                                                                                           |
| REQ-SRCH-005 | Título único antes dos chips: N casas com vaga perto de {lugar}, ou perto da sua casa sem lugar.                                                                                                                                                                                                                                                                                      |
| REQ-SRCH-006 | Pílulas contornadas: Casa com quintal, Sem criança/cachorro/gato, Casa, Apartamento, Aceita gatos e Aceita porte grande. Ativo com ✓ e aria-pressed; limpar preserva lugar, datas e pets.                                                                                                                                                                                             |
| REQ-SRCH-007 | Cada card DEVE ser um link único para `/listings/{id}` levando datas e pets na URL, com capa 4:3, aba do anfitrião (avatar e nome; empresa pelo nome fantasia), título, bairro e cidade, distância ("a 1,4 km", só com raio), os selos traduzidos (Vizinho, Responde rápido, Casa com quintal, Experiente) e o preço: diária por pet ou, com datas e pets, o total "R$ X as N noites" |
| REQ-SRCH-008 | ENQUANTO a busca carrega depois de mudar um filtro, a lista anterior fica visível e a faixa "Farejando cantinhos…" aparece (o corgi atravessa uma vez; sem movimento com movimento reduzido); a primeira carga vem do servidor, sem loader                                                                                                                                            |
| REQ-SRCH-009 | A paginação DEVE ser "Mostrar mais cantinhos" (`page + 1`, acumulando), sem rolagem infinita automática                                                                                                                                                                                                                                                                               |
| REQ-SRCH-010 | Vazio ou fim de lista com raio DEVE oferecer "Bora olhar até {raio maior} km" (10 → 20 → 50); sem raio maior, "Tenta outras datas ou tira um filtro."                                                                                                                                                                                                                                 |
| REQ-SRCH-011 | SE vier `LISTING_SEARCH_ADDRESS_REQUIRED` ou `…_NOT_LOCATED`, O SISTEMA DEVE explicar ("Pra procurar perto de casa, a gente precisa do seu endereço.") com o link para `/users/profile` e oferecer procurar por cidade                                                                                                                                                                |
| REQ-SRCH-012 | Erros `400` dos filtros DEVEM voltar ao campo da busca correspondente; `503` mostra `Notice` com "Tentar de novo" mantendo a lista anterior                                                                                                                                                                                                                                           |
| REQ-SRCH-013 | O mapa (`SearchMap`: MapLibre com estilo próprio sobre tiles do OpenFreeMap, pino de preço por bairro com o círculo aproximado de 500 m, nunca a coordenada exata) é complemento da lista, que continua sendo a fonte; sem ele, nada da lista depende do mapa. Pinos focáveis com nome e preço; sem animação de voo com `prefers-reduced-motion`                                      |

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

## Removidos por decisão do Renato em 2026-10-22 (071)

- Formulário avançado, campo Bairro separado e linha solta das três garantias: não existem na composição aprovada da prancha; reutilizar a faixa da home.
- REQ-SRCH-006: removida diária máxima. Também removidos do estado, parse/serialize e requisições: maxNightlyRate, minNightlyRate, minCapacity, neighborhood e weekdays. A API continua oferecendo esses parâmetros para outros consumidores; links antigos são ignorados pela busca.
- REQ-SRCH-004: removido título por nome do pet; identificação passa ao chip Combina com.
- REQ-SRCH-005: substituído texto condicional por contagem no padrão da prancha. Sem datas, a API lista oferta geral; o título não confirma reserva.
- Vizinho e Responde rápido: lacuna da API, sem filtro correspondente. Fora dos chips por decisão expressa, sem alteração no backend.

## Revisão 079: a busca mora na home (22/10/2026)

Decisão do Renato: a home é a página de resultados e a rota `/search` sai ([[2026-10-22-home-e-a-busca]]). O que muda nos requisitos acima:

- **REQ-SRCH-001 (substituído):** a busca DEVE funcionar na própria `/`, sem login: visitante, tutor e anfitrião buscam e veem os resultados no lugar da vitrine. O estado vai para a URL de `/`; sem filtros na URL, a home mostra a vitrine "perto de você". Visitante sem lugar recebe o aviso de endereço da API (`422`), com o atalho para escrever a cidade no campo Onde.
- **REQ-SRCH-002, 005, 006, 008, 009, 010:** valem como estão, agora dentro da home (título no `h2`, chips embaixo, "Mostrar mais cantinhos"). A primeira página vem do servidor (`prefetchSearch` em `app/page.tsx`) e hidrata no cliente.
- **REQ-SRCH-003:** a SearchBar da home é a mesma; o envio escreve a URL (`/?where=...`) pelo histórico, sem navegar.
- **Chips na home:** os mesmos do `FilterChips` (Combina com {pet}, Casa com quintal, Sem criança/cachorro/gato, Casa, Apartamento, Aceita gatos, Aceita porte grande). "Vizinho" e "Responde rápido" continuam fora: a API não filtra (lacuna registrada).
- **Removidos:** a rota `/search` (sem redirect: nenhum link externo a usa), `SearchScreen`, `SearchExperience` (virou `SearchResultsSection`, sem a barra), `buildHomeSearchPath` e o botão "Ver todos os cantinhos" da vitrine.
- **Mapa nos resultados (079 + 080):** com região na busca (`where` ou `state`) e resultados, `SearchResultsSection` monta o `SearchMap`: lista à esquerda e mapa à direita a partir de `lg`; no celular, botão "Ver mapa" abre o mapa em tela cheia (REQ-SRCH-013).
