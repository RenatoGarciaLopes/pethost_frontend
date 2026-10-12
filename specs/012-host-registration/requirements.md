---
spec: 012-host-registration
status: draft
updated: 2026-10-11
area: HREG
---

# 012 · Criar conta de anfitrião

## Contexto

Quem quer receber pets em casa cria uma conta de anfitrião, que **ainda não é anfitriã**: o próximo passo é a verificação de identidade (spec 030). O medo aqui é "vão pedir meus documentos agora?". A tela responde que não: só os dados da conta, sem CPF (o CPF vai na verificação), e diz com clareza o que vem depois.

A mesma pessoa pode ter conta de tutor com o mesmo e-mail; cada conta tem senha própria (`design/20-conta-e-entrada.md`).

## Referências

- **Design:** canvas → board `Fluxo-Conta`, mesmas telas da 011 na variante anfitrião ("Agora mostra quem você é"); vault `design/20-conta-e-entrada.md` (tabela tutor × anfitrião), `design/17-cadastros-e-formularios.md`.
- **API:**
  - ✅ `POST /api/v1/users/register` `{ fullName, email, password, phone, birthDate, address }` → `201` com a sessão (`user` com `role: "host"`); `role` no corpo é ignorado;
  - erros: `400 VALIDATION_ERROR` (todos de uma vez, `address.*`, senha fraca com uma mensagem por regra, menos de 18), `409 AUTH_EMAIL_ALREADY_REGISTERED` (o mesmo e-mail como tutor é permitido), `429 TOO_MANY_REQUESTS`;
  - fonte: `pethost_backend/docs/modulo-auth.md` seção 2.7 e `modulo-hosts.md` seção 1.
- **Depende de:** 011 (`features/registration`, `AddressFields`, validações compartilhadas, ajuste T1 do handler), 004, 010.
- **Leva a:** 030 (Minha verificação).

## Histórias

- Como pessoa que quer receber pets, quero criar a conta sem mandar documento agora e entender que a verificação vem em seguida.
- Como tutora que também quer ser anfitriã, quero usar o mesmo e-mail e saber que a senha desta conta é outra.

## Critérios de aceite

| ID           | Critério                                                                                                                                                                                                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-HREG-001 | Em `/register/host`, O SISTEMA DEVE usar o mesmo cadastro em 2 passos da 011 sem o campo CPF, com a ajuda no topo: "O CPF e os documentos ficam pra verificação, no próximo passo."                                                                                                                                       |
| REQ-HREG-002 | O SISTEMA DEVE aplicar as mesmas validações da 011 (REQ-OREG-003 a 007, 016, 017), menos as do CPF                                                                                                                                                                                                                        |
| REQ-HREG-003 | O campo de senha DEVE ter a ajuda "Se você também tem conta de tutor, esta senha é só da conta de anfitrião."                                                                                                                                                                                                             |
| REQ-HREG-004 | QUANDO o passo 2 for enviado válido, O SISTEMA DEVE chamar o cadastro de anfitrião do BFF uma vez, sem `role` e sem CPF no corpo, com as mesmas normalizações da 011                                                                                                                                                      |
| REQ-HREG-005 | SE a API responder `AUTH_EMAIL_ALREADY_REGISTERED`, O SISTEMA DEVE mostrar "Esse e-mail já tem conta de anfitrião. Quer entrar?" com o link para `/login?as=host`                                                                                                                                                         |
| REQ-HREG-006 | Os erros `VALIDATION_ERROR`, `TOO_MANY_REQUESTS`, de rede e desconhecidos DEVEM seguir a 011 (REQ-OREG-009 e 012)                                                                                                                                                                                                         |
| REQ-HREG-007 | QUANDO o cadastro der certo, O SISTEMA DEVE limpar o cache, mostrar "Prazer, {primeiro nome}!" com "Sua conta de anfitrião está pronta. Agora mostra quem você é: é rapidinho e protege quem deixa o pet com você." e o botão "Começar a verificação" (`/host/application`); o secundário é "Fazer isso depois" (`/host`) |
| REQ-HREG-008 | Senha NUNCA DEVE ir para URL, storage, log ou analytics (REQ-OREG-014)                                                                                                                                                                                                                                                    |
| REQ-HREG-009 | SE já houver sessão, O SISTEMA DEVE redirecionar no servidor para a casa do papel (ou `next` seguro)                                                                                                                                                                                                                      |
| REQ-HREG-010 | A página DEVE ter `<title>` "Criar conta de anfitrião · PetHost" e `robots: noindex`                                                                                                                                                                                                                                      |

## Estados da tela

Os mesmos da 011, sem o campo CPF; sucesso com o convite para a verificação.

## Microcopy

- **Passo 1:** título "Primeiro, você". Ajuda do topo: "O CPF e os documentos ficam pra verificação, no próximo passo."
- **Sucesso:** "Prazer, {primeiro nome}!" / "Sua conta de anfitrião está pronta. Agora mostra quem você é: é rapidinho e protege quem deixa o pet com você."; botões "Começar a verificação" e "Fazer isso depois".
- Demais textos: os da 011.

## Acessibilidade e responsividade

As da 011.

## Fora do escopo

- A verificação (spec 030).
- Trocar para a conta de tutor (spec 014).

## Perguntas em aberto

- **Consentimento LGPD:** o mesmo ponto da 011.
- **Painel antes da aprovação:** `/host` (casa do anfitrião) ainda não tem spec própria antes da 053; até lá, "Fazer isso depois" leva a `/host/application`? Decidir junto com a 030.
