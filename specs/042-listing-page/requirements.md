---
spec: 042-listing-page
status: in-progress
updated: 2026-10-22
area: LPAGE
---

# 042 · Página do cantinho

## Contexto

O tutor decide se confia: fotos de casa de verdade, quem cuida, quem mora lá, o que a casa aceita e quanto custa ([[04-confianca]], [[11-busca-e-cards]]). Antes da estadia confirmada, só o **bairro** aparece ("Bairro, não coordenada", escopo regra 7): a API já manda a visão pública sem rua, CEP nem coordenada.

## Referências

- **Design:** canvas → `Fluxo-Reserva` → "Página do cantinho". Vault: `design/04-confianca.md`, `design/11-busca-e-cards.md` (anatomia do card e selos), `design/15-estados-com-e-sem-pet.md`.
- **API:** `GET /api/v1/listings/{id}` (logado; visão pública para quem não é o dono; `404 LISTING_NOT_FOUND` se inativo, de anfitrião indisponível ou inexistente; traz `badges` e `host`); `GET /api/v1/hosts/{hostId}/pets` (pets da casa, só ativos).
- **Depende de:** 041 (parser de datas e pets na URL e contexto visual de `ListingCard`), 023 (`HouseResidents`, composto pela página), `shared/lib/date/stayRules` e `shared/lib/money/formatBRL` já existentes.
- **Usada por:** 050 (botão "Pedir estadia").

## Critérios de aceite

| ID            | Critério                                                                                                                                                                                                                                                                                                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-LPAGE-001 | `/listings/{id}` DEVE exigir login, renderizar no servidor e seguir a prancha da página do cantinho: galeria com moldura (até 5, capa primeiro, `alt` "Foto {n} de {título}", selo "Vizinho" na capa; sem foto, estado vazio com a porta da marca), título display, "Bairro, Cidade · UF" com a casa em poucas palavras (tipo, quintal, quem mora), selos em pílula em português ("✓ Verificada", "Responde rápido", "Casa com quintal", "Experiente", nota), "Quem cuida" (foto, nome, descrição como fala), "Regras da casa" (regras escritas + o que aceita, quantos pets por vez e dias em que recebe) e a diária por pet. Seções com título display e divisória tracejada |
| REQ-LPAGE-002 | Os pets da casa DEVEM aparecer como "Quem mora aqui" (ex.: "O Bóris mora aqui", com espécie e resumo); sem pets, a seção não aparece                                                                                                                                                                                                                                        |
| REQ-LPAGE-003 | O endereço DEVE ser só "Bairro, Cidade · UF" com a frase "O endereço chega quando a estadia for confirmada."; nada de mapa com ponto exato                                                                                                                                                                                                                                  |
| REQ-LPAGE-004 | A lateral do tutor DEVE ter CHEGADA e SAÍDA (`DateRangeField`) e "Quem vai" com os pets ativos em pílula (escolhido em gema clara com ✓, os outros tracejados); cada escolha vai para a URL. COM datas e pets (ou "quantos pets" da busca), DEVE mostrar a conta "{diária} × {noites} × {pets}" e o total (`formatBRL`); "Pedir estadia" DEVE levar a `/listings/{id}/request` com os mesmos parâmetros. No celular, preço e "Pedir estadia" ficam numa barra fixa no rodapé |
| REQ-LPAGE-005 | Para cada pet escolhido, a página DEVE mostrar a caixa de `GET /listings/{id}/compatibility`: sem aviso, verde "A {pet} combina com essa casa." com os motivos tirados do que a casa informa; com avisos, tracejada (atenção, nunca vermelho) com cada aviso. Com datas, DEVE contar os outros hóspedes do período (`guests`). Carregando ou com falha, a caixa não aparece |
| REQ-LPAGE-006 | SE o cantinho for do próprio anfitrião logado, a página DEVE mostrar a visão completa com o aviso "É assim que os tutores veem seu cantinho (sem a rua)" e "Editar" (044), e esconder "Pedir estadia"                                                                                                                                                                       |
| REQ-LPAGE-007 | Conta de anfitrião (que não é o dono) DEVE ver a página, mas "Pedir estadia" troca por "Pra pedir uma estadia, entra com a conta de tutor." com o link para trocar de conta (014)                                                                                                                                                                                           |
| REQ-LPAGE-008 | `404 LISTING_NOT_FOUND` DEVE mostrar o 404 da casca, sem dizer se o cantinho existe                                                                                                                                                                                                                                                                                         |
| REQ-LPAGE-009 | Título da página: "{título} · PetHost"; `noindex` (página logada)                                                                                                                                                                                                                                                                                                           |
| REQ-LPAGE-010 | As avaliações dos tutores (`GET /reviews?ListingId=`, as 4 mais novas) DEVEM aparecer em "O que os tutores contam", com primeiro nome, mês da estadia, estrelas e comentário; a nota (`rating`) vira a pílula "★ média (n)". Sem avaliação ou com falha, a seção some |
| REQ-LPAGE-011 | Para o tutor, "← Casas perto de {onde}" (ou "← Voltar pra busca") DEVE levar à home com os parâmetros da busca de origem; nenhum link para `/search` (a rota sai, tarefa 079) |

## Fora do escopo

Conversa antes de pedir (055, "Puxar conversa" da prancha), agenda de dias bloqueados (045) e o que a API não manda (distância no detalhe, contagem da busca de origem, "No PetHost desde" do anfitrião, pet de quem avaliou): lacunas da revisão 078 em `design.md`.
