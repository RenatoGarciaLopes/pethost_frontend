---
spec: 010-login
status: in-progress
updated: 2026-10-11
area: AUTH
---

# 010 · Entrar

## Contexto

A porta de entrada das três contas. O medo aqui é técnico, não emocional:

- "esqueci se sou tutor ou anfitrião";
- "minha conta sumiu" (pausada ou suspensa).

A tela resolve isso com a escolha "Sou tutor / Sou anfitrião" no topo e mensagens de erro sem culpa. Ao mesmo tempo é a primeira impressão da marca: a cena da porta que abre quando a pessoa chega no formulário.

## Referências

- **Design:**
  - canvas → board `Fluxo-Conta` (computador e celular) → tela "Entrar", com o estado de erro em "Ver como aparece o erro";
  - vault: `design/20-conta-e-entrada.md` (cena da porta), `design/17-cadastros-e-formularios.md`, `design/00-criterios-de-aceite.md`.
- **API:**
  - ✅ `POST /api/v1/auth/sessions/login` `{ email, password, role }` → sessão;
  - erros `400 VALIDATION_ERROR`, `401 AUTH_INVALID_CREDENTIALS` (sempre a mesma resposta), `403 AUTH_ACCOUNT_DEACTIVATED`, `403 AUTH_ACCOUNT_SUSPENDED` e `429 TOO_MANY_REQUESTS` com `Retry-After`;
  - ✅ `POST /owners/reactivate` e `/hosts/reactivate` (mesmas credenciais; reativa e abre sessão);
  - fonte: `pethost_backend/docs/modulo-auth.md` seções 2.1 e 2.10.
- **Depende de:** 002 (`SegmentedControl`, `PasswordField`, `Notice`, `DoorScene`) e 003 (handler de login, `ApiError`, `getErrorMessage`, `getSession`).

## Histórias

- Como tutora, quero entrar com e-mail e senha escolhendo "Sou tutor" para ver meus pets e estadias.
- Como anfitriã com as duas contas, quero entender na hora quando escolhi o tipo errado.
- Como pessoa com a conta pausada, quero reativar ali mesmo, sem procurar outra tela.
- Como admin, quero uma entrada separada que não mostra cadastro.

## Critérios de aceite

| ID           | Critério                                                                                                                                                                                                                                                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-AUTH-001 | O SISTEMA DEVE mostrar "Você entra como" com "Sou tutor" e "Sou anfitrião"; "Sou tutor" vem marcado, e `?as=host` marca "Sou anfitrião"                                                                                                                                                                                                            |
| REQ-AUTH-002 | QUANDO o tipo de conta mudar, O SISTEMA DEVE trocar a ajuda abaixo dele ("Conta de quem tem pet e vai viajar." / "Conta de quem recebe pets em casa. Tem senha própria.")                                                                                                                                                                          |
| REQ-AUTH-003 | SE o e-mail estiver vazio ou com formato inválido, ou a senha vazia, O SISTEMA DEVE mostrar o erro no campo ao sair dele e todos de uma vez ao enviar, sem chamar a API                                                                                                                                                                            |
| REQ-AUTH-004 | QUANDO o formulário válido for enviado, O SISTEMA DEVE chamar o login do BFF com `{ email, password, role }`, mostrar o botão em estado de envio (`aria-busy`, sem mudar de tamanho) e impedir envio duplo                                                                                                                                         |
| REQ-AUTH-005 | QUANDO o login der certo, O SISTEMA DEVE ir para o `next` da URL se ele for um caminho interno seguro; senão, para a casa do papel: tutor → `/`, anfitrião → `/host`, admin → `/admin/host-applications`                                                                                                                                           |
| REQ-AUTH-006 | SE o `next` for uma URL absoluta, começar com `//` ou `\`, ou apontar para `/api`, O SISTEMA DEVE ignorá-lo (proteção contra redirecionamento aberto)                                                                                                                                                                                              |
| REQ-AUTH-007 | SE a API responder `AUTH_INVALID_CREDENTIALS`, O SISTEMA DEVE mostrar o aviso de erro "E-mail ou senha não batem com essa conta. Confere se você é tutor ou anfitrião aqui em cima." (frase de `errorCopy.ts`, fonte única)", levar o foco até ele, manter o e-mail e limpar a senha                                                               |
| REQ-AUTH-008 | SE a API responder `AUTH_ACCOUNT_DEACTIVATED`, O SISTEMA DEVE mostrar "Essa conta está pausada. Quer reativar? É só confirmar a senha." com o botão "Reativar minha conta", que chama a reativação do papel escolhido com as mesmas credenciais e, dando certo, segue como o REQ-AUTH-005                                                          |
| REQ-AUTH-009 | SE a API responder `AUTH_ACCOUNT_SUSPENDED`, O SISTEMA DEVE mostrar "Essa conta está suspensa. Fala com a gente pelo suporte." com o link de suporte e sem a opção de reativar                                                                                                                                                                     |
| REQ-AUTH-010 | SE a API responder `TOO_MANY_REQUESTS`, O SISTEMA DEVE mostrar "Muitas tentativas seguidas. Respira e tenta de novo em {n} segundos." com o `n` vindo do `Retry-After` e desabilitar o envio até lá, mostrando a contagem                                                                                                                          |
| REQ-AUTH-011 | SE houver erro de rede ou código desconhecido, O SISTEMA DEVE mostrar a mensagem genérica e manter os dados para tentar de novo                                                                                                                                                                                                                    |
| REQ-AUTH-012 | O campo de senha DEVE ter "Mostrar"/"Esconder" (REQ-DS-011)                                                                                                                                                                                                                                                                                        |
| REQ-AUTH-013 | O SISTEMA DEVE ter os links "Esqueci a senha" (`/forgot-password?as=<papel>`) e "Criar conta" (`/register/owner` ou `/register/host`, conforme o papel)                                                                                                                                                                                            |
| REQ-AUTH-014 | SE já houver sessão ao abrir `/login`, O SISTEMA DEVE redirecionar no servidor para a casa do papel (ou `next` seguro), sem piscar o formulário                                                                                                                                                                                                    |
| REQ-AUTH-015 | Em `/admin/login`, O SISTEMA DEVE usar o mesmo formulário com o papel fixo `admin`, sem a escolha de tipo, sem o link de cadastro e sem a cena da porta                                                                                                                                                                                            |
| REQ-AUTH-016 | No computador, A TELA DEVE mostrar a cena da porta à esquerda e o formulário à direita; QUANDO o formulário receber hover ou foco, a porta DEVE abrir e a luz aumentar (REQ-DS-015); com movimento reduzido, tudo parado                                                                                                                           |
| REQ-AUTH-017 | No celular (abaixo de 900 px, breakpoint `md`), A TELA DEVE mostrar o título e a cena pequena centralizados acima do formulário, sem as garantias, com o botão Entrar visível sem rolar num aparelho de 390 × 844                                                                                                                                  |
| REQ-AUTH-018 | Os tokens NUNCA DEVEM chegar ao JavaScript do navegador (a resposta do BFF traz só o `user`)                                                                                                                                                                                                                                                       |
| REQ-AUTH-019 | A página DEVE ter `<title>` "Entrar · PetHost" e não ser indexada (`robots: noindex`)                                                                                                                                                                                                                                                              |
| REQ-AUTH-020 | Ao abrir, A TELA DEVE se montar em ordem (saudação, título, cartão, campos um a um, garantias por último) com a mola "assentar", 60 ms entre blocos, sem segurar a tarefa: tudo clicável durante a entrada e assentado em menos de 0,7 s; com movimento reduzido, só a opacidade anima                                                             |
| REQ-AUTH-021 | A cena da porta DEVE se montar sozinha e ser de brincar (mouse na porta entreabre; clique na porta ou no capacho abre e volta; clique no gramado planta margarida, até 6; flores se sacodem; parallax com mouse), sem cachorro, sem foco de teclado (`aria-hidden`) e sem tirar o foco do formulário; com movimento reduzido, nada se mexe sozinho |

## Estados

| Estado        | O que aparece                                    |
| ------------- | ------------------------------------------------ |
| Inicial       | Formulário vazio, "Sou tutor" marcado            |
| Enviando      | Botão "Entrando…" desabilitado, `aria-busy`      |
| Erro de campo | Mensagem embaixo do campo, borda e ícone de erro |
| Erro da API   | `Notice` de erro no topo do formulário, com foco |
| Conta pausada | `Notice` de atenção com o botão de reativar      |
| Limite        | `Notice` de atenção com contagem regressiva      |

## Microcopy

- **Título:** "Entra que a porta tá aberta." · **Linha de apoio (computador):** "Que bom te ver".
- **Rótulos:** "Você entra como", "E-mail", "Senha"; botão "Entrar"; envio "Entrando…".
- **Erros de campo:** "Falta o e-mail.", "Esse e-mail parece incompleto.", "Falta a senha."
- **Erros da API:** conforme o REQ-AUTH-007 a 011 (fonte: `produto/contrato-api.md`).
- **Garantias (computador):** "Conversa antes de fechar", "Foto todo dia", "Pagamento guardado".

## Fora do escopo

- Telas de esqueci a senha (013) e de cadastro (011 e 012): esta spec só cria os links.
- Login social.
- "Lembrar de mim": a sessão já dura 30 dias pelo refresh.
