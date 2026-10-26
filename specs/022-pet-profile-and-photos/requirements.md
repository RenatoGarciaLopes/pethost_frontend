---
spec: 022-pet-profile-and-photos
status: in-progress
updated: 2026-10-14
area: PEDIT
---

# 022 · Ficha, edição e fotos

## Contexto

Depois de apresentado, o pet tem uma **ficha completa** (a carteirinha `full`) que o tutor consulta, corrige e completa com o tempo: trocar a foto, contar uma alergia nova, informar o microchip. Quando o pet sai da vida da pessoa (doado, mudou de casa ou morreu), a ficha **sai da lista** sem ser apagada, com texto neutro e gentil ([[18-cadastro-do-pet]], seção "Tirar um pet da lista").

## Referências

- **Design:** canvas → board `Fluxo-Pet` → "Ficha completa" (computador 1440 e celular 390). Vault: `design/18-cadastro-do-pet.md` (carteirinha, "Tirar um pet da lista", estados), `produto/contrato-api.md` (Editar ficha, Fotos do pet, Tirar da lista), `produto/modelo-de-dados.md` (pedido 3, capa).
- **API** (`pethost_backend/docs/modulo-pets.md` seções 3.1, 3.3, 3.4 e 3.5):
  - ✅ `GET /api/v1/pets/{petId}`: o dono vê o próprio pet, inclusive inativo; pet de outra conta responde `404 PET_NOT_FOUND`.
  - ✅ `PATCH /api/v1/pets/{petId}`: campo ausente ou `null` não mexe; `""` limpa os opcionais de texto (`breed`, `birthDate`, `medicationNotes`, `feedingNotes`, `vetContact`, `notes`, `microchip`, `allergies`); `weightKg` pode trocar, mas não apagar; trocar a espécie limpa porte e descrição que a nova não tem; cachorro ↔ gato mantém o porte; para virar cachorro, mandar o porte junto; para virar exótico, a descrição. Pet inativo pode ser editado e continua inativo. Erros: `400 VALIDATION_ERROR` (ficha resultante inteira), `404 PET_NOT_FOUND`, `409 PET_MICROCHIP_ALREADY_REGISTERED`.
  - ✅ `POST /api/v1/pets/{petId}/deactivation` (tirar da lista) e `DELETE` (voltar para a lista), idempotentes; reativar pode dar `409 PET_MICROCHIP_ALREADY_REGISTERED`.
  - ✅ Fotos: `POST …/photos` (primeira vaga livre; `422 PET_PHOTO_LIMIT_REACHED` com 3), `PATCH …/photos/{photoId}` (substitui mantendo id e posição), `DELETE …/photos/{photoId}` (`404 PET_PHOTO_NOT_FOUND` se já foi tirada); `409 PET_PHOTO_ALREADY_EXISTS` no `POST` e no `PATCH`. Todas devolvem o pet inteiro.
- **Depende de:** 020 (`PetIdCard`, `petQueries`, mappers), 021 (`petProfileSchema`, passos como seções, `PhotoSlots`, `withSessionRetry`, `validatePhotoFile`), 003, 004.

## Histórias

- Como tutor, quero ver tudo o que o anfitrião vai saber do meu pet, num lugar só.
- Como tutor, quero corrigir uma parte da ficha sem passar pelos 7 passos de novo.
- Como tutor, quero trocar ou tirar uma foto sem refazer a ficha.
- Como tutor de um pet que não está mais comigo, quero tirá-lo da lista sem apagar a história e sem ser questionado.

## Critérios de aceite

| ID            | Critério                                                                                                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-PEDIT-001 | `/pets/{petId}` DEVE mostrar a carteirinha completa (`PetIdCard` `full`) com os blocos Saúde, Rotina, Manias e Convivência, renderizada no servidor                                                                                                                                   |
| REQ-PEDIT-002 | SE o pet não existir ou for de outra conta (`404 PET_NOT_FOUND`), O SISTEMA DEVE mostrar a página "não encontrado" da casca, sem revelar que o id existe                                                                                                                              |
| REQ-PEDIT-003 | QUANDO o pet estiver inativo, a ficha DEVE mostrar o selo neutro "Fora da lista" e a ação "Voltar pra lista"; as edições continuam possíveis                                                                                                                                          |
| REQ-PEDIT-004 | `/pets/{petId}/edit` DEVE reaproveitar os passos da 021 como seções (bicho, identidade, corpo, saúde, rotina, convivência), cada uma com "Salvar" próprio, validando pelo `petProfileSchema` a ficha inteira resultante                                                               |
| REQ-PEDIT-005 | QUANDO salvar uma seção, O SISTEMA DEVE enviar só os campos alterados (`toUpdatePetRequest`: diferença entre o original e o editado); campo opcional de texto esvaziado vai como `""`; nada mudou → não chama a API e mostra "Nada mudou por aqui."                                   |
| REQ-PEDIT-006 | O peso, depois de informado, NÃO DEVE poder ser apagado (a API não permite): o campo aceita troca, e a ajuda diz "Dá pra trocar o peso, mas não deixar em branco."                                                                                                                    |
| REQ-PEDIT-007 | QUANDO a espécie mudar, O SISTEMA DEVE pedir na mesma seção o que a nova espécie exige (porte para cachorro, descrição para exótico) e mandar junto; e avisar antes de salvar o que vai sair da ficha (porte, descrição)                                                              |
| REQ-PEDIT-008 | A seção de fotos DEVE usar `PhotoSlots` ligado à API: adicionar (primeira vaga livre), substituir (mesma vaga) e tirar, uma operação por vez, cada uma com o próprio estado de envio; a vaga 1 é sempre a capa e a ajuda diz "Pra trocar a capa, tira a primeira e põe outra."        |
| REQ-PEDIT-009 | SE o envio de foto voltar `401 UNAUTHORIZED`, O SISTEMA DEVE usar `withSessionRetry` (renova uma vez e reenvia o arquivo da memória)                                                                                                                                                  |
| REQ-PEDIT-010 | Os erros de foto DEVEM aparecer na vaga: repetida ("Essa foto já está na ficha."), limite ("Já tem 3 fotos. Tira uma pra colocar outra."), arquivo inválido ou grande (validação no cliente antes, como na 021); `404 PET_PHOTO_NOT_FOUND` recarrega o pet e some sem erro            |
| REQ-PEDIT-011 | QUANDO a pessoa escolher "Tirar da lista", O SISTEMA DEVE pedir confirmação com "A ficha de {nome} sai da sua lista. As estadias antigas continuam no histórico." e os botões "Tirar da lista" e "Deixar como está"; sem cor de alerta, sem turma, sem emoji e sem perguntar o motivo |
| REQ-PEDIT-012 | QUANDO tirar da lista der certo, O SISTEMA DEVE voltar para `/pets` com o aviso discreto "A ficha de {nome} saiu da lista." e o pet em "Fora da lista"                                                                                                                                |
| REQ-PEDIT-013 | QUANDO voltar para a lista der `409 PET_MICROCHIP_ALREADY_REGISTERED`, O SISTEMA DEVE mostrar a frase de `errorCopy` e manter o pet fora da lista                                                                                                                                     |
| REQ-PEDIT-014 | Toda mutação bem-sucedida DEVE gravar a resposta (pet inteiro) em `petQueries.detail` e invalidar `petQueries.all`                                                                                                                                                                    |
| REQ-PEDIT-015 | SE a edição voltar `VALIDATION_ERROR`, O SISTEMA DEVE levar as mensagens aos campos da seção (`applyFieldErrors`); campo de outra seção vai para o `Notice` da seção com o link para ela                                                                                              |
| REQ-PEDIT-016 | A ficha e a edição DEVEM exigir conta de tutor ou anfitrião dono do pet; o botão "Editar" só aparece para o dono (o admin vê a ficha em outra spec)                                                                                                                                   |
| REQ-PEDIT-017 | QUANDO a pessoa sair de uma seção com alteração não salva, O SISTEMA DEVE perguntar "Sair sem salvar?"                                                                                                                                                                                |

## Estados da tela

| Estado         | O que aparece                                                                   |
| -------------- | ------------------------------------------------------------------------------- |
| Ficha          | Carteirinha completa + "Editar ficha" + "Tirar da lista" (link discreto no fim) |
| Ficha inativa  | Selo "Fora da lista" + "Voltar pra lista"                                       |
| Sem foto       | Silhueta da espécie e "Pôr uma foto"                                            |
| Seção salvando | Botão ocupado; outras seções continuam editáveis                                |
| Seção salva    | `Notice` sucesso curto "Salvo." que some sozinho (com `role="status"`)          |
| Foto enviando  | Barra na vaga; as outras vagas ficam bloqueadas até terminar                    |
| Não encontrado | 404 da casca                                                                    |
| Erro           | `Notice` com `getErrorMessage`                                                  |

## Microcopy

| Lugar            | Texto                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Botões           | "Editar ficha" · "Salvar" · "Tirar da lista" · "Voltar pra lista"                                                         |
| Confirmação      | "A ficha de {nome} sai da sua lista. As estadias antigas continuam no histórico." · "Tirar da lista" · "Deixar como está" |
| Depois de tirar  | "A ficha de {nome} saiu da lista."                                                                                        |
| Fotos            | "A primeira é a capa. Pra trocar a capa, tira a primeira e põe outra."                                                    |
| Peso             | "Dá pra trocar o peso, mas não deixar em branco."                                                                         |
| Troca de espécie | "Mudando pra {espécie}, o porte sai da ficha."                                                                            |
| Nada mudou       | "Nada mudou por aqui."                                                                                                    |

## Acessibilidade e responsividade

- Confirmação em `Dialog` com foco inicial em "Deixar como está" (ação segura) e retorno do foco ao botão que abriu.
- Seções como `section` com `h2`; "Salvar" de cada seção com nome acessível "Salvar {seção}".
- Celular: seções empilhadas e recolhíveis; a carteirinha no topo.

## Fora do escopo

- Ver a ficha do pet de um tutor como anfitrião (depende do Booking, pendência 3 do `modulo-pets.md`); botão de ligar para o veterinário (só em estadia confirmada, 054).
- Reordenar fotos ou escolher capa (sem rota).
- Recusar desativação de pet com estadia ativa (pendência 2 do backend).

## Perguntas em aberto

- **Divergência no backend:** `modulo-pets.md` diz na seção 3.3 que alterar pet de outra conta responde `404 PET_NOT_FOUND`, mas a tabela da seção 9 diz "`403` no PATCH". A tela trata os dois como "não encontrado". Pedir ao backend para alinhar a documentação.
- **`medicationNotes`** aparece na lista de campos que `""` limpa, mas não no exemplo do formato 3.1. Confirmar que volta na resposta quando preenchido.
- **Porte do gato:** mesma pergunta da 021. Na edição, o porte do gato aparece só se já existir.
- **Pet em estadia:** o design pede aviso ao anfitrião quando a saúde muda durante uma estadia; depende da 054.
