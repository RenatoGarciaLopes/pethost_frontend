---
spec: 033-admin-audit
status: in-progress
updated: 2026-10-15
---

# 033 · Design técnico

Implementação conferida em 15/10/2026. O código está em `src/features/admin-audit` (não `features/audit`); o endpoint e os parâmetros são os do contrato OpenAPI registrados em requirements.md. `details` é `Record<string, string>`, IDs podem ser nulos e `totalPages` pode faltar.

## Rota e renderização

| Arquivo                                            | Tipo         | Faz                                                                                                                                                                            |
| -------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/(admin)/admin/(panel)/audit-entries/page.tsx` | RSC dinâmico | `requireRole("admin")`; `auditSearchSchema.safeParse(searchParams)` (inválidos descartados e listados para o aviso); prefetch da página e `HydrationBoundary`; `AuditExplorer` |

Sem `'use cache'`; `robots: noindex`.

## Árvore de componentes

```
page (RSC)
└─ AuditExplorer (features/audit · client)
   ├─ AuditFilters            ação (Autocomplete agrupado + texto livre), alvo (tipo + id), autor (id), período (datas locais)
   ├─ InvalidFilterNotice     filtros descartados da URL
   └─ AuditTable              (features/audit · client; exportada no index.client)
      ├─ AdminDataTable (031)  data · ação · alvo · autor · motivo
      └─ AuditEntryDetail      diálogo: details (KeyValueList), IP, traceId copiável, links "filtrar por" e "abrir"
```

`AuditTable` aceita `fixedFilters` (não editáveis) e `variant="compact"` (sem filtros, 10 por página, link "ver tudo"): contrato de integração da 032. A 031 não é dependente deste componente.

## Contratos e modelos

| Símbolo                   | Onde                           | Nota                                                                                                                                                                             |
| ------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auditPageSchema`         | `features/audit/api/contracts` | `unwrapData(GetApiV1AuditEntriesResponse)`; `details` → `z.record(z.unknown())`                                                                                                  |
| `AuditEntry`, `AuditPage` | `features/audit/types`         | `occurredAt` como `Date`; `actorRole` estreitado com `accountRoleSchema` (aceita ausente)                                                                                        |
| `auditSearchSchema`       | `features/audit/schemas`       | `page` ≥ 1, `pageSize` ∈ {20, 50, 100}, `action` (`^[a-z_]+\.[a-z_]+$`), `targetType` (palavra), `targetId`/`actorId` UUID, `from`/`to` data local `yyyy-MM-dd`, com `from ≤ to` |
| `toAuditQuery`            | `features/audit/api/mappers`   | datas locais → ISO 8601 no fuso `America/Sao_Paulo` (`from` 00:00, `to` 23:59:59.999)                                                                                            |
| `auditActionCopy`         | `features/audit/lib`           | código → rótulo e grupo (conta, sessão, senha, tutor, anfitrião, verificação, auditoria); desconhecido → `{ label: código, group: "outros" }`                                    |
| `auditTargetLink`         | `features/audit/lib`           | `targetType` + `targetId` → rota (`owner` → `/admin/users/owners/{id}`, `host` → `/admin/users/hosts/{id}`, `host_application` → `/admin/host-applications/{id}`) ou nada        |

Chamada: `features/audit/api/client/audit.client.ts` → `listAuditEntries(query)` pelo `bffClient` (`GET /audit-entries`, na `bffRoutes`). No servidor, `api/server/audit.server.ts` para o prefetch.

## Fluxo de dados

- Key: `accountQueryKey(admin.id, "admin", "audit", query)`, `placeholderData: keepPreviousData` (troca de página sem piscar).
- Filtros: `useSearchParamsState(auditSearchSchema)` (031); mudar filtro volta para a página 1.
- Datas: `formatDateTime` de `shared/lib/date` com fuso `America/Sao_Paulo`.
- Invalidação: as mutations da 031 e da 032 invalidam as keys de auditoria com o alvo correspondente.

## Erros

| Código                                                | Onde aparece    | Texto                                                           |
| ----------------------------------------------------- | --------------- | --------------------------------------------------------------- |
| `VALIDATION_ERROR` (`page`, `pageSize`, `from`, `to`) | campo do filtro | mensagem do campo (não deveria acontecer: o schema barra antes) |
| `FORBIDDEN`                                           | página          | frase existente                                                 |

## Privacidade

- IP só no detalhe do registro (pergunta 1 do requirements), nunca na tabela.
- A trilha já mascara CPF; o front não tenta desmascarar nem cruzar.
- Ids na URL são UUIDs (não são dado pessoal direto); nenhum e-mail ou CPF vai para a URL.

## Reutiliza

`AdminDataTable` (e indiretamente `paginate`, com uma única página da API), `useSearchParamsState` (031; ajuste nesta entrega para excluir parâmetros opcionais removidos), `EmptyState`, `ErrorState`, `bffClient`, `accountQueryKey`, `requireRole`, `formatDateTime`.

## Cria de reutilizável

| Recurso                                                 | Onde                                  | Quem mais usa                            |
| ------------------------------------------------------- | ------------------------------------- | ---------------------------------------- |
| `AuditTable` (com `fixedFilters` e `variant="compact"`) | `features/admin-audit` (index.client) | 032 e outras telas admin                 |
| `auditActionCopy`, `auditTargetLink`                    | `features/audit/lib`                  | 032                                      |
| `formatDateTime` com fuso                               | `shared/lib/date`                     | apresentação de datas locais             |
| `CopyButton` (copiar com anúncio acessível)             | `shared/ui/data-display/CopyButton`   | cópia acionada de textos identificadores |

## Matriz de testes

| REQ             | Nível                   | Arquivo                                               | Caso                                                                                                  |
| --------------- | ----------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 002/004         | Unitário                | `auditSearchSchema.test.ts`, `toAuditQuery.test.ts`   | inválidos descartados; `from` > `to`; datas viram ISO com fuso (inclusive horário de verão desligado) |
| 003/008         | Unitário                | `auditActionCopy.test.ts`                             | toda ação da doc tem rótulo; desconhecida mostra o código                                             |
| 007             | Unitário                | `auditTargetLink.test.ts`                             | rota por tipo; tipo sem tela → nada                                                                   |
| 001/005/010/011 | Componente              | `AuditTable.test.tsx`                                 | colunas, "N de M", vazio, teclado, modo compacto com filtros fixos                                    |
| 006/007         | Componente              | `AuditEntryDetail.test.tsx`                           | details em chave e valor; traceId copiado e anunciado; links                                          |
| 002/004         | Componente              | `AuditFilters.test.tsx`                               | erro no campo; mudar filtro volta à página 1                                                          |
| 001/005         | Integração (MSW no BFF) | `audit.client.int.test.ts`                            | query montada com os nomes da API; página seguinte mantém a anterior visível                          |
| 001 a 011       | Storybook               | `AuditExplorer.stories.tsx`, `AuditTable.stories.tsx` | cheio, vazio, compacto, ação desconhecida; a11y                                                       |
| 001/002/006     | E2E simulado            | `e2e/mocked/admin/audit.spec.ts`                      | filtrar por ação, abrir registro, link "abrir" leva à conta                                           |
| 001             | E2E real                | `e2e/real/admin/audit.spec.ts`                        | admin do seed vê o próprio `audit.searched` no topo depois da busca                                   |

## Mapeamento implementado (fonte de verdade)

- Rota efetiva: `src/app/(admin)/admin/(panel)/audit-entries/page.tsx`; ela chama `requireRole`, usa os parâmetros do OpenAPI, pula o prefetch em intervalo reverso e hidrata `AuditExplorer`.
- Módulo efetivo: `src/features/admin-audit`. `api/contracts.ts` deriva envelope/página do schema gerado e restringe `details` a texto-texto; IDs/`actorRole` são nullish e `totalPages` é opcional. `api/mappers.ts` projeta `occurredAt` para `Date`.
- A API declara os parâmetros `page`, `pageSize`, `action`, `targetType`, `targetId`, `actorId`, `from`, `to`. Datas locais são enviadas como limites inclusivos do dia com offset `-03:00`. A lista de ações inclui `pet.*`, `listing.*` e `booking.*` além das ações inicialmente citadas.
- A tabela usa `AdminDataTable` para uma única página recebida e `Pagination` para pedir páginas seguintes à API; `paginate` é reutilizado internamente pela tabela compartilhada. O modo compacto limita a dez itens e é exportado por `index.client.ts` para a 032.
- `AuditEntryDetail` apresenta os pares de texto em lista, IP somente no detalhe, links para filtrar e abrir destinos conhecidos, além de `CopyButton` acionado para traceId. `ReasonField` não é usado porque esta tela é somente leitura.
- Integração HTTP e prefetch têm MSW, componentes têm testes comportamentais, e stories usam `export default meta`. E2E mockado e real estão escritos; execução pendente das portas e do aceite de navegador.
