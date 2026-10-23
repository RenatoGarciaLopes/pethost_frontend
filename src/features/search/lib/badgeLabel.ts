import type { ListingSummary } from "../api/contracts";
/** Selos calculados pela API, nunca filtros. @example badgeLabel("neighbor") // "Vizinho" */
export function badgeLabel(badge: ListingSummary["badges"][number]): string {
  return {
    neighbor: "Vizinho",
    fast_responder: "Responde rápido",
    yard: "Casa com quintal",
    experienced: "Experiente",
    well_rated: "Bem avaliado",
  }[badge];
}
