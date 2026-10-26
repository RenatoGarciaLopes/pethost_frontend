import type { BookingStatus } from "../types";

/**
 * Nome curto de cada situação, para o selo das listas e do detalhe (anfitrião e tutor).
 * @example <StatusPill label={statusLabel[booking.status]} />
 */
export const statusLabel: Readonly<Record<BookingStatus, string>> = {
  requested: "Esperando resposta",
  accepted: "Aceita",
  confirmed: "Confirmada",
  in_progress: "Acontecendo",
  completed: "Concluída",
  declined: "Não aceita",
  expired: "Expirou",
  cancelled: "Cancelada",
};

export interface BookingTab {
  /** Valor na URL (`?aba=`). */
  id: string;
  label: string;
  statuses: readonly BookingStatus[];
}

/**
 * Abas de "Pedidos e estadias" do anfitrião (REQ-HREQ-001): cada situação cai numa aba só.
 * @example HOST_TABS.map((tab) => tab.label)
 */
export const HOST_TABS: readonly BookingTab[] = [
  { id: "pedidos", label: "Pedidos", statuses: ["requested"] },
  { id: "proximas", label: "Próximas", statuses: ["accepted", "confirmed"] },
  { id: "acontecendo", label: "Acontecendo", statuses: ["in_progress"] },
  { id: "anteriores", label: "Anteriores", statuses: ["completed", "declined", "expired", "cancelled"] },
];

/**
 * A aba pelo valor da URL; desconhecido cai em "Pedidos".
 * @example hostTabOf(searchParams.aba)
 */
export function hostTabOf(id: string | undefined): BookingTab {
  return HOST_TABS.find((tab) => tab.id === id) ?? HOST_TABS[0]!;
}
