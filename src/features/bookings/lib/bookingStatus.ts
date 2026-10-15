import type { TimelineStep } from "@/shared/ui/data-display/StatusTimeline";
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
 * Abas de "Minhas estadias" do tutor (REQ-STAYS-001): cada situação cai numa aba só.
 * @example OWNER_TABS.map((tab) => tab.label)
 */
export const OWNER_TABS: readonly BookingTab[] = [
  { id: "proximas", label: "Próximas", statuses: ["requested", "accepted", "confirmed"] },
  { id: "acontecendo", label: "Acontecendo", statuses: ["in_progress"] },
  { id: "anteriores", label: "Anteriores", statuses: ["completed", "declined", "expired", "cancelled"] },
];

/**
 * A aba do tutor pelo valor da URL; desconhecido cai em "Próximas".
 * @example ownerTabOf(searchParams.aba)
 */
export function ownerTabOf(id: string | undefined): BookingTab {
  return OWNER_TABS.find((tab) => tab.id === id) ?? OWNER_TABS[0]!;
}

/**
 * A aba pelo valor da URL; desconhecido cai em "Pedidos".
 * @example hostTabOf(searchParams.aba)
 */
export function hostTabOf(id: string | undefined): BookingTab {
  return HOST_TABS.find((tab) => tab.id === id) ?? HOST_TABS[0]!;
}

const TRAIL = ["Pedido", "Confirmada", "Chegou", "Voltou pra casa"] as const;
const TRAIL_POSITION: Partial<Record<BookingStatus, number>> = {
  requested: 0,
  accepted: 1,
  confirmed: 1,
  in_progress: 2,
  completed: 4,
};

/**
 * A trilha da estadia para o `StatusTimeline`: Pedido → Confirmada → Chegou → Voltou pra casa (REQ-STDAY-007). Recusada,
 * expirada ou cancelada não tem trilha (`null`): o detalhe explica o que houve.
 *
 * @example const steps = trailSteps(booking.status); steps && <StatusTimeline label="Andamento" steps={steps} />
 */
export function trailSteps(status: BookingStatus): TimelineStep[] | null {
  const position = TRAIL_POSITION[status];
  if (position === undefined) return null;
  return TRAIL.map((label, index) => ({
    id: label,
    label,
    state: index < position ? "done" : index === position ? "current" : "todo",
  }));
}
