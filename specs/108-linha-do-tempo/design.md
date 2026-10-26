# 108 — Design

## Componente

`src/shared/ui/data-display/StatusTimeline/StatusTimeline.tsx`.

- `TimelineStep { id, label, state: "done" | "current" | "todo" | "stopped", detail?: string | null }`.
- `ol` em grid de uma linha (`gridAutoFlow: column`, `minmax(0, 1fr)`): colunas iguais em qualquer largura. Cada `li` é coluna: marcador, rótulo (14 px no celular, 16 no computador), detalhe (12/14 px, `text.secondary`).
- Trilho: `::after` de cada `li` (menos o último), do marcador ao próximo, `border-top` 2 px. Sólido em tinta se a etapa é `done`; tracejado em `text.secondary` nas demais.
- Marcador 26 px no celular e 32 px no computador, borda de 2 px em tinta (tracejada só no `todo`). `current`: gema, ponto interno e anel de 4 px em `quintal.luz`. `stopped`: coral com ✕.
- `current` e `stopped` levam uma pílula com o estado ("agora", "parou"), que é também o texto lido pelo leitor de tela. As demais usam o texto oculto ", feito" / ", falta".
- Sem animação e sem estado de foco: o componente não é interativo.

## Dados

`stayTrail(booking)` (`bookings/lib/stayDetailView.ts`) monta as etapas dos dois lados da reserva (tutor e anfitrião):

- andamento: Pedido → Confirmada → Chegou → Voltou pra casa; feito/atual com o momento da API, futuro só com o dia previsto (`formatStayDay`); nenhum horário inventado;
- fechadas (recusada, expirada, cancelada): as etapas alcançadas (pelos `requestedAt`/`confirmedAt`/`checkedInAt` informados) como `done` + `{ label: statusLabel[status], state: "stopped" }`.

A verificação (`ApplicationStatusView`) segue passando só `id/label/state`.

## Removido

`StayTimeline` e seu teste; `trailSteps`/`TRAIL_LABELS` de `bookingStatus.ts` (a lógica mora em `stayTrail`); `copy.planned` ("previsto …").

## Decisão de limite

A API não informa o momento do cancelamento nem da recusa; a etapa "parou" não leva data.
