---
spec: 011-owner-registration
status: in-progress
updated: 2026-10-12
---

# 011 · Design técnico

## Decisões tomadas na implementação (2026-10-12)

- **Escolha em `/register`:** os cartões do design system são radio (`ChoiceCard` não serve de link), então a escolha marca o cartão e o botão "Continuar como …" leva ao formulário. REQ-OREG-001 ajustado.
- **Sem `router.refresh()` no sucesso:** a página de cadastro com sessão redireciona (REQ-OREG-015); um refresh tiraria a pessoa da tela de sucesso. A mutação só tira as queries do cache (`removeQueries`); o cache de mutações fica, porque a tela de sucesso lê o resultado.
- **Guarda das telas de quem não entrou:** `redirectIfSignedIn(next)` em `shared/auth/server`, usada também pelo login e pelo login de admin (antes repetida em cada página).
- **Links:** `registerPath(role?, next?)` e `loginRedirectPath(next, as?)` em `appRoutes`; o "Criar conta" do login passou a levar o `next`.
- **Schema de endereço em `shared`:** `createAddressSchema(messages)` (as frases vêm de quem usa), para 012, 015 e 030.
- **Uma regra de senha só:** `PASSWORD_RULES` e `PASSWORD_MAX` em `shared/lib/validation/password.ts`; a régua, o cadastro e o login (limite de 128) leem dali.
- **Rótulos:** em tinta com foco e sem asterisco no tema (`overrides/FormLabel.ts`), conforme a regra 6 de `17-cadastros-e-formularios.md`.
- **`FormActions`** ganhou `busy` (desabilita e marca `aria-busy`) e fica transparente a partir de `sm`.
- **CSP:** o projeto ainda não tem CSP; quando tiver, liberar `connect-src https://viacep.com.br`.
- **Depois da 012:** a feature virou tabela de variantes (`REGISTRATION_VARIANTS`); os arquivos `ownerRegistrationSchema.ts` e `toOwnerRegisterBody.ts` da matriz abaixo viraram `registrationSchemas.ts` e `toRegisterBody.ts`, e `registerOwner` virou `registerAccount(path, body)`. Ver `specs/012-host-registration/design.md`.
- **Re-renderização:** o wizard não assina valores do formulário; a régua da senha fica dentro do `Controller` da senha; `ServerFormError` assina só `errors.root`; `AddressFields` observa só o CEP.

## Decisão: onde mora o formulário de conta

O cadastro de tutor (011) e o de anfitrião (012) são **a mesma jornada** com duas diferenças: o CPF e a rota da API. Opções avaliadas:

| Opção                                                             | Problema                                                                                |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `features/owners` + `features/users`, cada uma com seu formulário | 90% duplicado; uma feature não pode importar a outra                                    |
| `widgets/account-registration` compondo duas features             | widget sem regra própria, só para contornar a fronteira; os schemas ficariam espalhados |
| `shared/ui/forms/AccountForm`                                     | `shared` não pode conhecer contratos de cadastro nem papéis de negócio                  |
| **`features/registration` com `variant: "owner" \| "host"`**      | escolhida: uma feature, uma jornada, um schema base estendido pelo tutor                |

Os pedaços **sem domínio de cadastro** que outras telas usam vão para `shared` (endereço, CEP, CPF, senha forte, maioridade). Assim 015 (perfil) e 030 (verificação) reaproveitam sem importar `features/registration`.

## Rotas e renderização

| Arquivo                              | Tipo         | Faz                                                                                              |
| ------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------ |
| `app/(auth)/register/page.tsx`       | RSC dinâmico | `getSession()` → se houver, `redirect(resolvePostLoginPath(role, next))`; senão `RegisterChoice` |
| `app/(auth)/register/owner/page.tsx` | RSC dinâmico | mesma guarda; renderiza `RegistrationScreen variant="owner" next={next}`                         |
| `app/(auth)/layout.tsx`              | RSC (da 010) | cabeçalho simples, `robots: noindex`                                                             |

Sem `'use cache'` (lê sessão). A ilha é o `RegistrationWizard`.

## Árvore de componentes

```
RegisterChoice (features/registration · server)
└─ ChoiceCardGroup (shared/ui/forms) como links            REQ-OREG-001

RegistrationScreen (features/registration · server)       título, texto lateral do computador
└─ RegistrationWizard (features/registration · client)    estado do passo, RHF único para os 2 passos
   ├─ WizardProgress (shared/ui/navigation)               REQ-OREG-002
   ├─ PersonStep (client)                                  nome, e-mail, PasswordField + PasswordStrengthChecklist,
   │                                                       telefone (MaskedTextField), BirthDateField, CpfField (só owner)
   ├─ AddressStep (client)
   │  └─ AddressFields (shared/ui/forms · client)          CEP + useCepLookup + campos, prefixo de nome configurável
   ├─ Notice (shared/ui/feedback)                          erros da API, limite
   ├─ FormActions (shared/ui/forms)                        REQ-OREG-017
   └─ RegistrationSuccess (client)                         Celebration + próximos passos (REQ-OREG-013)
```

## Contratos e modelos

| Camada                | Símbolo                       | Origem                              | Nota                                                                                                                                    |
| --------------------- | ----------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| DTO                   | `PostApiV1OwnersRegisterBody` | `shared/api/generated/owners`       | reexportado em `features/registration/api/contracts`                                                                                    |
| Resposta ao navegador | `SessionResult` (`{ user }`)  | `shared/auth/contracts/session.ts`  | o BFF devolve só isto                                                                                                                   |
| Schema base           | `accountFormSchema`           | `features/registration/schemas`     | nome, e-mail, senha forte, telefone, nascimento, endereço                                                                               |
| Schema do tutor       | `ownerRegistrationSchema`     | idem                                | `accountFormSchema.extend({ cpf })`                                                                                                     |
| Campos por passo      | `REGISTRATION_STEPS`          | `features/registration/lib`         | `{ id, title, fields[] }`, usado na validação por passo e no REQ-OREG-009                                                               |
| Mapper                | `toOwnerRegisterBody(values)` | `features/registration/api/mappers` | tira máscaras (`unmaskCpf`, `unmaskPhone`, `unmaskCep`), converte data para `yyyy-MM-dd`, apara textos, `complement` vazio vira omitido |

Regras dos campos: as da API (`modulo-auth.md` seção 5.1), repetidas no Zod só para dar resposta antes do envio. A API continua sendo a fonte; o 400 dela sempre vence (`applyFieldErrors`).

## Fluxo de dados

- `registerOwner(values)` em `features/registration/api/client/registration.client.ts`: `bffClient.request({ method: "POST", path: "/owners/register", body }, sessionResultSchema)`.
- `useRegisterMutation()`: no sucesso, `queryClient.removeQueries()`; a tela de sucesso lê o nome do resultado da mutação. Sem `router.refresh()` (ver Decisões). Navegação só nos botões da tela de sucesso, que já carregam a página nova com a sessão.
- `useCepLookup(cep)` (`shared/hooks`): `useQuery` com chave `["cep", cep]`, `enabled` com 8 dígitos, `staleTime` infinito, sem `retry`, tempo limite de 4 s; preenche só campos que a pessoa não editou (`getFieldState(...).isDirty`).
- Validação por passo: `form.trigger(REGISTRATION_STEPS[i].fields)`.

## Ajuste necessário na spec 003 (pré-requisito)

O handler `createSessionHandler` valida a resposta com `sessionSchema` (`{ accessToken, refreshToken, expiresAt, user }`). Três rotas devolvem outro formato:

| Rota                                               | `data`                                                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `POST /owners/register`, `POST /owners/reactivate` | `{ accessToken, refreshToken, expiresAt, owner: { ..., user } }`                                  |
| `POST /hosts/reactivate`                           | `{ accessToken, refreshToken, expiresAt, host: { ..., user } \| null }` (nulo antes da aprovação) |

Sem ajuste, essas rotas respondem 502 `CONTRACT_MISMATCH`. Proposta: `createSessionHandler({ backendPath, responseSchema, toSession })`, com `toSession` por rota (`owner.user`; `host?.user`, e quando `host` for nulo, `GET /users/me` com o access novo). Teste de integração por rota com o formato real. Afeta também a reativação da 010.

## Erros

| Código                                                | Onde aparece                | Comportamento                                                                                                                                        |
| ----------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VALIDATION_ERROR`                                    | campos                      | `applyFieldErrors` com a lista de campos dos dois passos; volta ao primeiro passo com erro (REQ-OREG-009); campo desconhecido vai para `root.server` |
| `AUTH_EMAIL_ALREADY_REGISTERED`                       | `Notice` no passo 1 + link  | `getErrorMessage(error, { role: "owner" })`                                                                                                          |
| `OWNER_CPF_ALREADY_REGISTERED`                        | campo CPF + link de suporte | mensagem de `errorCopy`                                                                                                                              |
| `TOO_MANY_REQUESTS`                                   | `Notice` com `useCountdown` | envio bloqueado                                                                                                                                      |
| `NETWORK_ERROR`, `UPSTREAM_UNAVAILABLE`, desconhecido | `Notice` genérico           | mantém os dados                                                                                                                                      |

## Reutiliza

002: `ChoiceCardGroup`, `WizardProgress`, `PasswordField`, `PasswordStrengthChecklist`, `MaskedTextField`, `FormActions`, `Notice`, `Hint`, `Celebration`, `shared/lib/masks`. 003: handler de cadastro, `bffClient`, `applyFieldErrors`, `getErrorMessage`, `sessionResultSchema`, `toSafeInternalPath`. 004: `resolvePostLoginPath`. 010: `useCountdown`.

## Cria de reutilizável

| Recurso                                            | Vai para                            | Quem mais usa                                                                   |
| -------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| `AddressFields`                                    | `shared/ui/forms`                   | 012, 015, 030 (endereço da empresa)                                             |
| `fetchAddressByCep` (schema interno)               | `shared/api/external/viaCep.ts`     | `useCepLookup`                                                                  |
| `useCepLookup`                                     | `shared/hooks`                      | `AddressFields`                                                                 |
| `isValidCpf`                                       | `shared/lib/documents`              | 015, 030                                                                        |
| `isAdult(birthDate, today)` e `parseBrazilianDate` | `shared/lib/date`                   | 012, 015                                                                        |
| `isStrongPassword` + `PASSWORD_RULES`              | `shared/lib/validation/password.ts` | 012, 013, 015; o `PasswordStrengthChecklist` lê `PASSWORD_RULES` (uma regra só) |
| `BirthDateField`, `CpfField`                       | `shared/ui/forms`                   | 012 (nascimento), 015, 030 (CPF)                                                |
| `features/registration` (variantes)                | feature                             | 012                                                                             |

## Segurança e privacidade

- Senha e CPF só em memória (RHF); nenhum `persist`, nenhuma query key com eles.
- ViaCEP recebe só o CEP; nada da pessoa. CSP: `connect-src` inclui `https://viacep.com.br`.
- O `next` passa por `toSafeInternalPath` antes de virar link.

## Matriz de testes

| REQ                         | Nível                   | Arquivo                                                       | Caso                                                                                                                                                                   |
| --------------------------- | ----------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 003                         | Unitário                | `isValidCpf.test.ts`                                          | válidos com e sem máscara; dígito errado; todos iguais; tamanho errado                                                                                                 |
| 003                         | Unitário                | `isAdult.test.ts`, `parseBrazilianDate.test.ts`               | 18 anos hoje passa, um dia antes não; 29/02; data inexistente; futuro (relógio fixo)                                                                                   |
| 003/004                     | Unitário                | `password.test.ts`                                            | cada regra isolada; 128 passa, 129 não; regras iguais às do checklist                                                                                                  |
| 003                         | Unitário                | `ownerRegistrationSchema.test.ts`                             | cada limite da API; "S/N"; UF minúscula normaliza; complemento opcional                                                                                                |
| 008                         | Unitário                | `toOwnerRegisterBody.test.ts`                                 | sem máscaras, data ISO, complemento vazio omitido, texto aparado                                                                                                       |
| 005                         | Integração (MSW)        | `useCepLookup.int.test.tsx`                                   | CEP válido preenche; `{ erro: true }` avisa; timeout de 4 s avisa; não sobrescreve campo editado                                                                       |
| 001                         | Componente              | `RegisterChoice.test.tsx`                                     | dois links certos, `next` preservado e sanitizado                                                                                                                      |
| 002/003/004/006/007/016/017 | Componente              | `RegistrationWizard.test.tsx`                                 | validação no blur e no continuar; voltar mantém; ajuda do CPF e do endereço; `autocomplete`; texto do botão                                                            |
| 008/009/010/011/012         | Componente (MSW no BFF) | `RegistrationWizard.errors.test.tsx`                          | payload enviado; envio único; 400 de `address.zipCode` volta ao passo 2 e 400 de `email` ao passo 1 com foco; 409 de e-mail e de CPF; 429 com contagem (relógio falso) |
| 013                         | Componente              | `RegistrationSuccess.test.tsx`                                | primeiro nome; botões com e sem `next`; movimento reduzido sem animação                                                                                                |
| 014                         | Arquitetura             | `no-token-storage.test.ts` (003) + caso novo                  | nenhum `cpf`/`password` em storage ou log                                                                                                                              |
| ajuste 003                  | Integração              | `sessionRoutes.int.test.ts`                                   | `owners/register` e `owners/reactivate` com `owner.user`; `hosts/reactivate` com `host` nulo busca `/users/me`                                                         |
| 015                         | E2E simulado            | `e2e/mocked/registration/owner.spec.ts`                       | com sessão, `/register/owner` redireciona                                                                                                                              |
| 001/002/005/008/013         | E2E simulado            | idem, desktop e mobile                                        | escolha → 2 passos → sucesso; CEP preenche (mock do ViaCEP); cookies HttpOnly gravados; botão visível no celular                                                       |
| 008/013                     | E2E real                | `e2e/real/registration/owner.spec.ts`                         | cadastro com e-mail único por execução no ambiente de teste da API (nunca produção)                                                                                    |
| Visual                      | Storybook               | `RegistrationWizard.stories.tsx`, `AddressFields.stories.tsx` | passo 1, passo 2, CEP buscando e não achado, cada erro, sucesso, celular; a11y sem violação                                                                            |
| 018                         | Integração (RSC)        | `app/(auth)/register/owner/page.test.ts`                      | `metadata.title` e `robots.index = false`                                                                                                                              |
