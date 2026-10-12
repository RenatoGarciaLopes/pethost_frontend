---
spec: NNN-slug
status: draft
updated: AAAA-MM-DD
---

# NNN · Design técnico

## Rota e renderização

`app/(…)/…/page.tsx`: o que roda no servidor, onde ficam as ilhas `'use client'`, proteção (papel), `loading`/`error`, metadados, política de cache (nunca `'use cache'` com sessão).

## Árvore de componentes

```
page.tsx (RSC)
└─ Widget/Feature component (camada · server|client)
   └─ …
```

## Contratos e modelos

| Camada               | Símbolo       | Origem                                                             |
| -------------------- | ------------- | ------------------------------------------------------------------ |
| DTO                  | `XDto`        | `shared/api/generated` (reexportado em `features/x/api/contracts`) |
| Modelo de UI         | `X`           | `features/x/types`                                                 |
| Mapper               | `toX`         | `features/x/api/mappers`                                           |
| Schema de formulário | `xFormSchema` | `features/x/schemas`                                               |

## Fluxo de dados

Query keys, `queryOptions`, prefetch e hidratação, mutations, invalidação e efeitos (redirecionar, limpar cache).

## Erros

| Código da API | Onde aparece | Texto |
| ------------- | ------------ | ----- |

## Reutiliza

Do catálogo: …

## Cria de reutilizável

Vai para o catálogo: …

## Matriz de testes

| REQ | Nível | Arquivo | Caso |
| --- | ----- | ------- | ---- |

Níveis não aplicáveis e por quê.
