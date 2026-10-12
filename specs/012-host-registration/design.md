---
spec: 012-host-registration
status: draft
updated: 2026-10-11
---

# 012 · Design técnico

## Rotas e renderização

| Arquivo                             | Tipo         | Faz                                                                           |
| ----------------------------------- | ------------ | ----------------------------------------------------------------------------- |
| `app/(auth)/register/host/page.tsx` | RSC dinâmico | guarda de sessão igual à 011; `RegistrationScreen variant="host" next={next}` |

## Árvore de componentes

A mesma da 011 (`features/registration`). A variante muda só:

| Ponto                 | `owner`                   | `host`                                       |
| --------------------- | ------------------------- | -------------------------------------------- |
| `CpfField` no passo 1 | sim                       | não                                          |
| Schema                | `ownerRegistrationSchema` | `hostRegistrationSchema = accountFormSchema` |
| Mapper                | `toOwnerRegisterBody`     | `toHostRegisterBody` (sem `cpf`, sem `role`) |
| Rota do BFF           | `/owners/register`        | `/users/register`                            |
| Contexto de erro      | `{ role: "owner" }`       | `{ role: "host" }`                           |
| Sucesso               | "Apresentar meu pet"      | "Começar a verificação"                      |

A variante vive numa tabela (`REGISTRATION_VARIANTS` em `features/registration/lib`), não em `if` espalhado: cada componente lê a configuração da variante (aberto para extensão, fechado para modificação).

## Contratos e modelos

| Camada                | Símbolo                      | Origem                              |
| --------------------- | ---------------------------- | ----------------------------------- |
| DTO                   | `PostApiV1UsersRegisterBody` | `shared/api/generated/users`        |
| Resposta ao navegador | `SessionResult`              | 003                                 |
| Schema                | `hostRegistrationSchema`     | `features/registration/schemas`     |
| Mapper                | `toHostRegisterBody`         | `features/registration/api/mappers` |

## Fluxo de dados

`registerHost(values)` → `bffClient` `POST /users/register`. Mesmo `useRegisterMutation(variant)` da 011.

## Erros

Os da 011, com `AUTH_EMAIL_ALREADY_REGISTERED` no contexto `role: "host"`. Não existe 409 de CPF aqui.

## Reutiliza

Tudo da 011: `features/registration`, `AddressFields`, `BirthDateField`, `strongPasswordSchema`, `isAdult`, `useCepLookup`, o handler `POST /api/users/register` (003).

## Cria de reutilizável

`REGISTRATION_VARIANTS` (interno da feature). Nada novo no catálogo.

## Matriz de testes

| REQ         | Nível            | Arquivo                                          | Caso                                                          |
| ----------- | ---------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| 002         | Unitário         | `hostRegistrationSchema.test.ts`                 | sem CPF; demais regras iguais (teste parametrizado com a 011) |
| 004         | Unitário         | `toHostRegisterBody.test.ts`                     | sem `cpf` e sem `role`                                        |
| 001/003     | Componente       | `RegistrationWizard.host.test.tsx`               | sem CPF; ajudas do topo e da senha                            |
| 004/005/006 | Componente (MSW) | idem                                             | rota certa; 409 com texto de anfitrião e link `as=host`       |
| 007         | Componente       | `RegistrationSuccess.test.tsx` (caso host)       | texto e botões da verificação                                 |
| 009         | E2E simulado     | `e2e/mocked/registration/host.spec.ts`           | com sessão redireciona                                        |
| 001/004/007 | E2E simulado     | idem, desktop e mobile                           | jornada completa → `/host/application`                        |
| 004/007     | E2E real         | `e2e/real/registration/host.spec.ts`             | e-mail único por execução, ambiente de teste                  |
| Visual      | Storybook        | `RegistrationWizard.stories.tsx` (variante host) | a11y sem violação                                             |
| 008         | Arquitetura      | `src/test/architecture/no-token-storage.test.ts` | senha fora de storage, log e URL (padrão `password            | senha` já coberto) |
| 010         | Integração (RSC) | `app/(auth)/register/host/page.test.ts`          | `metadata.title` e `robots.index = false`                     |
