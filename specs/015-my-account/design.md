---
spec: 015-my-account
status: draft
updated: 2026-10-11
---

# 015 · Design técnico

## Rotas e renderização

| Arquivo                                   | Tipo         | Faz                                                                                                                                                 |
| ----------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(account)/users/layout.tsx`          | RSC dinâmico | `requireRole(["owner", "host"], path)`; casca da 004 na variante do papel; sub-navegação `AccountSectionNav`                                        |
| `app/(account)/users/profile/page.tsx`    | RSC dinâmico | prefetch do perfil do papel (`owners/me` ou `hosts/me`, com fallback para `users/me` quando `HOST_NOT_FOUND`); `HydrationBoundary`; `ProfileScreen` |
| `app/(account)/users/password/page.tsx`   | RSC          | `PasswordChangeScreen`                                                                                                                              |
| `app/(account)/users/deactivate/page.tsx` | RSC          | `DeactivateScreen` com o papel                                                                                                                      |

O grupo `(account)` é o mesmo da 014.

## Decisão: em que feature

O perfil muda de contrato por papel (`owners/me` × `hosts/me`), mas a tela é uma só. Opções: duas telas em `features/owners` e `features/hosts`, ou uma feature `account` com **adaptadores por papel**. Escolhida: `features/account` com a interface `ProfileGateway` (DIP):

```ts
interface ProfileGateway {
  role: "owner" | "host";
  load(): Promise<AccountProfile>; // modelo de UI único
  save(patch: AccountProfilePatch): Promise<AccountProfile>;
  uploadAvatar(file: File): Promise<AccountProfile>;
  removeAvatar(): Promise<AccountProfile>;
  deactivate(): Promise<void>;
  editability(profile: AccountProfile): FieldEditability; // livre, travado (motivo) ou oculto, por campo
}
```

`ownerProfileGateway` e `hostProfileGateway` traduzem DTO ↔ modelo (`toAccountProfile`, `toOwnerPatch`, `toHostPatch`). A tela só conhece `AccountProfile` e `FieldEditability`; um papel novo é um adaptador novo, sem mexer nos componentes.

## Árvore de componentes

```
AccountSectionNav (features/account · client)        Perfil · Senha · Pausar conta (aria-current)

ProfileScreen (features/account · server)
└─ ProfileEditor (client)
   ├─ PublicProfileCard                               foto/iniciais, nome, bairro, desde quando (REQ-ACC-002)
   ├─ AvatarUploader (shared/ui/media · client)       escolher, conferir, prévia, enviar, tirar
   ├─ ProfileForm                                      RHF; campos montados a partir de FieldEditability
   │  ├─ LockedField (e-mail sempre; identidade conforme a trava)
   │  ├─ TextField nome · MaskedTextField telefone
   │  ├─ BirthDateField · CpfField (com "Mostrar")
   │  ├─ AddressFields (shared, 011) · AddressFields name="companyAddress" (empresa)
   │  ├─ CurrentPasswordReveal                         aparece se cpf/birthDate sujos (REQ-ACC-005)
   │  └─ FormActions
   └─ Notice                                          sucesso, erros, aviso de anfitrião sem verificação

PasswordChangeScreen → PasswordChangeForm (client)    PasswordField ×2 + PasswordStrengthChecklist
DeactivateScreen → DeactivateForm (client)            texto, Checkbox "Entendi", botão
```

## Contratos e modelos

| Camada       | Símbolo                                                                                                                                    | Origem                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| DTO          | `GetApiV1OwnersMeResponse`, `PatchApiV1OwnersMeBody`, `PutApiV1OwnersMeAvatarResponse`, `PostApiV1OwnersMeDeactivateResponse`              | `shared/api/generated/owners`                |
| DTO          | `GetApiV1HostsMeResponse`, `PatchApiV1HostsMeBody`, `PutApiV1HostsMeAvatarResponse`, `PostApiV1HostsMeDeactivateResponse`                  | `shared/api/generated/hosts`, `host-profile` |
| DTO          | `GetApiV1UsersMeResponse`, `PostApiV1UsersMePasswordBody`                                                                                  | `shared/api/generated/users`                 |
| Modelo de UI | `AccountProfile` (`role`, `fullName`, `email`, `phone`, `birthDate`, `cpf`, `address`, `avatarUrl`, `memberSince`, `company?`, `verified`) | `features/account/types`                     |
| Edição       | `FieldEditability` = `Record<ProfileField, { mode: "free" \| "locked" \| "hidden"; reason?: string }>`                                     | idem                                         |
| Lógica pura  | `diffProfile(initial, values)` → patch só com o alterado (endereço inteiro se mudou)                                                       | `features/account/lib`                       |
| Schemas      | `profileFormSchema` (reaproveita as regras da 011), `passwordChangeSchema`                                                                 | `features/account/schemas`                   |

## Fluxo de dados

- Query do perfil: `accountQueryKey(user.id, "profile")`; prefetch no servidor; `staleTime` 60 s.
- `save`: mutation; sucesso → `setQueryData` com a resposta, `router.refresh()` (casca). Erros de trava ajustam `editability` local (REQ-ACC-007, 010).
- Foto: `uploadAvatar` com `FormData` pelo `bffClient` (o proxy da 003 faz streaming); sucesso → `setQueryData` e `router.refresh()`.
- Senha: `bffClient` `POST /users/me/password` → handler de sessão da 003 regrava os cookies; nada no cache muda.
- Pausar: `deactivate()` → `useLogout()` da 004 (melhor esforço) → `queryClient.clear()` → `router.replace("/?aviso=conta-pausada")`; a home lê o aviso de uma lista fixa (nunca texto vindo da URL).

## Erros

| Código                                        | Onde                     | Comportamento                                                                                               |
| --------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `VALIDATION_ERROR`                            | campos                   | `applyFieldErrors` com os campos do formulário (`address.*`, `companyAddress.*`, `currentPassword`, `file`) |
| `OWNER_CPF_LOCKED`, `OWNER_BIRTH_DATE_LOCKED` | campo                    | desfaz o campo, vira `LockedField`                                                                          |
| `OWNER_CPF_ALREADY_REGISTERED`                | campo CPF                | link de suporte                                                                                             |
| `HOST_IDENTITY_LOCKED`                        | `Notice`                 | restaura os travados                                                                                        |
| `HOST_NOT_A_COMPANY`                          | `Notice` genérico        | não deve acontecer (campos de empresa ocultos para pessoa física)                                           |
| `HOST_NOT_FOUND`                              | estado de leitura        | REQ-ACC-011                                                                                                 |
| `OWNER_NOT_FOUND`                             | `ErrorState` com suporte | conta antiga sem perfil                                                                                     |
| `PAYLOAD_TOO_LARGE`                           | foto                     | REQ-ACC-017                                                                                                 |
| `AUTH_ACCOUNT_DEACTIVATED`                    | `Notice`                 | conta inativa (raro: sessão viva de conta pausada em outro aparelho)                                        |
| `TOO_MANY_REQUESTS`                           | `Notice` + contagem      | envio bloqueado                                                                                             |

## Reutiliza

002: `LockedField`, `PasswordField`, `PasswordStrengthChecklist`, `MaskedTextField`, `Notice`, `Hint`, `FormActions`, `ErrorState`. 003: proxy, handler de senha, `bffClient`, `createBackendClient`, `accountQueryKey`, `applyFieldErrors`, `getErrorMessage`, `errorCopy` (com os códigos novos). 004: casca, `requireRole`, `useLogout`. 011: `AddressFields`, `BirthDateField`, `CpfField`, `isValidCpf`, `isAdult`, `strongPasswordSchema`.

## Cria de reutilizável

| Recurso                                                        | Vai para           | Quem mais usa                                                  |
| -------------------------------------------------------------- | ------------------ | -------------------------------------------------------------- |
| `AvatarUploader`                                               | `shared/ui/media`  | 021 (`PhotoSlots` reaproveita a base de escolha e conferência) |
| `validateImageFile(file, { types, maxBytes })` + `IMAGE_RULES` | `shared/lib/files` | 021 (fotos do pet, 5 MB), 030 (documentos)                     |
| `useObjectUrl(file)` (cria e revoga)                           | `shared/hooks`     | 021, 030                                                       |
| `maskCpfForDisplay` (`***.***.247-25`)                         | `shared/lib/masks` | 030, admin (031/032)                                           |
| `formatMemberSince(date)` ("outubro de 2026")                  | `shared/lib/date`  | 042 (perfil público), 053                                      |
| `ProfileGateway` (padrão de adaptador por papel)               | `features/account` | documentado na nota para specs futuras                         |

## Matriz de testes

| REQ               | Nível            | Arquivo                                                                                                                   | Caso                                                                                                                                       |
| ----------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 006               | Unitário         | `diffProfile.test.ts`                                                                                                     | nada mudou → vazio; só telefone; parte do endereço manda o endereço todo; complemento apagado vira ""                                      |
| 004/009/011       | Unitário         | `ownerProfileGateway.test.ts`, `hostProfileGateway.test.ts` (`editability`)                                               | tutor livre; anfitrião PF e PJ travados; sem verificação tudo travado                                                                      |
| 002               | Unitário         | `formatMemberSince.test.ts`                                                                                               | mês por extenso em pt-BR, fuso de Brasília                                                                                                 |
| 013               | Unitário         | `maskCpfForDisplay.test.ts`                                                                                               | formato; CPF ausente                                                                                                                       |
| 014               | Unitário         | `validateImageFile.test.ts`                                                                                               | tipo pelo `type` e pela extensão; 5 MB passa, 5 MB + 1 não; vazio                                                                          |
| 001               | Integração       | `users/layout.int.test.tsx` ou `requireRole` (004)                                                                        | admin redirecionado                                                                                                                        |
| 002 a 006/012/013 | Componente (MSW) | `ProfileEditor.owner.test.tsx`                                                                                            | campos livres; senha atual só com CPF/nascimento sujos; patch só com o alterado; botão desabilitado sem mudança; sucesso atualiza o cartão |
| 007/008           | Componente (MSW) | `ProfileEditor.owner.errors.test.tsx`                                                                                     | 422 de CPF e de nascimento viram `LockedField` e mantêm o resto; 400 em `currentPassword`; 409 de CPF                                      |
| 009/010/011       | Componente (MSW) | `ProfileEditor.host.test.tsx`                                                                                             | PF e PJ; `HOST_IDENTITY_LOCKED`; `HOST_NOT_FOUND` mostra leitura e link                                                                    |
| 014 a 017         | Componente (MSW) | `AvatarUploader.test.tsx`                                                                                                 | arquivo inválido não envia; prévia; multipart com a parte `file`; tirar com confirmação; 413                                               |
| 018 a 021         | Componente (MSW) | `PasswordChangeForm.test.tsx`                                                                                             | régua; envio único; senha atual errada limpa só ela; sucesso limpa os campos                                                               |
| 022 a 025         | Componente (MSW) | `DeactivateForm.test.tsx`                                                                                                 | botão travado até marcar; rota do papel; sucesso chama logout, limpa o cache e navega; falha mantém a sessão                               |
| 026               | Arquitetura      | `no-token-storage.test.ts`                                                                                                | nada de senha em storage ou log                                                                                                            |
| 001/027           | E2E simulado     | `e2e/mocked/account/profile.spec.ts`                                                                                      | sem sessão vai ao login; navegação entre as três páginas; títulos                                                                          |
| 004/012/015       | E2E simulado     | idem, desktop e mobile                                                                                                    | tutor edita telefone e troca a foto; casca mostra o nome novo                                                                              |
| 019/024           | E2E simulado     | `e2e/mocked/account/security.spec.ts`                                                                                     | trocar a senha mantém logado; pausar sai e cai em `/` com aviso                                                                            |
| 009               | E2E real         | `e2e/real/account/profile.spec.ts`                                                                                        | anfitrião de demonstração do seed vê identidade travada (só leitura; nada é salvo)                                                         |
| Visual            | Storybook        | `ProfileEditor.stories.tsx`, `AvatarUploader.stories.tsx`, `PasswordChangeForm.stories.tsx`, `DeactivateForm.stories.tsx` | cada estado e papel; a11y sem violação                                                                                                     |
| 028               | Componente       | formulários de perfil, senha e pausa (`*.test.tsx`, MSW 429 com `Retry-After`)                                            | contagem visível e envio bloqueado até zerar                                                                                               |
