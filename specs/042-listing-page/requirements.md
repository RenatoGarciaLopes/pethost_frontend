---
spec: 042-listing-page
status: draft
updated: 2026-10-15
area: LPAGE
---

# 042 · Página do cantinho

## Contexto

O tutor decide se confia: fotos de casa de verdade, quem cuida, quem mora lá, o que a casa aceita e quanto custa ([[04-confianca]], [[11-busca-e-cards]]). Antes da estadia confirmada, só o **bairro** aparece ("Bairro, não coordenada", escopo regra 7): a API já manda a visão pública sem rua, CEP nem coordenada.

## Referências

- **Design:** canvas → `Fluxo-Reserva` → "Página do cantinho". Vault: `design/04-confianca.md`, `design/11-busca-e-cards.md` (anatomia do card e selos), `design/15-estados-com-e-sem-pet.md`.
- **API:** `GET /api/v1/listings/{id}` (logado; visão pública para quem não é o dono; `404 LISTING_NOT_FOUND` se inativo, de anfitrião indisponível ou inexistente; traz `badges` e `host`); `GET /api/v1/hosts/{hostId}/pets` (pets da casa, só ativos).
- **Depende de:** 041 (datas e pets na URL, `ListingCard` para coerência visual, `stayRules`), 023 (vitrine dos pets da casa), 044 (`formatBRL`).
- **Usada por:** 050 (botão "Pedir estadia").

## Critérios de aceite

| ID            | Critério                                                                                                                                                                                                                                                                                                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-LPAGE-001 | `/listings/{id}` DEVE exigir login, renderizar no servidor e mostrar: galeria (até 5, capa primeiro, `alt` "Foto {n} de {título}"), título, bairro e cidade, anfitrião (foto, nome; empresa pelo nome fantasia), selos, descrição, quem mora (quintal, cachorro, gato, criança), o que aceita (tipos, portes, capacidade), dias que recebe, regras da casa e diária por pet |
| REQ-LPAGE-002 | Os pets da casa DEVEM aparecer como "Quem mora aqui" (ex.: "O Bóris mora aqui", com espécie e resumo); sem pets, a seção não aparece                                                                                                                                                                                                                                        |
| REQ-LPAGE-003 | O endereço DEVE ser só "Bairro, Cidade · UF" com a frase "O endereço chega quando a estadia for confirmada."; nada de mapa com ponto exato                                                                                                                                                                                                                                  |
| REQ-LPAGE-004 | COM datas e pets na URL (vindos da busca), o resumo DEVE mostrar o total (`diária × noites × pets`, `formatBRL`) e o botão "Pedir estadia" levar a `/listings/{id}/request` com os mesmos parâmetros; sem eles, "Escolher datas e pets" abre os mesmos campos da 041                                                                                                        |
| REQ-LPAGE-005 | "Combina com {pet}" DEVE comparar cada pet escolhido com o cantinho (`petFitsListing`, função pura): espécie aceita e porte aceito; o que não combina vira "! {Pet}: esse cantinho não recebe {espécie ou porte}" (borda tracejada, sem vermelho)                                                                                                                           |
| REQ-LPAGE-006 | SE o cantinho for do próprio anfitrião logado, a página DEVE mostrar a visão completa com o aviso "É assim que os tutores veem seu cantinho (sem a rua)" e "Editar" (044), e esconder "Pedir estadia"                                                                                                                                                                       |
| REQ-LPAGE-007 | Conta de anfitrião (que não é o dono) DEVE ver a página, mas "Pedir estadia" troca por "Pra pedir uma estadia, entra com a conta de tutor." com o link para trocar de conta (014)                                                                                                                                                                                           |
| REQ-LPAGE-008 | `404 LISTING_NOT_FOUND` DEVE mostrar o 404 da casca, sem dizer se o cantinho existe                                                                                                                                                                                                                                                                                         |
| REQ-LPAGE-009 | Título da página: "{título} · PetHost"; `noindex` (página logada)                                                                                                                                                                                                                                                                                                           |

## Fora do escopo

Avaliações e nota (sem módulo), conversa antes de pedir (055), agenda de dias bloqueados (045).
