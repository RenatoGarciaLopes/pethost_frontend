---
spec: 044-host-listing
status: in-progress
updated: 2026-10-15
area: LIST
---

# 044 · Montar meu cantinho

## Contexto

Terceira etapa do anfitrião ([[19-abrir-meu-cantinho]]): depois da verificação (030) e do recebimento (043), a Dona Cida monta o cantinho em seções independentes e o abre. A API cadastra o cantinho **num pedido só**, com tudo obrigatório, e ele já nasce **ativo** (não há rascunho no servidor). Por isso as seções guardam um rascunho no navegador até "Abrir meu cantinho"; depois de aberto, cada seção salva sozinha (`PATCH`), como a ficha do pet (022). As fotos só existem depois do cadastro (precisam do id).

Pessoa física tem **um** cantinho; empresa tem um por filial.

## Referências

- **Design:** canvas → `Fluxo-Cantinho` (painel de seções, Quem você recebe, Fotos da casa, Diária com simulação, Cantinho aberto). Vault: `design/19-abrir-meu-cantinho.md` (etapa 3), `design/17-cadastros-e-formularios.md`, `design/04-confianca.md`.
- **API** (`pethost_backend/docs/modulo-listings.md` seções 1 a 6; implementada):
  - `POST /api/v1/listings` (corpo da seção 3.1; todos os erros num só `400`); `422 LISTING_HOST_PAYOUTS_NOT_ENABLED`, `422 LISTING_LIMIT_REACHED` (PF), `404 LISTING_HOST_NOT_FOUND`, `403 LISTING_HOST_DEACTIVATED`, `503 LISTING_GEOCODER_UNAVAILABLE`.
  - `GET /api/v1/listings/me` → `{ host, listings }` (ativos e inativos, sem paginação). `host.isCompany` decide PF × PJ.
  - `GET/PATCH /api/v1/listings/{id}` (dono vê tudo, inclusive inativo; `null`/ausente mantém, `""` limpa opcional, lista substitui, endereço parcial recalcula a coordenada).
  - `POST/DELETE /api/v1/listings/{id}/deactivation` (pausar e reabrir, idempotentes).
  - Fotos (até 5, em ordem, a 1 é a capa): `POST …/photos` (no fim), `PUT …/photos/order` (`photoIds` com todas), `PATCH …/photos/{photoId}`, `DELETE …/photos/{photoId}`; `422 LISTING_PHOTO_LIMIT_REACHED`, `409 LISTING_PHOTO_ALREADY_EXISTS`, `404 LISTING_PHOTO_NOT_FOUND`.
- **Depende de:** 043 (`payoutsEnabled`), 030 (`HostOnboardingPanel`), 023 (pets da casa, link "Apresentar o Bóris"), 022 (`diffPatch`, padrão de seções, `PhotoSlots`, `useUnsavedChangesGuard`), 011 (campos e busca de CEP, `useCepLookup`, schema de endereço).

## Histórias

- Como anfitrião, quero montar o cantinho aos poucos, em qualquer ordem, e voltar outro dia no mesmo ponto.
- Como anfitrião, quero ver quanto recebo de verdade (90%) antes de decidir a diária.
- Como anfitrião, quero pausar o cantinho nas férias sem perder nada.
- Como empresa, quero um cantinho por filial.

## Critérios de aceite

| ID           | Critério                                                                                                                                                                                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-LIST-001 | `/host` DEVE ser o painel do anfitrião: o `HostOnboardingPanel` (etapas 1, 2 e 3 com a situação real) e, com cantinho, o resumo de cada um ("Aberto" ou "Pausado", capa, diária) com "Ver e editar"                                                                   |
| REQ-LIST-002 | `/host/listings/new` DEVE abrir só com `payoutsEnabled`; sem ele, mostra "Seu cantinho abre depois que o recebimento estiver conectado." com "Ver como eu recebo" (`/host/payments`); PF que já tem cantinho vai para ele                                             |
| REQ-LIST-003 | O cadastro DEVE ter as seções Sua casa, Quem mora com você, Quem você recebe, Endereço, Regras da casa, Dias que recebe e Diária por pet, em qualquer ordem, cada uma com check de pronta e o topo "Faltam N coisas pro seu cantinho abrir"                           |
| REQ-LIST-004 | ENQUANTO o cantinho não for aberto, as respostas DEVEM ficar num rascunho por conta na sessão do navegador (`useSessionDraft`), restaurado ao voltar ("Continuando o seu cantinho"), e apagado ao abrir ou em "Começar de novo"                                       |
| REQ-LIST-005 | "Sua casa": tipo (Casa · Apartamento; obrigatório só para PF, escondido para empresa), quintal (sim/não), título (até 80; sugestão "Casa da {primeiro nome}" ou "Apê da {primeiro nome}") e descrição (até 4000, com perguntas-guia)                                  |
| REQ-LIST-006 | "Quem mora com você": cachorro, gato e criança (sim/não). Com cachorro ou gato, o atalho "Apresentar quem mora aqui" leva aos pets da casa (023) sem perder o rascunho                                                                                                |
| REQ-LIST-007 | "Quem você recebe": cartões dos 12 tipos (ao menos um); portes P, M e G só aparecem com cachorro ou gato e então ao menos um é obrigatório; capacidade com "+" e "−" de 1 a 10 (PF) ou 1 a 200 (empresa), com a frase "Somando todos os tutores"                      |
| REQ-LIST-008 | "Endereço": CEP preenche rua, bairro, cidade e UF (como na 011); a ajuda diz "Tutores só veem o bairro até a estadia ser confirmada." PF começa com o endereço da conta como sugestão                                                                                 |
| REQ-LIST-009 | "Diária por pet": valor de R$ 10,00 a R$ 10.000,00 (2 casas) e a simulação líquida "Com 2 pets por 10 noites no mês, você recebe R$ X" calculada por `netEarnings(rate, pets, nights)` (90%, função pura com centavos inteiros); mudar pets e noites atualiza na hora |
| REQ-LIST-010 | "Dias que recebe": os 7 dias (segunda a domingo), ao menos um; "Regras da casa" opcional (até 2000) com chips de atalho                                                                                                                                               |
| REQ-LIST-011 | QUANDO tudo estiver pronto, "Abrir meu cantinho" DEVE mandar `POST /listings` uma vez (botão ocupado, sem repetir), e o sucesso mostra "Seu cantinho está aberto!" com a porta abrindo (respeita movimento reduzido) e o próximo passo "Pôr as fotos da casa"         |
| REQ-LIST-012 | Erros de campo do `400` DEVEM voltar à seção do campo (o painel marca a seção e leva até ela); `LISTING_GEOCODER_UNAVAILABLE` mantém o rascunho e diz "Não conseguimos achar o endereço no mapa agora. Tenta de novo em alguns minutos."                              |
| REQ-LIST-013 | `/host/listings/{id}` DEVE mostrar o cantinho por seções editáveis (o mesmo formulário), cada uma com "Salvar {seção}" e só os campos alterados (`diffPatch`); "Nada mudou por aqui." sem chamar a API; sair com alteração pergunta antes                             |
| REQ-LIST-014 | "Fotos da casa" (até 5): pôr (no fim), trocar, tirar e reordenar (arrastando, com teclado e com o menu da foto); a primeira é a capa; sugestões com check (onde dorme, onde come, quintal, portão, sala); erros na vaga                 |
| REQ-LIST-015 | "Pausar meu cantinho" DEVE pedir confirmação neutra ("O cantinho sai da busca até você reabrir. Pedidos já aceitos continuam.") e "Reabrir" volta; o cantinho pausado continua editável                                                                               |
| REQ-LIST-016 | Toda mutação DEVE gravar a resposta no detalhe e invalidar `listings/me`; nada otimista                                                                                                                                                                               |
| REQ-LIST-017 | O endereço exato do cantinho só aparece para o dono; nada desta spec monta visão pública                                                                                                                                                                              |

## Estados da tela

| Estado              | O que aparece                                              |
| ------------------- | ---------------------------------------------------------- |
| Sem recebimento     | REQ-LIST-002                                               |
| Rascunho novo       | Painel com 7 seções, "Faltam 7 coisas…"                    |
| Rascunho restaurado | `Notice` "Continuando o seu cantinho." + "Começar de novo" |
| Abrindo             | Botão ocupado "Abrindo seu cantinho…"                      |
| Aberto              | Comemoração + "Pôr as fotos da casa"                       |
| Cantinho (dono)     | Seções editáveis, fotos, "Pausar meu cantinho"             |
| Pausado             | Selo neutro "Pausado" + "Reabrir"                          |
| Geocodificador fora | `Notice` atenção, rascunho mantido                         |

## Microcopy

| Lugar      | Texto                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Títulos    | "Meu cantinho" · "Abrir meu cantinho"                                                                                              |
| Topo       | "Faltam {n} coisas pro seu cantinho abrir" · "Tudo pronto!"                                                                        |
| Capacidade | "Quantos pets ao mesmo tempo?" · "Somando todos os tutores"                                                                        |
| Simulação  | "Com {pets} pets por {noites} noites no mês, você recebe {valor}" · "A PetHost fica com 10% pra cuidar do pagamento e do suporte." |
| Fotos      | "Até 5 fotos. A primeira é a capa." · "Usar como capa"                                                                             |
| Aberto     | "Seu cantinho está aberto!"                                                                                                        |

## Acessibilidade e responsividade

- Seções como `section` com `h2`; a de erro recebe o foco e anuncia o problema.
- Reordenar fotos por botões com nome acessível ("Mover a foto 2 para cima").
- Celular: uma seção por tela, anel "1/3" do caminho no topo; botões de 56 px.

## Fora do escopo

- Agenda de dias bloqueados (045, API sem `availability_blocks`).
- Visão pública do cantinho (042) e busca (041).
- Preço de referência da cidade (sem rota).

## Perguntas em aberto

- O design previa `status` draft/active/paused; a API tem só ativo e inativo e cria já ativo. O rascunho fica no navegador (sem fotos, que dependem do id).
