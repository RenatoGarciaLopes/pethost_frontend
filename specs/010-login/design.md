---
spec: 010-login
status: in-progress
updated: 2026-10-11
---

# 010 · Design técnico

## Rotas e renderização

| Arquivo                           | Tipo                     | Faz                                                                                                                                                                                                       |
| --------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(auth)/login/page.tsx`       | RSC dinâmico (lê cookie) | `LoginGate` fica sob `<Suspense>` e `redirectIfSignedIn(next)` espera `connection()` antes de ler a sessão; com sessão redireciona para `resolvePostLoginPath(role, next)`, senão renderiza `LoginScreen` |
| `app/(auth)/admin/login/page.tsx` | RSC                      | Igual, com `variant="admin"`                                                                                                                                                                              |
| `app/(auth)/layout.tsx`           | RSC                      | Cabeçalho simples da marca (sem menu); metadados `robots: noindex`                                                                                                                                        |

Sem `'use cache'` (lê sessão). Texto e layout são servidor; ilhas client: o formulário, a cena (`DoorScene`, Motion) e os `Reveal` da montagem (REQ-AUTH-020).

## Árvore

```
LoginScreen (features/auth · server)          layout de duas colunas / empilhado no celular
├─ Reveal (shared/ui/motion · client)        saudação, título, cartão, campos e garantias entram em ordem
├─ DoorScene (shared/ui/brand · client, Motion) aria-hidden; monta-se sozinha, reage ao formulário pelos atributos, é de brincar
├─ TrustList (shared/ui/data-display · server) só no computador
└─ LoginForm (features/auth · client)         a ilha
   ├─ SegmentedControl  (shared/ui/forms)     REQ-AUTH-001/002 (oculto no admin)
   ├─ TextField e-mail · PasswordField
   ├─ Notice (shared/ui/feedback)             erros e pausada/suspensa/limite
   └─ links: ForgotPassword · Register
```

## Contratos e modelos

| Símbolo                               | Onde                                                   | Nota                                                                                                                           |
| ------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `LoginRequest`                        | `shared/api/generated` → `features/auth/api/contracts` | `{ email, password, role }`                                                                                                    |
| `SessionUser`                         | `shared/auth/contracts/session.ts`                     | O BFF devolve só isso                                                                                                          |
| `loginFormSchema` / `LoginFormValues` | `features/auth/schemas/loginFormSchema.ts`             | email (trim, minúsculas, formato), password (obrigatória, máx. 128, **sem** regra de força: o login não vaza a política), role |
| `toLoginRequest`                      | `features/auth/api/client/auth.client.ts` (interno)    | Values → request                                                                                                               |
| `AccountRole`                         | `shared/auth/contracts`                                | `'owner' \| 'host' \| 'admin'`                                                                                                 |

## Lógica pura (`features/auth/lib`)

- `toSafeInternalPath(next, fallback)` (spec 003, `shared/lib/url`): já pronto; aceita só caminho interno (recusa `//`, ``, esquema, controle e `/api`).
- `resolvePostLoginPath(role, next?)` e `ROLE_HOME` (spec 004, `shared/config/appRoutes.ts`): `next` seguro ou a casa do papel. Já prontos; a 010 só usa.
- `authCopy`: rótulos, ajuda por papel e microcopy de erro desta tela, que reaproveita `getErrorMessage` da 003 para os códigos.
- `secondsUntil(retryAfterSeconds, now)` vem de `shared/lib/time` se ainda não existir lá.

## Dados e efeitos

- `useLoginMutation()` (`features/auth/hooks`): `mutationFn = login(values)` (`api/client/auth.client.ts` → `POST /api/auth/sessions/login`). No sucesso: `queryClient.clear()` (nada da sessão anterior), `router.replace(resolvePostLoginPath(user.role, next))` e `router.refresh()`.
- `useReactivateMutation(role)`: `POST /api/owners/reactivate` ou `/api/hosts/reactivate`, com o mesmo sucesso do login.
- Contagem do limite: `useCountdown(seconds)` em `shared/hooks` (reutilizável).

## Erros

| Código                     | Componente                      | Comportamento      |
| -------------------------- | ------------------------------- | ------------------ |
| `VALIDATION_ERROR`         | campos                          | `applyFieldErrors` |
| `AUTH_INVALID_CREDENTIALS` | `Notice` erro + foco            | limpa a senha      |
| `AUTH_ACCOUNT_DEACTIVATED` | `Notice` atenção + botão        | reativação         |
| `AUTH_ACCOUNT_SUSPENDED`   | `Notice` erro + link de suporte | N/A                |
| `TOO_MANY_REQUESTS`        | `Notice` atenção + contagem     | envio bloqueado    |
| `NETWORK_ERROR` / outros   | `Notice` erro genérico          | mantém os dados    |

## Reutiliza

De 002: `SegmentedControl`, `PasswordField`, `Notice`, `DoorScene`, tema. De 003: o handler de login, `ApiError`, `getErrorMessage`, `applyFieldErrors`, `getSession` e `bffClient`.

## Cria de reutilizável

| Recurso                                                                                         | Vai para                 | Motivo                                                  |
| ----------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------- |
| `useCountdown`                                                                                  | `shared/hooks`           | 013 (reenviar o link) e o limite em qualquer formulário |
| `TrustList`                                                                                     | `shared/ui/data-display` | home e cadastro                                         |
| (nenhum: `toSafeInternalPath` e `resolvePostLoginPath` já existem em `shared`, specs 003 e 004) |                          |                                                         |

## Matriz de testes

| REQ                     | Nível            | Arquivo                                                                                     | Caso                                                                                                                                       |
| ----------------------- | ---------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 003                     | Unitário         | `loginFormSchema.test.ts`                                                                   | vazio; e-mail inválido; normaliza maiúsculas e espaços; 128 caracteres passa, 129 não                                                      |
| 005/006                 | Unitário         | `shared/config/appRoutes.test.ts`, `shared/lib/url/toSafeInternalPath.test.ts` (já existem) | tabela por papel; next válido; `https://`, `//evil`, `/\evil`, `/api/x`, `javascript:` rejeitados                                          |
| 001/002/003/004/012/013 | Componente       | `LoginForm.test.tsx`                                                                        | papel padrão e `as=host`; ajuda muda; validação no blur e no submit; payload enviado; `aria-busy`; sem envio duplo; links certos por papel |
| 007/008/009/010/011     | Componente (MSW) | `LoginForm.errors.test.tsx`                                                                 | cada código → texto, tom e foco; reativar chama a rota certa; contagem bloqueia e libera (relógio falso)                                   |
| 004/005/018             | Integração       | `useLoginMutation.int.test.tsx`                                                             | sucesso limpa o cache e navega; o corpo de resposta não tem token                                                                          |
| 015                     | Componente       | `LoginForm.admin.test.tsx`                                                                  | sem segmentado, sem cadastro, role `admin` no payload                                                                                      |
| 014                     | E2E simulado     | `e2e/mocked/auth/login.spec.ts`                                                             | com cookie de sessão → `/login` redireciona                                                                                                |
| 005/007/016/017         | E2E simulado     | idem, projetos desktop e mobile                                                             | jornada tutor → `/`; anfitrião → `/host`; erro de credencial; cena presente no desktop; botão visível sem rolar no mobile                  |
| 018                     | E2E simulado     | idem                                                                                        | `document.cookie` não contém o token (HttpOnly)                                                                                            |
| 019                     | E2E simulado     | idem                                                                                        | `title` e meta robots                                                                                                                      |
| 005                     | E2E real         | `e2e/real/auth/login.spec.ts`                                                               | login do anfitrião de demonstração do seed (`SEED_DEMO_HOST_*`, credenciais lidas do ambiente de teste, nunca no código)                   |
| Visual                  | Storybook        | `LoginForm.stories.tsx`                                                                     | padrão, anfitrião, admin, cada erro, enviando, celular; a11y sem violação                                                                  |
