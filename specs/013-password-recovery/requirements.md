---
spec: 013-password-recovery
status: draft
updated: 2026-10-11
area: PWD
---

# 013 · Esqueci e troquei a senha

## Contexto

Duas telas: pedir o link (`/forgot-password`) e criar a senha nova (`/reset-password`). O medo é "não sei mais entrar" e, para quem tem as duas contas, "qual das senhas eu esqueci?". A tela pede o tipo de conta (a API exige) e **nunca revela** se o e-mail tem conta. O link vale 30 minutos, serve uma vez, e trocar a senha derruba todas as sessões da conta.

## Referências

- **Design:** canvas → board `Fluxo-Conta` → "Esqueci a senha" e "Link enviado"; vault `design/20-conta-e-entrada.md` (seção "Esqueci a senha").
- **API:**
  - ✅ `POST /api/v1/auth/password/forgot` `{ email, role }` → **sempre** `200` `{ data: {} }` (exista a conta ou não; conta suspensa também recebe 200 sem e-mail); `400 VALIDATION_ERROR` só para campo faltando ou papel desconhecido; `429`;
  - ✅ `POST /api/v1/auth/password/reset` `{ token, newPassword }` → `200`, todas as sessões da conta encerradas; `400 VALIDATION_ERROR` em `newPassword` (uma mensagem por regra; o token **não** é gasto); `401 AUTH_PASSWORD_RESET_TOKEN_INVALID` (inexistente, vencido, usado ou substituído); `429`;
  - o link do e-mail vem de `PasswordReset:ResetUrl` (configuração do backend, precisa conter `{token}`);
  - fonte: `pethost_backend/docs/modulo-auth.md` seções 2.4, 2.5, 6.2, 6.3 e 8.
  - As duas rotas passam pelo proxy do BFF (lista permitida da 003); nenhuma devolve sessão.
- **Depende de:** 002 (`SegmentedControl`, `PasswordField`, `PasswordStrengthChecklist`, `Notice`), 003 (proxy, `bffClient`, `getErrorMessage`), 010 (`useCountdown`), 011 (`strongPasswordSchema`).

## Histórias

- Como pessoa que esqueceu a senha, quero receber um link sem ter que lembrar mais nada.
- Como pessoa com as duas contas, quero escolher de qual conta é a senha que esqueci.
- Como pessoa cuidadosa, quero que trocar a senha tire da conta quem estava usando a antiga.

## Critérios de aceite

| ID          | Critério                                                                                                                                                                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-PWD-001 | Em `/forgot-password`, O SISTEMA DEVE pedir "Sua conta é de" (`SegmentedControl` tutor/anfitrião, marcado por `?as=`) e o e-mail; admin usa `/forgot-password?as=admin` sem a escolha                                                                                 |
| REQ-PWD-002 | QUANDO o pedido for enviado válido, O SISTEMA DEVE chamar `POST /api/auth/password/forgot` e, com `200`, mostrar sempre a mesma tela: "Se existir uma conta com esse e-mail, o link chega em instantes. Ele vale 30 minutos."                                         |
| REQ-PWD-003 | A tela de confirmação NÃO DEVE mostrar nada que diferencie e-mail com ou sem conta (mesmo texto, mesmo tempo de resposta percebido, nenhum dado da conta)                                                                                                             |
| REQ-PWD-004 | A tela de confirmação DEVE oferecer "Mandar de novo" liberado depois de 60 s (contagem visível) e "Usar outro e-mail"; reenviar invalida o link anterior e a tela DEVE avisar: "Vale só o link mais novo."                                                            |
| REQ-PWD-005 | Em `/reset-password`, O SISTEMA DEVE ler o token do fragmento (`#token=`) ou da query (`?token=`), guardá-lo só em memória e **removê-lo da barra de endereço** na primeira renderização (`history.replaceState`)                                                     |
| REQ-PWD-006 | SE não houver token, O SISTEMA DEVE mostrar "Esse link está incompleto. Pede um novo, leva um minuto." com o link para `/forgot-password`                                                                                                                             |
| REQ-PWD-007 | O SISTEMA DEVE pedir a senha nova com `PasswordField` ("Mostrar"/"Esconder") e a régua viva; o envio só libera com as 5 regras cumpridas                                                                                                                              |
| REQ-PWD-008 | QUANDO a senha nova for enviada, O SISTEMA DEVE chamar `POST /api/auth/password/reset` `{ token, newPassword }` uma vez, com `aria-busy`                                                                                                                              |
| REQ-PWD-009 | SE a API responder `VALIDATION_ERROR` em `newPassword`, O SISTEMA DEVE mostrar as mensagens no campo e manter o token (dá para tentar de novo)                                                                                                                        |
| REQ-PWD-010 | SE a API responder `AUTH_PASSWORD_RESET_TOKEN_INVALID`, O SISTEMA DEVE mostrar "Esse link já venceu. Pede outro, leva um minuto." com o link para `/forgot-password`, descartar o token e esconder o formulário                                                       |
| REQ-PWD-011 | QUANDO a troca der certo, O SISTEMA DEVE chamar o logout do BFF (para apagar cookies de uma sessão antiga neste navegador), limpar o cache e mostrar "Senha nova guardada. Por segurança, saímos da sua conta em todos os aparelhos." com o botão "Entrar" (`/login`) |
| REQ-PWD-012 | SE a API responder `TOO_MANY_REQUESTS`, O SISTEMA DEVE mostrar a contagem do `Retry-After` e bloquear o envio; erro de rede mostra a mensagem genérica e mantém o que foi digitado                                                                                    |
| REQ-PWD-013 | Token e senha NUNCA DEVEM ir para storage, log, analytics nem ficar na URL depois do REQ-PWD-005; `/reset-password` DEVE ter `Referrer-Policy: no-referrer`                                                                                                           |
| REQ-PWD-014 | As duas páginas DEVEM ter `<title>` próprio ("Esqueci a senha · PetHost", "Senha nova · PetHost") e `robots: noindex`; funcionam com ou sem sessão                                                                                                                    |

## Estados da tela

| Estado                   | O que aparece                                             |
| ------------------------ | --------------------------------------------------------- |
| Pedido                   | Tipo de conta + e-mail + "Mandar o link"                  |
| Enviando                 | "Mandando…", `aria-busy`                                  |
| Link enviado             | Texto neutro, contagem para reenviar, "Usar outro e-mail" |
| Senha nova               | Campo de senha com régua                                  |
| Sem token / link vencido | Aviso com o caminho para pedir outro, sem formulário      |
| Senha trocada            | Confirmação e "Entrar"                                    |
| Limite                   | `Notice` com contagem                                     |

## Microcopy

- **Pedido:** título "Esqueceu a senha? Acontece."; "Sua conta é de" (Tutor / Anfitrião); "E-mail da conta"; botão "Mandar o link"; envio "Mandando…".
- **Link enviado:** título "Olha seu e-mail"; "Se existir uma conta com esse e-mail, o link chega em instantes. Ele vale 30 minutos."; "Não chegou? Confere o spam ou manda de novo em {n} s."; botões "Mandar de novo", "Usar outro e-mail"; "Vale só o link mais novo."
- **Senha nova:** título "Cria uma senha nova"; rótulo "Senha nova"; botão "Guardar senha nova"; envio "Guardando…".
- **Sucesso:** "Senha nova guardada. Por segurança, saímos da sua conta em todos os aparelhos."; botão "Entrar".
- **Erros:** de `errorCopy` (003) e REQ-PWD-006 e 010.

## Acessibilidade e responsividade

- Troca de estado (pedido → link enviado; senha → sucesso) leva o foco ao novo título.
- Contagem anunciada só no início e no fim (`aria-live="polite"` com texto estável), não a cada segundo.
- Uma coluna em todas as larguras; botão visível sem rolar em 390 × 844.

## Fora do escopo

- Troca de senha logado (spec 015, `POST /users/me/password`).
- Envio de e-mail e o texto do e-mail (backend).

## Perguntas em aberto

- **Formato do link (backend):** recomendar `PasswordReset__ResetUrl=https://<app>/reset-password#token={token}`. No fragmento, o token não chega aos logs do servidor nem a terceiros pelo `Referer`. O front aceita os dois formatos (REQ-PWD-005).
- **Confirmar a senha:** o design não tem o campo "repetir a senha"; com "Mostrar" e a régua, fica sem confirmação. Confirmar com o design.
- **Papel no link:** o token não diz de qual conta é. Depois de trocar, "Entrar" não sabe marcar tutor ou anfitrião; o backend poderia incluir `as=<papel>` no `ResetUrl`.
