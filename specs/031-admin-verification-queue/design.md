---
spec: 031-admin-verification-queue
status: in-progress
updated: 2026-10-15
---

# 031 · Design técnico

## Rota e renderização

| Arquivo                                                                | Tipo         | Faz                                                                                                                                                                            |
| ---------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/(admin)/admin/(panel)/host-applications/page.tsx`                 | RSC dinâmico | `requireRole("admin", ...)`; lê `status` e `page` dos `searchParams` (validados por `queueSearchSchema`); prefetch da fila e `HydrationBoundary`; renderiza `ApplicationQueue` |
| `app/(admin)/admin/(panel)/host-applications/[applicationId]/page.tsx` | RSC dinâmico | `applicationId` validado como UUID (inválido → `notFound()`); prefetch do detalhe; renderiza `HostApplicationReview`                                                           |

Sem `'use cache'`. Metadados `robots: noindex`. O link de foto nunca é pedido no servidor (não entra no HTML nem na hidratação).

## Árvore de componentes

```
page fila (RSC)
└─ ApplicationQueue (features/admin-host-applications · client)
   ├─ StatusFilter            select nativo (sete status) ligado à URL
   ├─ AdminDataTable          (shared/ui/data-display) colunas: nome, tipo, tentativa, espera, status
   └─ EmptyState

page detalhe (RSC)
└─ HostApplicationReview (widgets/host-application-review · client)
   ├─ ApplicantComparison     listas dl semânticas, dados enviados × dados da conta
   ├─ DocumentGallery         3 × SignedDocumentViewer (front, back, selfie) ou "Fotos apagadas"
   │  └─ SignedDocumentViewer  pede o link ao abrir; contagem até expiresAt; diálogo com foco preso
   ├─ DecisionPanel/checklist  PF e, na empresa, itens extras + link da consulta de CNPJ
   ├─ DecisionPanel           Aprovar (motivo) · Recusar (ChipPicker de motivos + nota) · Suspeita de fraude (confirmação)
   └─ DecisionSummary         quando já decidida
```

## Contratos e modelos

| Símbolo                      | Onde                                                | Nota                                                                                                                                          |
| ---------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `adminApplicationSchema`     | `features/admin-host-applications/api/contracts`    | `unwrapData(GetApiV1HostApplicationsApplicationIdResponse)` estreitado localmente com enums documentados pela API; nenhuma dependência da 030 |
| `adminApplicationListSchema` | idem                                                | array do contrato administrativo estreitado, mesma estrutura do gerado da lista                                                               |
| `signedDocumentSchema`       | idem                                                | `{ kind: DocumentKind, url: string.url(), expiresAt: number }`                                                                                |
| `AdminApplication`           | `features/admin-host-applications/api/contracts.ts` | tipo inferido do gerado; espera usa `submittedAt`; CPF exibido mascarado com botão "Mostrar" (leitura completa só sob ação)                   |
| `approveSchema`              | `features/admin-host-applications/schemas`          | `reason` 1 a 500, trim                                                                                                                        |
| `rejectSchema`               | idem                                                | `rejectionReason` (enum, `suspected_fraud` só pelo fluxo de fraude), `reason` 1 a 500                                                         |
| `queueSearchSchema`          | idem                                                | `status` (enum, padrão `submitted`), `page` (≥ 1)                                                                                             |

Chamadas (`features/admin-host-applications/api/client/adminApplications.client.ts`, via `bffClient`): `listApplications(status)`, `getApplication(id)`, `getDocumentLink(id, kind)`, `approveApplication(id, body)`, `rejectApplication(id, body)`.

## Fluxo de dados

- Keys: accountQueryKey(admin.id, "admin", "host-applications", "queue", status) e o mesmo prefixo com "detail", id. Mutação usa "decision", id para resetar seu resultado ao trocar de solicitação.
- Link da foto: estado local exclusivo do SignedDocumentViewer, sem TanStack Query ou hidratação. O diálogo pede no clique, cancela via AbortSignal ao fechar, descarta a URL ao fechar/vencer/falhar e usa referrerPolicy="no-referrer". O BFF e a imagem respondem no-store. Isso evita cache de URLs e mantém o requisito 007.
- Decisão: mutation → `invalidateQueries` da fila e do detalhe → `Notice` de sucesso + "Próxima da fila" (primeira da lista `submitted` depois de recarregada, excluindo a atual).
- Conflito (409/422): `refetch` do detalhe e `Notice` informativo; o painel some porque o status mudou.
- Paginação no cliente: `paginate(items, page, 25)` (`shared/lib/pagination`), página na URL via `useSearchParamsState`.

## Erros

| Código                                                                       | Onde aparece     | Texto                                                                                                                                         |
| ---------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `VALIDATION_ERROR` (`reason`, `rejectionReason`)                             | campo            | mensagem do campo                                                                                                                             |
| `HOST_APPLICATION_NOT_FOUND`                                                 | página           | `notFound()` → 404 da casca                                                                                                                   |
| `HOST_APPLICATION_CONFLICT`, `HOST_APPLICATION_NOT_UNDER_REVIEW`             | Notice           | **nova:** "Outra pessoa da equipe já decidiu essa verificação."                                                                               |
| `HOST_CPF_ALREADY_REGISTERED`, `HOST_CNPJ_ALREADY_REGISTERED` (na aprovação) | Notice no painel | **nova (contexto admin):** "Esse CPF/CNPJ já pertence a outro anfitrião. Recuse com 'Os dados não batem' ou abra a conta indevida em Contas." |
| `FORBIDDEN`                                                                  | página           | frase existente                                                                                                                               |

## Privacidade

- Link assinado: nunca em `localStorage`, `sessionStorage`, Zustand, URL, log ou analytics (REQ-HTTP-019; padrão `signedUrl|url` ampliado no `no-token-storage.test.ts` para este módulo).
- A `<img>` recebe o link direto do bucket (sem token no link além da assinatura); o arquivo já vem com `Cache-Control: private, no-store`.
- Sem miniatura em lista: foto só no detalhe, uma de cada vez, sob clique (cada abertura gera `host_application.document_viewed` na trilha).
- CPF completo só sob "Mostrar" (minimização na tela; a API já devolve completo).

## Reutiliza

`bffClient`, `accountQueryKey`, `getErrorMessage`, `requireRole`, `ChipPicker`, `StatusPill`, `Notice`, `EmptyState`, `ErrorState`, `SniffLoader`, `maskCpf`, `maskCnpj`.

## Cria de reutilizável

| Recurso                                                                            | Onde                                                                                   | Quem mais usa                           |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------- |
| `AdminDataTable` (tabela com ordenação, linhas clicáveis, estado vazio, paginação) | `shared/ui/data-display`                                                               | 032, 033                                |
| `paginate` e `useSearchParamsState` (estado na URL tipado por schema)              | `shared/lib/pagination`, `shared/hooks`                                                | 032, 033, 041 (filtros da busca)        |
| `SignedDocumentViewer` (link que vence, contagem, reabrir)                         | `widgets/host-application-review` (sobe para `shared/ui/media` se outra tela precisar) | futuras telas com arquivo privado       |
| `ReasonField` (texto 1 a 500 com contador)                                         | `shared/ui/forms`                                                                      | 032 (suspensão, liberar CPF/identidade) |
| `DecisionPanel` (ação com motivo + confirmação)                                    | `widgets/host-application-review`, padrão copiado na 032                               | 032                                     |

## Matriz de testes

| REQ             | Nível                   | Arquivo                                                             | Caso                                                                                        |
| --------------- | ----------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 002/003         | Unitário                | `reviewSchemas.test.ts`, `paginate.test.ts`                         | status desconhecido → padrão; página fora do intervalo → última                             |
| 009 a 011       | Unitário                | `reviewSchemas.test.ts`                                             | motivo vazio ou acima de 500; `suspected_fraud` fora dos chips                              |
| 001/004         | Componente              | `ApplicationQueue.test.tsx`, `AdminDataTable.test.tsx`              | ordem, colunas, vazio, linha leva ao detalhe                                                |
| 005/008/009     | Componente              | `DecisionPanel.test.tsx`, `DecisionPanel.test.tsx`                  | aprovar travado sem checklist; itens extras na empresa                                      |
| 010/011         | Componente              | `DecisionPanel.test.tsx`                                            | frase da pessoa ao escolher o chip; fraude pede confirmação                                 |
| 006/007/016     | Componente              | `SignedDocumentViewer.test.tsx` (relógio falso)                     | pede o link só ao abrir; contagem; vence e oferece reabrir; foco preso e Esc                |
| 006/012/013     | Integração (MSW no BFF) | `adminApplications.client.int.test.ts`, `useDecision.int.test.tsx`  | decisão invalida a fila; 409 recarrega; link não fica no cache depois de fechar             |
| 007             | Arquitetura             | `no-token-storage.test.ts` (ampliado)                               | nenhum link assinado em storage, store ou log                                               |
| 001 a 016       | Storybook               | `HostApplicationReview.stories.tsx`, `ApplicationQueue.stories.tsx` | em análise, decidida, fotos apagadas, PJ, conflito; a11y pendente de execução coordenada    |
| 001/006/009/012 | E2E simulado            | `e2e/mocked/admin/verification-queue.spec.ts`                       | fila → detalhe → abrir foto (imagem fictícia do mock) → checklist → aprovar → próxima       |
| 001/012         | E2E real                | `e2e/real/admin/verification-queue.spec.ts`                         | admin do seed decide uma solicitação criada no próprio teste (030) com documentos fictícios |

## Decisões de implementação e limites (15/10/2026)

- A spec 031 usa a slice `admin-host-applications`. Não importa outra feature e não depende dos nomes ou da copy da 030. Contratos derivam de `shared/api/generated/host-applications`; enum de documento aceita `rg`, `cnh` e `cin`, conforme API.
- Os sete status usam select nativo rotulado; o SegmentedControl existente se destina a duas a quatro opções. Os dados de comparação usam listas `dl` nativas; não existe KeyValueList implementado para reaproveitar nesta base.
- `ReviewChecklist` e `DecisionSummary` não criam APIs reutilizáveis isoladas: checklist está dentro de DecisionPanel, resumo é interno ao widget e ambos têm testes de composição identificáveis. Não há arquivo/export planejado sem uso.
- `useCountdown` foi consultado: conta decrementos relativos, enquanto o documento precisa seguir o prazo Unix absoluto mesmo com atraso da aba. O viewer calcula pelo relógio real e elimina a imagem no prazo; não foi criado outro hook genérico de contagem.
- `AdminDataTable<T>` recebe lista completa, colunas render/compare, identificador, destino e nome acessível de cada linha, página de base 1, tamanho (25 por padrão), callback e conteúdo vazio. Não faz HTTP nem conhece status de verificação. `ReasonField` é controlado e oferece rótulo, erro, ajuda, bloqueio e limite de digitação (500); validação obrigatória pertence ao schema do domínio.
- `paginate(items, page, pageSize)` não muta a lista, limita a página e lança RangeError para tamanho inválido. Sem E/S ou comportamento de navegador; unitário direto e funcional na tabela. `useSearchParamsState(schema)` aceita saída plana de valores escalares, preserva parâmetros alheios e usa push sem scroll. Parâmetros repetidos são arrays para o schema, igual ao Next no servidor. Não aceita dados pessoais ou segredos.
- Prefetch só depois de requireRole(admin). A lista e o detalhe usam Query por conta; o link temporário usa exclusivamente memória local e nunca aparece em dehydrate. BFF já responde no-store; a imagem precisa manter o no-store da API/bucket. Cada emissão chama a rota auditada; documents[].path não é seguido arbitrariamente.
- APIs puras não exigem suítes HTTP ou E2E próprias. Integrações são testadas na borda MSW e na composição com Query. Stories e E2E existem, mas sua execução e a conferência visual permanecem pendentes. Simulação MSW não é integração completa com a API .NET.
- O mock tem 27 itens para validar paginação e imagem PNG exclusivamente sintética. A jornada real lê somente variáveis já fornecidas ao processo: E2E_REVIEW_APPLICANT_EMAIL, E2E_REVIEW_APPLICANT_PASSWORD, E2E_REVIEW_SYNTHETIC_CPF, E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD. Não lê arquivos .env, não usa solicitações alheias e não imprime credenciais.
