---
spec: 032-admin-accounts
status: draft
updated: 2026-10-11
---

# 032 · Design técnico

## Rota e renderização

| Arquivo                                                     | Tipo         | Faz                                                                                                                                         |
| ----------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(admin)/admin/(panel)/users/page.tsx`                  | RSC dinâmico | `requireRole("admin")`; `accountsSearchSchema` nos `searchParams` (`type`, `status`, `page`); prefetch da lista da aba; `AccountsDirectory` |
| `app/(admin)/admin/(panel)/users/owners/[ownerId]/page.tsx` | RSC dinâmico | UUID validado; prefetch do tutor; `OwnerAccountDetail`                                                                                      |
| `app/(admin)/admin/(panel)/users/hosts/[hostId]/page.tsx`   | RSC dinâmico | UUID validado; prefetch do anfitrião; `HostAccountDetail`                                                                                   |

Sem `'use cache'`; `robots: noindex`.

## Árvore de componentes

```
page lista (RSC)
└─ AccountsDirectory (widgets/admin-accounts · client)
   ├─ AccountTypeTabs          Tutores | Anfitriões (URL)
   ├─ AccountFilters           busca (nome, e-mail, CPF; estado local) + status (URL)
   └─ AdminDataTable (031)     linhas → detalhe

page detalhe (RSC)
└─ OwnerAccountDetail | HostAccountDetail (widgets/admin-accounts · client)
   ├─ AccountSummary           KeyValueList; CPF/CNPJ mascarados com "Mostrar"; StatusPill
   ├─ SuspensionNotice         motivo e data quando suspensa
   ├─ AccountActions           Suspender · Tirar suspensão · Liberar CPF | Liberar identidade
   │  └─ ReasonActionDialog    ReasonField (031) + texto do efeito + confirmação reforçada quando irreversível
   └─ AuditTable (033)         filtrada por targetType + targetId, compacta, com link para /admin/audit-entries
```

## Contratos e modelos

| Símbolo                                    | Onde                                             | Nota                                                                                                                                              |
| ------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `adminOwnerSchema`, `adminOwnerListSchema` | `features/owners/api/contracts`                  | `unwrapData(GetApiV1OwnersOwnerIdResponse)` / `GetApiV1OwnersResponse`; `user.role` estreitado                                                    |
| `adminHostSchema`, `adminHostListSchema`   | `features/hosts/api/contracts`                   | `unwrapData(GetApiV1HostsHostIdResponse)` / `GetApiV1HostsResponse`; `personType` → `pf`/`pj`                                                     |
| `AccountRow`                               | `widgets/admin-accounts/types`                   | linha comum às duas abas: `kind` (`owner`/`host`), `id`, `fullName`, `email`, `cpfDigits`, `status`, `createdAt`, `tradeName?`, `payoutsEnabled?` |
| `toAccountRow`                             | `widgets/admin-accounts/lib`                     | tutor/anfitrião → linha; `status`: identidade liberada > suspensa > inativa > ativa                                                               |
| `filterAccounts`                           | idem                                             | função pura: nome e e-mail sem acento e sem caixa; CPF só dígitos                                                                                 |
| `reasonSchema`                             | `shared/lib/validation` (reuso do `ReasonField`) | 1 a 500, trim                                                                                                                                     |
| `accountsSearchSchema`                     | `widgets/admin-accounts/schemas`                 | `type` (`owners`/`hosts`), `status`, `page`                                                                                                       |

Chamadas: `features/owners/api/client/adminOwners.client.ts` (`listOwners`, `getOwner`, `suspendOwner`, `liftOwnerSuspension`, `releaseOwnerCpf`) e `features/hosts/api/client/adminHosts.client.ts` (`listHosts`, `getHost`, `suspendHost`, `liftHostSuspension`, `releaseHostIdentity`), via `bffClient`. O widget junta as duas features (widget pode importar features; features não se importam).

## Fluxo de dados

- Keys: `accountQueryKey(admin.id, "admin", "owners")`, `accountQueryKey(admin.id, "admin", "owner", ownerId)` e as equivalentes de `hosts`.
- Ações: mutation → `setQueryData` do detalhe com a resposta (a API devolve o recurso atualizado) + `invalidateQueries` da lista e da trilha da conta (key da 033).
- Filtro e paginação no cliente (`filterAccounts` + `paginate` da 031); aba, status e página na URL (`useSearchParamsState`), texto da busca em estado local.
- "Mostrar CPF": estado local da linha/detalhe, volta a mascarar ao sair; nunca na URL.

## Erros

| Código                                                  | Onde aparece     | Texto                                                                        |
| ------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------- |
| `VALIDATION_ERROR` (`reason`)                           | campo do diálogo | mensagem do campo                                                            |
| `OWNER_NOT_FOUND`, `HOST_NOT_FOUND`                     | página           | `notFound()`                                                                 |
| `OWNER_SUSPENSION_REQUIRED`, `HOST_SUSPENSION_REQUIRED` | Notice           | **nova:** "Só dá pra liberar depois de suspender a conta."                   |
| `OWNER_CPF_RELEASED`, `HOST_IDENTITY_RELEASED`          | Notice           | **nova:** "A identidade dessa conta foi liberada; a suspensão não sai mais." |
| `AUTH_ADMIN_SUSPENSION_FORBIDDEN`                       | Notice           | **nova:** "Conta de admin não pode ser suspensa."                            |

## Privacidade

- CPF e CNPJ mascarados por padrão (`maskCpf`, `maskCnpj`); completo só sob "Mostrar", sem persistir.
- Endereço e telefone só no detalhe, não na lista.
- O texto da busca fica só no estado do componente, nunca na URL (pode ser um CPF); rotas de admin com `robots: noindex`.

## Reutiliza

`AdminDataTable`, `ReasonField`, `paginate`, `useSearchParamsState` (031), `AuditTable` (033), `bffClient`, `accountQueryKey`, `getErrorMessage`, `applyFieldErrors`, `requireRole`, `StatusPill`, `KeyValueList`, `Notice`, `EmptyState`, `ErrorState`, `maskCpf`, `maskCnpj`.

## Cria de reutilizável

| Recurso                                                        | Onde                     | Quem mais usa                        |
| -------------------------------------------------------------- | ------------------------ | ------------------------------------ |
| `ReasonActionDialog` (motivo + efeito + confirmação reforçada) | `shared/ui/feedback`     | 031 (fraude), futuras ações de admin |
| `filterText` (normaliza acento e caixa para busca no cliente)  | `shared/lib/text`        | 033, 041                             |
| `AccountRow` / `toAccountRow`                                  | `widgets/admin-accounts` | só aqui                              |

## Matriz de testes

| REQ             | Nível                   | Arquivo                                                                                            | Caso                                                                                                                       |
| --------------- | ----------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 002/003         | Unitário                | `toAccountRow.test.ts`, `filterAccounts.test.ts`, `filterText.test.ts`                             | prioridade de status; busca por nome com e sem acento, e-mail, CPF com máscara                                             |
| 001/003         | Unitário                | `accountsSearchSchema.test.ts`                                                                     | aba e status desconhecidos voltam ao padrão                                                                                |
| 001 a 004       | Componente              | `AccountsDirectory.test.tsx`                                                                       | abas na URL; CPF mascarado; vazio com "Limpar filtros"                                                                     |
| 005 a 008/013   | Componente              | `AccountActions.test.tsx`, `ReasonActionDialog.test.tsx`                                           | ações por status; liberar só em suspensa; "LIBERAR" exigido; sem "Tirar suspensão" com identidade liberada; foco devolvido |
| 004/009         | Componente              | `OwnerAccountDetail.test.tsx`, `HostAccountDetail.test.tsx`                                        | "Mostrar" CPF; trilha filtrada                                                                                             |
| 005 a 011       | Integração (MSW no BFF) | `adminOwners.client.int.test.ts`, `adminHosts.client.int.test.ts`, `useAccountAction.int.test.tsx` | corpo com `reason`; detalhe atualizado com a resposta; 422 recarrega                                                       |
| 001 a 013       | Storybook               | `AccountsDirectory.stories.tsx`, `AccountActions.stories.tsx`                                      | ativa, inativa, suspensa, liberada, empresa; a11y                                                                          |
| 003/005/006/007 | E2E simulado            | `e2e/mocked/admin/accounts.spec.ts`                                                                | buscar CPF → suspender → liberar CPF (disputa) → conferir a trilha                                                         |
| 005/006         | E2E real                | `e2e/real/admin/accounts.spec.ts`                                                                  | admin do seed suspende e tira a suspensão de um tutor criado no teste                                                      |
