---
spec: 014-account-switch
status: in-progress
updated: 2026-10-13
area: SWITCH
---

# 014 · Trocar de conta

## Contexto

A mesma pessoa pode ter conta de tutor e de anfitrião com o mesmo e-mail, cada uma com sua senha. Trocar de uma para a outra pede a **senha da conta de destino**: o e-mail ainda não é verificado, e sem a senha quem criasse uma conta com o e-mail de outra pessoa entraria na conta dela (`modulo-auth.md` seção 2.11). O medo é "perdi minha outra conta?" e "por que pede senha de novo?". A tela explica em uma frase e deixa a troca a um campo de distância.

O item de menu que leva até aqui é da 004 (REQ-SHELL-004); esta spec entrega a página e o efeito da troca.

## Referências

- **Design:** canvas → board `Fluxo-Conta` → "Trocar de conta"; vault `design/20-conta-e-entrada.md` (seção "Trocar de conta") e `design/21-mapa-de-telas.md` (cor do cabeçalho por conta).
- **API:**
  - ✅ `GET /api/v1/users/me/accounts` → `[{ role, isActive, isCurrent }]` (contas com o mesmo e-mail da conta do token);
  - ✅ `POST /api/v1/auth/sessions/switch` `{ role, password }` → sessão da outra conta (`user`); a sessão atual continua válida na API;
  - erros: `400 VALIDATION_ERROR` (`role` diferente de `owner`/`host` ou senha vazia), `404 AUTH_LINKED_ACCOUNT_NOT_FOUND` (não há conta ativa nesse papel, ou a senha não confere, ou é o papel atual: **mesma resposta nos três casos**), `429`;
  - o handler `POST /api/auth/sessions/switch` já existe na 003 (autenticado, regrava os cookies).
- **Depende de:** 003 (handler de troca, `getSession`), 004 (`AccountMenu`, `useLinkedAccounts`, `requireRole`, `homeOf`), 002 (`PasswordField`, `Notice`, `EmptyState`), 010 (`useCountdown`), 013 (link de esqueci a senha).

## Histórias

- Como tutora que também é anfitriã, quero passar para a conta de anfitriã sem sair e entrar de novo.
- Como pessoa que não lembra a senha da outra conta, quero um caminho para recuperar só aquela senha.
- Como pessoa que só tem uma conta, quero entender que posso criar a outra.

## Critérios de aceite

| ID             | Critério                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| REQ-SWITCH-001 | `/users/switch` DEVE exigir sessão de tutor ou anfitrião (`requireRole(["owner", "host"])`); admin vai para a casa dele                                                                                                                                                                                                                                                                                                        |
| REQ-SWITCH-002 | O SISTEMA DEVE mostrar a conta atual e a de destino: "Você está na conta de tutor" e "Entrar na conta de anfitrião" (ou o inverso), com a cor do cabeçalho de cada conta como pista visual que não depende só de cor                                                                                                                                                                                                           |
| REQ-SWITCH-003 | QUANDO `GET /users/me/accounts` NÃO trouxer a outra conta, O SISTEMA DEVE mostrar "Você ainda não tem conta de {anfitrião / tutor}." com o botão para `/register/host` ou `/register/owner`; SE a outra conta existir mas estiver inativa, mostrar "Sua conta de {…} está pausada." com o link para `/login?as=<papel>` (onde se reativa)                                                                                      |
| REQ-SWITCH-004 | O SISTEMA DEVE pedir só a senha da conta de destino, com a ajuda "Cada conta tem a própria senha. Use a da conta de {…}." e o link "Esqueci essa senha" (`/forgot-password?as=<destino>`)                                                                                                                                                                                                                                      |
| REQ-SWITCH-005 | QUANDO a senha for enviada, O SISTEMA DEVE chamar o BFF com `{ role: <destino>, password }` uma vez, com `aria-busy`                                                                                                                                                                                                                                                                                                           |
| REQ-SWITCH-006 | QUANDO a troca der certo, O SISTEMA DEVE limpar todo o cache do TanStack Query, ir para a casa do novo papel (`homeOf`) com `router.replace` e `router.refresh()`, e anunciar "Agora você está na conta de {…}."                                                                                                                                                                                                               |
| REQ-SWITCH-007 | SE a API responder `AUTH_LINKED_ACCOUNT_NOT_FOUND`, O SISTEMA DEVE mostrar "Não deu pra abrir a outra conta. Confere a senha dela.", limpar a senha e focar o campo; NÃO DEVE sugerir que a conta não existe                                                                                                                                                                                                                   |
| REQ-SWITCH-008 | SE a API responder `TOO_MANY_REQUESTS`, O SISTEMA DEVE mostrar a contagem e bloquear o envio; `SESSION_EXPIRED` segue a 003 (login com `next=/users/switch`)                                                                                                                                                                                                                                                                   |
| REQ-SWITCH-009 | QUANDO a troca der certo, O BFF DEVE revogar o refresh token da sessão anterior (melhor esforço), porque o navegador deixa de guardá-lo                                                                                                                                                                                                                                                                                        |
| REQ-SWITCH-010 | A senha NUNCA DEVE ir para URL, storage, log ou analytics                                                                                                                                                                                                                                                                                                                                                                      |
| REQ-SWITCH-011 | O destino pode vir em `?to=owner                                                                                                                                                                                                                                                                                                                                                                                               | host`; valor ausente ou inválido usa "a outra conta"; destino igual ao papel atual cai no REQ-SWITCH-002 com a outra conta |
| REQ-SWITCH-013 | O retorno pode vir em `?next=` (só caminho interno seguro, `toSafeInternalPath`): QUANDO a troca der certo, O SISTEMA DEVE ir para o `next` em vez da casa do novo papel; "Agora não", o cadastro da outra conta e o login da conta pausada DEVEM levar o mesmo `next`. Sem `next` ou com `next` inseguro, vale a casa (REQ-SWITCH-006). Primeiro uso: o anfitrião que pede estadia na página do cantinho (042, REQ-LPAGE-007) |
| REQ-SWITCH-012 | A página DEVE ter `<title>` "Trocar de conta · PetHost" e `robots: noindex`                                                                                                                                                                                                                                                                                                                                                    |

## Estados da tela

| Estado                | O que aparece                                  |
| --------------------- | ---------------------------------------------- |
| Carregando contas     | `SniffLoader` pequeno no lugar do formulário   |
| Pode trocar           | Conta atual → conta de destino, campo de senha |
| Sem a outra conta     | `EmptyState` com o cadastro da outra conta     |
| Outra conta pausada   | Aviso com o link para reativar no login        |
| Enviando              | "Trocando…", `aria-busy`                       |
| Senha não confere     | `Notice` de erro, campo vazio e focado         |
| Limite                | `Notice` com contagem                          |
| Erro ao listar contas | `ErrorState` com "Tentar de novo"              |

## Microcopy

- **Título:** "Trocar de conta".
- **Atual → destino:** "Você está na conta de tutor" / "Entrar na conta de anfitrião".
- **Senha:** rótulo "Senha da conta de anfitrião"; ajuda "Cada conta tem a própria senha. Use a da conta de anfitrião."; link "Esqueci essa senha".
- **Botões:** "Entrar na conta de anfitrião"; envio "Trocando…"; "Agora não" (volta para o `next` da URL ou para a casa da conta atual).
- **Sem a outra conta:** "Você ainda não tem conta de anfitrião." / botão "Criar conta de anfitrião".
- **Sucesso (anúncio):** "Agora você está na conta de anfitrião."

## Acessibilidade e responsividade

- O anúncio do sucesso vai para a região `aria-live` da casca (a página muda de rota).
- A diferença entre as contas é dita em texto, não só pela cor.
- Uma coluna em todas as larguras.

## Fora do escopo

- Guardar as duas sessões para alternar sem senha (a API permite, mas aumenta a superfície; decisão: uma sessão por navegador).
- Reativar a outra conta daqui (fica no login, 010).

## Perguntas em aberto

- **Tratamento no menu e aqui:** "conta de tutor" e "conta de anfitrião" são neutros de propósito; o vault usa "tutora/anfitriã" nos exemplos. Sem campo de tratamento na API, ficam neutros.
- **Divergência vault × API:** o vault diz "Trocar pra anfitriã" no menu (`design/20-conta-e-entrada.md`); a 004 já usa a forma neutra.
