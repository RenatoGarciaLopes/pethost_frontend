---
spec: 013-password-recovery
status: in-progress
updated: 2026-10-12
---

# 013 · Design técnico

## Decisões tomadas na implementação (2026-10-12)

- **Sem `useLogout`:** a 004 ainda não tem o hook. `useResetPasswordMutation` chama o logout do BFF direto (melhor esforço) e depois `queryClient.clear()`.
- **Etapas sem máquina genérica:** `ForgotPasswordFlow` guarda `{ step: "request" | "sent" }`; `ResetPasswordFlow` deriva a etapa do token (`useUrlSecret`: `undefined` antes de ler, `null` sem token) e de um desfecho (`expired`, `missing`, `done`). Nenhuma combinação impossível de flags.
- **Peças da feature:** `StepHeading` (o `h1` que recebe o foco na troca de etapa), `ErrorNotice` (aviso que entra com a mola "assentar" e pega o foco só quando aparece) e `useErrorNotice` (429 com contagem e frase genérica), usados pelas três telas.
- **Rótulos da régua em `shared`:** `formCopy.passwordRules`; o `PasswordStrengthChecklist` lê dali e perdeu a prop `labels` (cadastro e senha nova usam a mesma frase).
- **`forgotPasswordPath(as?)`** em `appRoutes`; o login passou a usá-lo.
- **`Referrer-Policy`:** `metadata.referrer` na página e o cabeçalho em `next.config.ts` (`headers()` para `/reset-password`).
- **Contagem do reenvio:** a parte que conta fica fora da região viva; o leitor de tela ouve "Não chegou? Confere o spam" e, no fim, "ou manda de novo".
- **Token descartado:** depois do 401, o formulário some e o token não é mais usado; ele só vive na memória do componente até a pessoa sair da página.
- **Sucesso:** título "Senha nova guardada" e o texto "Por segurança, saímos da sua conta em todos os aparelhos." (a microcopy da spec virou título + texto).

## Rotas e renderização

| Arquivo                               | Tipo         | Faz                                                                                                            |
| ------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------- |
| `app/(auth)/forgot-password/page.tsx` | RSC          | lê `as` (`owner`, `host`, `admin`; inválido vira `owner`); renderiza `ForgotPasswordFlow`                      |
| `app/(auth)/reset-password/page.tsx`  | RSC estático | só a casca; o token é lido no cliente (o fragmento não chega ao servidor). `metadata.referrer = "no-referrer"` |

Nenhuma das duas lê sessão; funcionam logado ou não.

## Árvore de componentes

```
ForgotPasswordFlow (features/auth · client)      máquina: "pedido" → "enviado"
├─ ForgotPasswordForm                             SegmentedControl (oculto em admin), e-mail
└─ ResetLinkSent                                  texto neutro, useCountdown(60), reenviar, outro e-mail

ResetPasswordFlow (features/auth · client)       máquina: "sem-token" | "formulario" | "vencido" | "trocada"
├─ useResetTokenFromUrl()                         lê #token / ?token, limpa a URL, devolve o token em memória
├─ ResetPasswordForm                              PasswordField + PasswordStrengthChecklist
└─ ResetDone                                      confirmação + "Entrar"
```

A máquina de estados é um `useReducer` com tipo discriminado; cada estado renderiza um componente (sem combinações impossíveis de flags).

## Contratos e modelos

| Camada   | Símbolo                                                                                                    | Origem                                    | Nota                                          |
| -------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------- |
| DTO      | `PostApiV1AuthPasswordForgotBody`, `PostApiV1AuthPasswordResetBody`                                        | `shared/api/generated/password`           | reexportados em `features/auth/api/contracts` |
| Resposta | `emptyDataSchema` (`{}`)                                                                                   | `shared/api/contracts` (extrair o da 003) | as duas devolvem `data: {}`                   |
| Schemas  | `forgotPasswordSchema` (`email`, `role`), `resetPasswordSchema` (`newPassword` com `strongPasswordSchema`) | `features/auth/schemas`                   |                                               |

## Fluxo de dados

- `requestPasswordReset({ email, role })` → `bffClient` `POST /auth/password/forgot`.
- `resetPassword({ token, newPassword })` → `bffClient` `POST /auth/password/reset`.
- Sucesso do reset: `logout()` do BFF (melhor esforço, reaproveita `useLogout` da 004 sem navegar), `queryClient.clear()`.
- Nada vai para query key (são mutations).

## Erros

| Código                              | Tela                      | Comportamento                         |
| ----------------------------------- | ------------------------- | ------------------------------------- |
| `VALIDATION_ERROR` (pedido)         | campos                    | `applyFieldErrors(["email", "role"])` |
| `VALIDATION_ERROR` (`newPassword`)  | campo                     | mensagens no campo; token mantido     |
| `VALIDATION_ERROR` (`token`)        | estado "sem-token"        | igual ao REQ-PWD-006                  |
| `AUTH_PASSWORD_RESET_TOKEN_INVALID` | estado "vencido"          | token descartado                      |
| `TOO_MANY_REQUESTS`                 | `Notice` + `useCountdown` | envio bloqueado                       |
| rede / desconhecido                 | `Notice` genérico         | mantém os dados                       |

Pedido de link nunca mostra erro de "conta não encontrada": a API não devolve isso, e a tela não deve inventar.

## Reutiliza

002: `SegmentedControl`, `PasswordField`, `PasswordStrengthChecklist`, `Notice`. 003: proxy, `bffClient`, `getErrorMessage`, `applyFieldErrors`. 004: `useLogout`. 010: `useCountdown`. 011: `strongPasswordSchema`.

## Cria de reutilizável

| Recurso                                               | Vai para                          | Motivo                                                            |
| ----------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------- |
| `readSecretFromUrl(name)` + hook `useUrlSecret(name)` | `shared/lib/url` e `shared/hooks` | qualquer link com segredo (futuro convite, verificação de e-mail) |
| `emptyDataSchema`                                     | `shared/api/contracts`            | rotas sem retorno (logout, desativar, reset)                      |

## Matriz de testes

| REQ                     | Nível            | Arquivo                                                           | Caso                                                                                                                 |
| ----------------------- | ---------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 005                     | Unitário         | `readSecretFromUrl.test.ts`                                       | fragmento, query, os dois (fragmento vence), vazio, codificado                                                       |
| 007                     | Unitário         | `resetPasswordSchema.test.ts`                                     | reaproveita os casos de `password.test.ts`                                                                           |
| 001/002/003             | Componente (MSW) | `ForgotPasswordFlow.test.tsx`                                     | `as` marca o papel; admin sem escolha; payload; 200 mostra o texto neutro; nenhum dado da conta na tela              |
| 004                     | Componente       | idem (relógio falso)                                              | reenviar libera em 60 s; "Vale só o link mais novo"                                                                  |
| 005/006                 | Componente       | `ResetPasswordFlow.test.tsx`                                      | token do fragmento sai da URL (`replaceState` chamado); sem token mostra o aviso                                     |
| 007/008/009/010/011/012 | Componente (MSW) | `ResetPasswordFlow.errors.test.tsx`                               | régua bloqueia; envio único; 400 mantém o token; 401 esconde o formulário; sucesso chama logout e limpa o cache; 429 |
| 013                     | Arquitetura      | caso novo no `no-token-storage.test.ts`                           | nada de `token`/`newPassword` em storage ou log                                                                      |
| 013/014                 | E2E simulado     | `e2e/mocked/auth/password.spec.ts`                                | `document.referrer` vazio no destino; título e robots; URL sem token depois de abrir                                 |
| 002/005/011             | E2E simulado     | idem, desktop e mobile                                            | pedir link → abrir `/reset-password#token=t` → senha nova → "Entrar"                                                 |
| 002                     | E2E real         | `e2e/real/auth/password.spec.ts`                                  | pedido de link responde 200 e mostra o texto neutro (o e-mail em si não é lido)                                      |
| Visual                  | Storybook        | `ForgotPasswordFlow.stories.tsx`, `ResetPasswordFlow.stories.tsx` | cada estado; a11y sem violação                                                                                       |
