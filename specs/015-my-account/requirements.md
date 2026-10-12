---
spec: 015-my-account
status: draft
updated: 2026-10-11
area: ACC
---

# 015 · Minha conta

## Contexto

Três páginas da conta logada: **perfil** (`/users/profile`), **senha** (`/users/password`) e **pausar a conta** (`/users/deactivate`). O medo muda com o papel:

- o tutor quer corrigir telefone, endereço e, até o primeiro pagamento, CPF e nascimento;
- o anfitrião verificado precisa entender por que nome, nascimento e CPF estão travados ("Pra mudar, fala com o suporte");
- quem pausa a conta precisa saber que só **esta** conta pausa e que volta com a senha.

O perfil também mostra o que os outros veem: foto, nome, bairro, "No PetHost desde {mês de ano}" (`design/20-conta-e-entrada.md`, seção "Perfil").

## Referências

- **Design:** canvas → board `Fluxo-Conta` → "Perfil (anfitriã)"; vault `design/20-conta-e-entrada.md` (seção "Perfil"), `design/17-cadastros-e-formularios.md` (componente de envio de foto, recorte redondo).
- **API (tutor):** `pethost_backend/docs/modulo-owners.md` seções 3.1, 3.3 a 3.5:
  - ✅ `GET /api/v1/owners/me` → tutor (`id`, `cpf`, `createdAt`, `user`);
  - ✅ `PATCH /api/v1/owners/me` `{ fullName?, phone?, address?, birthDate?, cpf?, currentPassword? }`: só o que vier muda; CPF e nascimento pedem `currentPassword` e travam depois do primeiro pagamento (`422 OWNER_CPF_LOCKED`, `422 OWNER_BIRTH_DATE_LOCKED`); `409 OWNER_CPF_ALREADY_REGISTERED`; valor igual ao atual não conta como troca;
  - ✅ `PUT /api/v1/owners/me/avatar` (multipart, parte `file`, JPEG/PNG/WebP até 5 MB; corpo até 8 MB → `413 PAYLOAD_TOO_LARGE`) e `DELETE` (idempotente);
  - ✅ `POST /api/v1/owners/me/deactivate` (sem corpo; sessões caem na hora).
- **API (anfitrião verificado):** `modulo-hosts.md` seção 4.2:
  - ✅ `GET /api/v1/hosts/me` (`404 HOST_NOT_FOUND` antes da aprovação);
  - ✅ `PATCH /api/v1/hosts/me`: livres `phone`, `address` e, só empresa, `tradeName` e `companyAddress`; travados `fullName`, `birthDate`, `cpf`, `cnpj`, `legalName` (`422 HOST_IDENTITY_LOCKED` se mudar; igual ao atual passa); `422 HOST_NOT_A_COMPANY`;
  - ✅ `PUT`/`DELETE /api/v1/hosts/me/avatar`; ✅ `POST /api/v1/hosts/me/deactivate` (conta ainda sem perfil inativa só a conta).
- **API (todos):** ✅ `GET /api/v1/users/me`; ✅ `POST /api/v1/users/me/password` `{ currentPassword, newPassword }` → sessão nova (handler de sessão da 003), outras sessões caem; senha atual errada → `400` no campo `currentPassword` (não 401); conta inativa → `403 AUTH_ACCOUNT_DEACTIVATED`.
- **Depende de:** 002 (`LockedField`, `PasswordField`, `PasswordStrengthChecklist`, `Notice`, `Hint`, `FormActions`), 003 (proxy, handler `users/me/password`, `getErrorMessage`, `applyFieldErrors`), 004 (casca, `requireRole`, `useLogout`), 011 (`AddressFields`, `CpfField`, `BirthDateField`, validações).

## Histórias

- Como tutora, quero corrigir meu telefone e endereço sem preencher tudo de novo.
- Como tutor que digitou o CPF errado, quero corrigir antes do primeiro pagamento confirmando minha senha.
- Como anfitriã verificada, quero ver meus dados travados com o motivo e saber como pedir mudança.
- Como pessoa que vai dar um tempo, quero pausar só esta conta, sabendo como voltar.

## Critérios de aceite

### Perfil (`/users/profile`)

| ID          | Critério                                                                                                                                                                                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-ACC-001 | `/users/*` DEVE exigir sessão de tutor ou anfitrião; admin vai para a casa dele                                                                                                                                                                                                                     |
| REQ-ACC-002 | O SISTEMA DEVE mostrar o cartão público: foto redonda (ou iniciais), nome, bairro e "No PetHost desde {mês} de {ano}" a partir de `createdAt`, com a legenda "É isso que os outros veem."                                                                                                           |
| REQ-ACC-003 | O SISTEMA DEVE mostrar o e-mail como `LockedField` com o motivo "O e-mail é o seu login e não muda por aqui."                                                                                                                                                                                       |
| REQ-ACC-004 | Para o tutor, O SISTEMA DEVE permitir editar nome, telefone, endereço (`AddressFields`), nascimento e CPF                                                                                                                                                                                           |
| REQ-ACC-005 | QUANDO o tutor mudar CPF ou nascimento, O SISTEMA DEVE pedir "Sua senha atual" no mesmo formulário (campo que aparece com a mudança) e enviá-la como `currentPassword`; sem essa mudança, o campo NÃO DEVE aparecer                                                                                 |
| REQ-ACC-006 | O SISTEMA DEVE enviar no `PATCH` só os campos alterados (o endereço completo quando qualquer parte dele mudar) e, sem alteração, manter o botão "Salvar" desabilitado com a dica "Nada mudou ainda."                                                                                                |
| REQ-ACC-007 | SE a API responder `OWNER_CPF_LOCKED` ou `OWNER_BIRTH_DATE_LOCKED`, O SISTEMA DEVE desfazer a mudança daquele campo, mostrá-lo como `LockedField` com "Depois do primeiro pagamento, o CPF e o nascimento ficam travados. Pra mudar, fala com o suporte." e manter as outras mudanças para reenviar |
| REQ-ACC-008 | SE a API responder `VALIDATION_ERROR` (inclusive `currentPassword` errada ou ausente), O SISTEMA DEVE levar cada mensagem ao seu campo; `OWNER_CPF_ALREADY_REGISTERED` vai para o campo CPF com o link de suporte                                                                                   |
| REQ-ACC-009 | Para o anfitrião verificado, O SISTEMA DEVE mostrar nome, nascimento, CPF e, se empresa, CNPJ e razão social como `LockedField` com "Esses dados foram conferidos na verificação. Pra mudar, fala com o suporte."; editáveis: telefone, endereço e, se empresa, nome fantasia e endereço da empresa |
| REQ-ACC-010 | SE a API responder `HOST_IDENTITY_LOCKED`, O SISTEMA DEVE restaurar os valores travados e mostrar a mensagem de `errorCopy`                                                                                                                                                                         |
| REQ-ACC-011 | QUANDO `GET /hosts/me` responder `HOST_NOT_FOUND` (anfitrião ainda não aprovado), O SISTEMA DEVE mostrar os dados da conta (`/users/me`) só para leitura, com o aviso "Seus dados ficam editáveis depois da verificação." e o link para `/host/application`                                         |
| REQ-ACC-012 | QUANDO o perfil for salvo, O SISTEMA DEVE mostrar "Pronto, guardado." (`role="status"`), atualizar o cartão público e invalidar a sessão do servidor (`router.refresh()`) para a casca mostrar o nome novo                                                                                          |
| REQ-ACC-013 | O CPF DEVE aparecer mascarado na tela (`***.***.247-25`) até a pessoa tocar "Mostrar"; o valor completo nunca vai para log nem para query key                                                                                                                                                       |

### Foto

| ID          | Critério                                                                                                                                                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-ACC-014 | O SISTEMA DEVE permitir escolher a foto (JPEG, PNG ou WebP até 5 MB), conferir tipo e tamanho **antes** do envio e mostrar a prévia redonda; arquivo fora da regra mostra "Essa foto não serve: use JPG, PNG ou WebP de até 5 MB." sem enviar |
| REQ-ACC-015 | QUANDO a foto for confirmada, O SISTEMA DEVE enviar `PUT .../me/avatar` em multipart (parte `file`), mostrar o progresso indeterminado com `aria-busy` e, com sucesso, trocar a foto do cartão e do menu da casca                             |
| REQ-ACC-016 | "Tirar foto" DEVE pedir confirmação ("Tirar sua foto do perfil?") e chamar `DELETE .../me/avatar`; o cartão volta às iniciais                                                                                                                 |
| REQ-ACC-017 | SE a API responder `VALIDATION_ERROR` no campo `file` ou `413 PAYLOAD_TOO_LARGE`, O SISTEMA DEVE mostrar a mensagem do REQ-ACC-014                                                                                                            |

### Senha (`/users/password`)

| ID          | Critério                                                                                                                                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-ACC-018 | O SISTEMA DEVE pedir "Senha atual" e "Senha nova" (com régua), ambos com "Mostrar"/"Esconder", e o aviso "Ao trocar, os outros aparelhos saem da conta. Este continua."                                                |
| REQ-ACC-019 | QUANDO enviar, O SISTEMA DEVE chamar `POST /api/users/me/password` uma vez; com sucesso, limpar os campos, mostrar "Senha trocada. Os outros aparelhos saíram da conta." e seguir logado (cookies regravados pelo BFF) |
| REQ-ACC-020 | SE a API responder `VALIDATION_ERROR` em `currentPassword` ou `newPassword`, O SISTEMA DEVE mostrar no campo certo; a senha atual errada limpa só o campo da senha atual                                               |
| REQ-ACC-021 | A página DEVE ter o link "Esqueci minha senha atual" para `/forgot-password?as=<papel>`                                                                                                                                |

### Pausar a conta (`/users/deactivate`)

| ID          | Critério                                                                                                                                                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-ACC-022 | O SISTEMA DEVE explicar antes de pausar: "Só a sua conta de {tutor/anfitrião} pausa. Se você tem a outra conta, ela continua.", "Você sai de todos os aparelhos." e "Pra voltar, é só entrar com sua senha e escolher reativar."    |
| REQ-ACC-023 | O botão "Pausar minha conta" DEVE ficar desabilitado até a pessoa marcar "Entendi o que acontece"                                                                                                                                   |
| REQ-ACC-024 | QUANDO confirmar, O SISTEMA DEVE chamar `POST .../me/deactivate` do papel atual uma vez; com sucesso, chamar o logout do BFF, limpar o cache e ir para `/` com o aviso "Sua conta está pausada. Quando quiser voltar, é só entrar." |
| REQ-ACC-025 | SE a pausa falhar, O SISTEMA DEVE mostrar a mensagem de `errorCopy` e manter a sessão                                                                                                                                               |

### Geral

| ID          | Critério                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-ACC-026 | Senhas NUNCA DEVEM ir para URL, storage, log ou analytics; arquivo de foto fica só em memória (object URL revogado ao trocar ou sair) |
| REQ-ACC-027 | As três páginas DEVEM ter navegação entre elas ("Perfil", "Senha", "Pausar conta"), `<title>` próprio e `robots: noindex`             |
| REQ-ACC-028 | `TOO_MANY_REQUESTS` em qualquer envio DEVE mostrar a contagem e bloquear o envio                                                      |

## Estados da tela

| Estado                    | O que aparece                                              |
| ------------------------- | ---------------------------------------------------------- |
| Carregando                | Esqueleto do cartão e dos campos                           |
| Tutor editando            | Campos livres; senha atual só se CPF ou nascimento mudarem |
| Anfitrião verificado      | Identidade em `LockedField`; contato e endereço livres     |
| Anfitrião sem verificação | Tudo para leitura + aviso com link para a verificação      |
| Salvando                  | "Salvando…", `aria-busy`                                   |
| Salvo                     | `Notice` de sucesso discreto                               |
| Foto enviando             | Prévia com indicador, botões desabilitados                 |
| Erro ao carregar          | `ErrorState` com "Tentar de novo"                          |

## Microcopy

- **Navegação:** "Perfil", "Senha", "Pausar conta".
- **Perfil:** título "Seu perfil"; "É isso que os outros veem."; botões "Trocar foto", "Tirar foto", "Salvar", "Salvando…"; "Nada mudou ainda."; "Pronto, guardado."
- **Senha:** título "Trocar a senha"; botões "Trocar senha", "Trocando…"; link "Esqueci minha senha atual".
- **Pausar:** título "Pausar a conta"; caixa "Entendi o que acontece"; botões "Pausar minha conta" e "Agora não".
- **Travas e erros:** REQ-ACC-007, 009, 011 e `errorCopy` (003). Entram em `errorCopy`: `OWNER_CPF_LOCKED`, `OWNER_BIRTH_DATE_LOCKED`, `OWNER_NOT_FOUND`, `HOST_NOT_FOUND`, `HOST_NOT_A_COMPANY`, `PAYLOAD_TOO_LARGE`.

## Acessibilidade e responsividade

- `LockedField` anuncia "travado" e o motivo (`aria-describedby`), não só o ícone de cadeado.
- O campo de senha que aparece (REQ-ACC-005) entra com foco anunciado e não desloca o botão para fora da tela no celular.
- Upload: botão nativo de arquivo acessível por teclado; a prévia tem `alt` "Prévia da sua foto".
- Computador: cartão público à esquerda, formulário à direita; celular: cartão no topo, formulário embaixo.

## Fora do escopo

- Trocar o e-mail (a API não tem rota).
- Perfil público visto por outros (specs 042 e 053).
- Recebimentos do Stripe (spec 043).

## Perguntas em aberto

- **Trava do tutor sem sinal prévio:** a API não diz se o tutor já pagou (`OWNER_CPF_LOCKED` só aparece ao tentar). Pedir ao backend um campo `identityLocked` (ou `hasPaid`) no `GET /owners/me` para já mostrar `LockedField`. Até lá, REQ-ACC-007.
- **Anfitrião antes da aprovação:** não existe rota para editar telefone e endereço sem perfil de anfitrião (`PATCH /hosts/me` dá 404). Levar ao backend: rota de perfil da conta para quem ainda não foi aprovado, ou aceitar o REQ-ACC-011 (só leitura).
- **Foto antes da aprovação:** `PUT /hosts/me/avatar` para anfitrião sem perfil não está documentado; até confirmar, o envio de foto fica escondido no REQ-ACC-011.
- **Pausar com estadia marcada:** a API de estadias ainda não existe; quando existir, definir se pausar é bloqueado com estadia futura.
- **Divergência vault × API:** o vault diz "Tutor edita tudo (CPF até o primeiro pagamento)"; a API também trava o nascimento depois do pagamento. A spec segue a API.
