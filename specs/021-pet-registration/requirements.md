---
spec: 021-pet-registration
status: draft
updated: 2026-10-11
area: PNEW
---

# 021 · Apresentar meu pet

## Contexto

O tutor não está "cadastrando um registro": está **apresentando o pet para o vizinho** que vai cuidar dele ([[18-cadastro-do-pet]], [[personas]]). Cada pergunta existe porque o anfitrião vai precisar da resposta. O resultado é a carteirinha (`PetIdCard`, spec 020) e a comemoração "Prazer, {nome}!". O mesmo fluxo serve ao anfitrião aprovado para os pets da casa (textos na 023).

Regra central do board: **"Escolher o bicho muda o resto"**. Porte só existe para cachorro (obrigatório) e gato (opcional na API); exótico pede a descrição; nos outros bichos o peso ganha destaque.

## Referências

- **Design:** canvas → board `Fluxo-Pet` → passos 1 a 7 e "Prazer, Pipoca!" (computador 1440 com a carteirinha ao vivo na coluna da direita; celular 390 com a carteirinha só na revisão). Vault: `design/18-cadastro-do-pet.md` (passos, carteirinha, comemoração, critérios), `design/17-cadastros-e-formularios.md`, `design/06-a-turma.md`, `produto/contrato-api.md` (tabela de campos do pet), `produto/modelo-de-dados.md` (pedidos 1 e 3).
- **API** (`pethost_backend/docs/modulo-pets.md` seções 3.2, 3.5 e 4):
  - ✅ `POST /api/v1/pets` → `201` + `Location`, corpo no formato 3.1. Erros: `400 VALIDATION_ERROR` (todos os campos de uma vez), `403 FORBIDDEN` (admin), `404 PET_KEEPER_NOT_FOUND`, `409 PET_MICROCHIP_ALREADY_REGISTERED`.
  - ✅ `POST /api/v1/pets/{petId}/photos` (`multipart/form-data`, parte `file`; JPEG, PNG ou WebP até 5 MB; corpo até 8 MB), **uma foto por chamada, depois de criar o pet**, na primeira vaga livre (a vaga 1 é a capa). Erros: `400 VALIDATION_ERROR` (campo `file`), `409 PET_PHOTO_ALREADY_EXISTS`, `413 PAYLOAD_TOO_LARGE`, `415 UNSUPPORTED_MEDIA_TYPE`, `422 PET_PHOTO_LIMIT_REACHED`.
  - Campos: `species`, `speciesDescription`, `name`, `breed`, `size`, `birthDate`, `sex`, `isNeutered`, `isVaccinated`, `medicationNotes`, `feedingNotes`, `goodWithDogs`, `goodWithCats`, `goodWithKids`, `vetContact`, `notes`, `weightKg`, `microchip`, `allergies`.
- **Depende de:** 002 (`WizardProgress`, `ChoiceCardGroup`, `SegmentedControl`, `ToggleRow`, `ChipPicker`, `FormActions`, `MaskedTextField`, `Notice`, `Hint`, `Celebration`, `TurmaWalker`), 003 (`bffClient`, proxy multipart, `applyFieldErrors`, `getErrorMessage`), 004 (casca, `requireRole`), 020 (`PetIdCard`, `petQueries`, schemas de espécie).

## Histórias

- Como tutor, quero apresentar meu pet em poucos minutos, respondendo só o que se aplica ao bicho que tenho.
- Como tutor de um coelho, quero informar o peso em vez de um porte que não existe para ele.
- Como tutor indeciso, quero sair no meio e continuar depois sem perder o que respondi.
- Como tutor, quero que a ficha fique salva mesmo se uma foto falhar, e poder pôr a foto depois.

## Critérios de aceite

| ID           | Critério                                                                                                                                                                                                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-PNEW-001 | O SISTEMA DEVE conduzir o cadastro em 7 passos (bicho; nome, fotos e sexo; corpo; saúde; rotina e manias; convivência; revisão) com `WizardProgress` mostrando o passo atual                                                                                                                                      |
| REQ-PNEW-002 | O passo 1 DEVE oferecer os 12 bichos em `ChoiceCardGroup`, com Cachorro e Gato maiores na primeira linha e "Outro bicho" (`exotic`) por último; QUANDO vier `?species=` válido na URL (hero), o bicho DEVE vir marcado                                                                                            |
| REQ-PNEW-003 | QUANDO o bicho for `exotic`, O SISTEMA DEVE pedir "Que bicho é?" (`speciesDescription`, obrigatória, até 60); para os outros bichos o campo NÃO DEVE aparecer nem ser enviado                                                                                                                                     |
| REQ-PNEW-004 | QUANDO o bicho for `dog`, O SISTEMA DEVE pedir o porte (P, M, G com silhueta e faixa de peso) como obrigatório; para os bichos que não são cachorro nem gato o porte NÃO DEVE aparecer nem ser enviado (ver Perguntas em aberto sobre o gato)                                                                     |
| REQ-PNEW-005 | QUANDO o bicho mudar depois de outros passos respondidos, O SISTEMA DEVE descartar só os campos que deixaram de existir (porte, descrição) e avisar em `Hint` o que mudou; os outros campos ficam                                                                                                                 |
| REQ-PNEW-006 | A partir do passo 2, os títulos e perguntas DEVEM usar o nome do pet ("Sobre o corpo de {nome}"); sem nome ainda, usam "seu pet"                                                                                                                                                                                  |
| REQ-PNEW-007 | O passo 2 DEVE oferecer 3 vagas de foto (`PhotoSlots`), a primeira com o rótulo "capa"; SE o arquivo não for JPEG, PNG ou WebP, ou passar de 5 MB, O SISTEMA DEVE recusar na hora, no próprio slot, sem chamar a API; SE o mesmo arquivo for escolhido duas vezes, DEVE recusar com "Essa foto já está na ficha." |
| REQ-PNEW-008 | O sexo DEVE oferecer Macho, Fêmea e "Não sei" para todos os bichos                                                                                                                                                                                                                                                |
| REQ-PNEW-009 | O passo 3 DEVE ter raça livre com "Sem raça definida (vira-lata)" como primeira sugestão; idade por data ou chips Filhote, Jovem, Adulto, Idoso (convertidos para uma `birthDate` aproximada por função pura); peso aproximado em kg (maior que 0, até 150, até 3 casas), destacado quando não há porte           |
| REQ-PNEW-010 | O passo 4 DEVE perguntar vacinado e castrado (Sim/Não obrigatórios), e abrir `medicationNotes` e `allergies` por `ToggleRow` ("Toma algum remédio?", "Tem alguma alergia?"); veterinário até 160; microchip opcional com máscara de 15 dígitos e a ajuda "Se tiver, ajuda a achar se ele fugir"                   |
| REQ-PNEW-011 | O passo 5 DEVE ter `feedingNotes` (até 1000) e `notes` (até 2000) com `ChipPicker` de atalhos que inserem o texto no campo                                                                                                                                                                                        |
| REQ-PNEW-012 | O passo 6 DEVE perguntar `goodWithDogs`, `goodWithCats` e `goodWithKids` (Sim/Não obrigatórios) com a dica "Na dúvida, marque não e conte nas manias" enquanto a API não aceitar "Ainda não sei"                                                                                                                  |
| REQ-PNEW-013 | ENQUANTO a pessoa responde, no computador, a carteirinha (`PetIdCard` `full`) DEVE se montar ao vivo na coluna da direita; no celular, aparece só na revisão                                                                                                                                                      |
| REQ-PNEW-014 | Cada passo DEVE validar só os próprios campos ao avançar e focar o primeiro campo inválido; "Voltar" nunca valida                                                                                                                                                                                                 |
| REQ-PNEW-015 | O passo 7 DEVE mostrar a carteirinha completa com "Editar" por bloco (volta ao passo e retorna à revisão) e o botão "Salvar a ficha de {nome}"                                                                                                                                                                    |
| REQ-PNEW-016 | QUANDO salvar, O SISTEMA DEVE criar o pet (`POST /pets`) **uma única vez** e depois enviar as fotos uma a uma, na ordem das vagas; o botão fica ocupado até o fim e um segundo clique não cria outro pet                                                                                                          |
| REQ-PNEW-017 | SE a API devolver `VALIDATION_ERROR`, O SISTEMA DEVE levar cada mensagem ao campo (`applyFieldErrors`) e voltar ao primeiro passo que tem erro                                                                                                                                                                    |
| REQ-PNEW-018 | SE uma foto falhar depois do pet criado, O SISTEMA DEVE manter o pet, mostrar "A foto não subiu. Tenta de novo ou segue sem, dá pra pôr depois." com "Tentar de novo" e "Seguir sem a foto", e nunca recriar o pet                                                                                                |
| REQ-PNEW-019 | SE o envio de uma foto voltar `401 UNAUTHORIZED` (o proxy não repete multipart), O SISTEMA DEVE renovar a sessão uma vez (`POST /api/auth/sessions/refresh`) e reenviar aquela foto, que ainda está na memória; se a renovação falhar, segue o REQ-HTTP-012                                                       |
| REQ-PNEW-020 | QUANDO tudo terminar, O SISTEMA DEVE invalidar `petQueries.all`, apagar o rascunho e mostrar "Prazer, {nome}!" (`Celebration`, intensidade média, até ~900 ms; leitor de tela ouve "Ficha de {nome} salva") com "Procurar um cantinho pra {nome}" (só com a 041 disponível) e "Apresentar outro pet"              |
| REQ-PNEW-021 | ENQUANTO o cadastro não for salvo, O SISTEMA DEVE guardar o rascunho em `sessionStorage` por conta, **sem fotos e sem microchip**, e restaurar ao voltar para `/pets/new`; ao sair com dados preenchidos, perguntar antes de descartar                                                                            |
| REQ-PNEW-022 | Com `prefers-reduced-motion`, a montagem da carteirinha e a comemoração DEVEM virar troca suave de 150 ms, sem a passagem da turma                                                                                                                                                                                |
| REQ-PNEW-023 | Dá para terminar só com: espécie, nome, sexo, porte (se cachorro), vacinado, castrado e convivência; todo o resto é opcional e pode ser pulado                                                                                                                                                                    |

## Estados da tela

| Estado              | O que aparece                                                               |
| ------------------- | --------------------------------------------------------------------------- |
| Início              | Passo 1 com o bicho marcado se veio do hero                                 |
| Rascunho restaurado | `Notice` informativo "Continuando a ficha de {nome}." com "Começar de novo" |
| Erro de campo       | Mensagem embaixo do campo, foco nele                                        |
| Salvando            | Botão ocupado "Salvando a ficha…"; depois "Enviando fotos (1 de 3)…"        |
| Foto falhou         | Slot com erro e as duas ações do REQ-PNEW-018                               |
| Erro geral          | `Notice` erro com `getErrorMessage` (rede, 5xx, `PET_KEEPER_NOT_FOUND`)     |
| Sucesso             | "Prazer, {nome}!"                                                           |

## Microcopy

| Passo | Título                       | Ajuda                                                                                  |
| ----- | ---------------------------- | -------------------------------------------------------------------------------------- |
| 1     | "Que bicho é o seu?"         | exótico: "Que bicho é?" (ex.: "Iguana verde")                                          |
| 2     | "Como seu pet se chama?"     | fotos: "A primeira é a capa. Dá pra pôr depois."                                       |
| 3     | "Sobre o corpo de {nome}"    | porte: "P até 10 kg · M de 10 a 25 kg · G mais de 25 kg"; peso: "Peso aproximado (kg)" |
| 4     | "Saúde"                      | microchip: "Se tiver, ajuda a achar se ele fugir."                                     |
| 5     | "Rotina e manias"            | "Coisas que só quem convive sabe"                                                      |
| 6     | "Com quem {nome} se dá bem?" | "Na dúvida, marque não e conte nas manias."                                            |
| 7     | "Confere a ficha"            | botão "Salvar a ficha de {nome}"                                                       |
| fim   | "Prazer, {nome}!"            | "Procurar um cantinho pra {nome}" · "Apresentar outro pet"                             |

Chips de rotina: "come 2× ao dia", "ração úmida", "medo de fogos", "medo de trovão", "puxa na guia", "sobe no sofá". Erros da API pelos textos de `errorCopy` (spec 003): `PET_MICROCHIP_ALREADY_REGISTERED`, `PET_PHOTO_ALREADY_EXISTS`, `PET_PHOTO_LIMIT_REACHED`, `PET_KEEPER_NOT_FOUND`.

## Acessibilidade e responsividade

- Cada passo é um `form` com `h1` do passo; ao trocar de passo, o foco vai para o título.
- `WizardProgress` com `aria-current="step"`; no celular, anel com "Passo 3 de 7" textual.
- `ChoiceCardGroup` como `radiogroup` (setas mudam a seleção); silhuetas de porte com texto, não só imagem.
- Slots de foto: botão "Adicionar foto {n}" com `input type=file` acessível; erro do slot com `aria-describedby`.
- `FormActions` fixo no rodapé no celular; nada abaixo dele fica escondido pelo teclado virtual.
- Nenhuma ilustração atrás dos campos; turma só na comemoração.

## Fora do escopo

- Editar depois de salvo (022), pets da casa (023, só textos).
- Reordenar fotos ou escolher a capa (a API não tem rota; a capa é a vaga 1).
- "Ainda não sei" em vacina e convivência (pendente na API).
- Recortar ou comprimir a imagem no navegador.

## Perguntas em aberto

- **Porte do gato (divergência vault x API):** a API aceita porte **opcional** no gato; o vault diz "Gato nunca vê a pergunta de porte" (critério de aceite) e o roadmap diz "opcional em gato". Proposta: o gato não vê a pergunta no cadastro (segue o design), e a 022 mostra o porte do gato só se já existir. Confirmar com o produto.
- **"Ainda não sei"** em `isVaccinated` e `goodWith*` (pedido 1 de `modelo-de-dados.md`): até a API aceitar, Sim/Não com a dica.
- **Idade por chips:** valores propostos para `ageBucketToBirthDate`: Filhote = hoje menos 6 meses; Jovem = menos 2 anos; Adulto = menos 5 anos; Idoso = menos 10 anos (dia 1 do mês). Confirmar com o produto.
- **Peso de bichos pequenos:** hamster e canário pesam gramas; a API guarda kg com 3 casas. Proposta: mostrar o campo em gramas para `hamster`, `canary`, `parakeet`, `cockatiel`, `fish` e converter (`35 g` → `0.035`). Confirmar.
- **Microchip no rascunho:** fica fora do `sessionStorage` por cautela (identificador do animal). Confirmar se é excesso.
- **Mensagens de validação da API em inglês:** a tela valida antes no cliente com as mesmas regras; se a API ainda recusar, a mensagem em inglês aparece no campo. Pedido ao backend: mensagens em português (registrado na 003).
