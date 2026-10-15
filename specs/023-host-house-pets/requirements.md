---
spec: 023-host-house-pets
status: in-progress
updated: 2026-10-15
area: HPETS
---

# 023 · Pets da casa (anfitrião aprovado)

## Contexto

O anfitrião nem sempre é uma empresa: muitas vezes é alguém com bichos em casa, e o tutor precisa saber com quem o pet dele vai conviver ("O Bóris mora aqui", [[19-abrir-meu-cantinho]], [[04-confianca]]). Os pets da casa usam **as mesmas rotas e telas** de pets (020 a 022) com o token de anfitrião; mudam os textos e uma regra: o perfil de anfitrião só existe depois que a verificação é aprovada, então antes disso a API responde `404 PET_KEEPER_NOT_FOUND`.

Esta spec também entrega a vitrine somente leitura que o tutor vê na página do cantinho (042): `GET /hosts/{hostId}/pets`.

## Referências

- **Design:** canvas → board `Fluxo-Cantinho` → "Pets da casa" (computador e celular); `Fluxo-Pet` com texto de abertura do anfitrião. Vault: `design/18-cadastro-do-pet.md` ("Quem usa"), `design/19-abrir-meu-cantinho.md` (seção "Quem mora com você"), `design/04-confianca.md` (casa de verdade), `produto/contrato-api.md` ("Pets da casa (tutor vê)").
- **API** (`pethost_backend/docs/modulo-pets.md` seções 1, 3 e 9):
  - ✅ `GET/POST /api/v1/pets…` com token de `host`: os pets são do perfil de anfitrião (`hostId`), separados dos pets da conta de tutor da mesma pessoa.
  - ✅ `404 PET_KEEPER_NOT_FOUND` quando a conta de anfitrião ainda não foi aprovada (sem perfil).
  - ✅ `GET /api/v1/hosts/{hostId}/pets` (qualquer token): **só os ativos**, com `keeper` uma vez no topo (anfitrião empresa aparece pelo nome fantasia); `404 PET_HOST_NOT_FOUND` se o anfitrião não existe. `hostId` é o id do perfil de anfitrião, não da conta.
- **Depende de:** 020, 021, 022; 004 (`requireRole`, `NAV_ITEMS["host-pets"]`); 030 (status da verificação, para o link "Ver minha verificação").
- **Usada por:** 042 (página do cantinho), 044 (seção "Quem mora com você" do cantinho).

## Histórias

- Como anfitrião aprovado, quero apresentar os pets que moram comigo, com a mesma ficha que os tutores usam.
- Como anfitrião ainda em verificação, quero entender por que não consigo cadastrar os pets da casa e onde acompanhar a aprovação.
- Como tutor, quero ver na página do cantinho quais bichos moram lá, para saber se o meu pet vai se dar bem.

## Critérios de aceite

| ID            | Critério                                                                                                                                                                                                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-HPETS-001 | QUANDO a conta for de anfitrião, `/pets` DEVE usar o título "Pets da casa", o tile "Apresentar um pet da casa" e o estado vazio "Tem bicho morando com você? Apresenta pra quem vai se hospedar aí."                                                                                    |
| REQ-HPETS-002 | SE `GET /pets/me` responder `404 PET_KEEPER_NOT_FOUND`, O SISTEMA DEVE mostrar, no lugar da lista, "Os pets da casa entram depois que sua verificação for aprovada." com o link "Ver minha verificação" (`/host/application`, só quando a 030 estiver disponível), sem tratar como erro |
| REQ-HPETS-003 | Na mesma condição, `/pets/new` DEVE mostrar a mesma mensagem antes do passo 1, sem deixar a pessoa preencher a ficha e descobrir o bloqueio só ao salvar                                                                                                                                |
| REQ-HPETS-004 | O cadastro do anfitrião DEVE ter a abertura "Quem mora com você?" e, no fim, "Prazer, {nome}!" com "Voltar pro meu cantinho" (só com a 044 disponível) e "Apresentar outro pet da casa"                                                                                                 |
| REQ-HPETS-005 | Os pets da conta de tutor e da conta de anfitrião da mesma pessoa NUNCA DEVEM aparecer juntos: as query keys começam pela conta (`accountQueryKey`), e a troca de conta limpa o cache (spec 014)                                                                                        |
| REQ-HPETS-006 | O SISTEMA DEVE oferecer `HouseResidents`, vitrine somente leitura de `GET /hosts/{hostId}/pets`: linha "Quem mora aqui" com foto redonda, nome e espécie de cada pet ativo, e o resumo de convivência ("Se dá bem com cachorro")                                                        |
| REQ-HPETS-007 | QUANDO `GET /hosts/{hostId}/pets` vier com `pets: []`, `HouseResidents` NÃO DEVE renderizar nada (nenhum título vazio)                                                                                                                                                                  |
| REQ-HPETS-008 | SE `GET /hosts/{hostId}/pets` falhar, `HouseResidents` DEVE sumir em silêncio na página do cantinho (é complemento, não bloqueia a reserva) e registrar o erro no console de desenvolvimento                                                                                            |
| REQ-HPETS-009 | `HouseResidents` NÃO DEVE mostrar dados da ficha que só o dono vê (saúde, veterinário, microchip, alergias, manias); só nome, espécie, porte, foto e convivência                                                                                                                        |
| REQ-HPETS-010 | QUANDO a 023 for entregue, `NAV_ITEMS["host-pets"]` DEVE passar a `available: true`                                                                                                                                                                                                     |

## Estados da tela

| Estado                      | O que aparece                           |
| --------------------------- | --------------------------------------- |
| Anfitrião aprovado sem pets | Vazio do REQ-HPETS-001                  |
| Anfitrião não aprovado      | Mensagem do REQ-HPETS-002 com o link    |
| Vitrine sem pets            | Nada                                    |
| Vitrine com pets            | "Quem mora aqui" + carteirinhas mínimas |

## Microcopy

| Lugar                | Texto                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------- |
| Título               | "Pets da casa"                                                                              |
| Tile                 | "Apresentar um pet da casa"                                                                 |
| Vazio                | "Tem bicho morando com você? Apresenta pra quem vai se hospedar aí."                        |
| Bloqueio             | "Os pets da casa entram depois que sua verificação for aprovada." · "Ver minha verificação" |
| Abertura do cadastro | "Quem mora com você?"                                                                       |
| Fim do cadastro      | "Prazer, {nome}!" · "Voltar pro meu cantinho" · "Apresentar outro pet da casa"              |
| Vitrine              | "Quem mora aqui" · por pet: "{nome} · {espécie}"                                            |

## Acessibilidade e responsividade

- `HouseResidents` como lista com título `h2`; fotos com `alt=""` (o nome está no texto).
- A mensagem de bloqueio é texto normal (`role="status"` não: não é atualização dinâmica).

## Fora do escopo

- "Tem cachorro em casa?" e os booleanos `has_dogs/has_cats/has_kids` do cantinho (044).
- Ver o pet do tutor como anfitrião durante a estadia (depende do Booking).
- Esconder a casa de anfitrião inativo (pendência 4 do backend).

## Perguntas em aberto

- **Widget `host-onboarding`:** o roadmap põe a regra de aprovação num widget `host-onboarding` que nenhuma spec define ainda. Proposta: esta spec trata o `PET_KEEPER_NOT_FOUND` dentro da slice `pets` (é a resposta da própria rota) e a 030 decide se cria o widget para o painel do anfitrião.
- **Rota `/pets` para dois papéis:** a 004 põe `/pets` no grupo `(owner)`, mas a rota atende tutor e anfitrião. Ajustar a 004 (`routeAccess` já prevê `/pets` para `owner` e `host`; o layout precisa aceitar os dois).
- **`hostId` para a vitrine:** a página do cantinho (042) precisa do id do perfil de anfitrião, não da conta; depende do contrato do cantinho (API ⛔).

## Ajustes conferidos na implementação (15/10/2026)

- O layout `(account)` e `requirePersonalUser` já aceitam owner/host. Não há migração de rota ou novo layout na 023; a suposição de grupo `(owner)` era anterior ao código entregue.
- `NAV_ITEMS` é uma lista apenas de telas disponíveis, sem campo `available`. Entregar o atalho significa acrescentar a entrada `host-pets` com role host; o efeito observável do REQ-HPETS-010 é o mesmo.
- A 030 e a 044 ainda não estão implementadas nesta base. O aviso não oferece o link de verificação; o componente já tem a opção testada `verificationAvailable` para a composição futura. Ao concluir cadastro, o host volta a `/pets` com "Ver pets da casa"; o link do cantinho entra com a 044.
- A API de vitrine exige qualquer token. "public" na query key significa dados projetados iguais entre contas autenticadas, sem indicar endpoint anônimo.
- Não existe página do cantinho nesta base. O componente reutilizável tem stories e testes funcionais/de integração; o E2E desta spec verifica cadastro, bloqueio, isolamento e contrato ativo da vitrine. Não foi inventada uma rota de teste para antecipar a 042.
- Documentação técnica e catálogo no vault (`development/resources/pets.md` e `resource-catalog.md`).
