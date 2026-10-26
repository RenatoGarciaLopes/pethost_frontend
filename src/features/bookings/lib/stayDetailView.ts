import type { TimelineStep } from "@/shared/ui/data-display/StatusTimeline";
import type { NoticeProps } from "@/shared/ui/feedback/Notice";
import type { Booking, BookingStatus } from "../types";
import { bookingCopy } from "./bookingCopy";
import { formatDeadline, formatMoment, formatStayDay } from "./formatStay";
import { statusLabel } from "./bookingStatus";

const copy = bookingCopy.stay;

const TRAIL_LABELS = ["Pedido", "Confirmada", "Chegou", "Voltou pra casa"] as const;
const TRAIL_POSITION: Partial<Record<BookingStatus, number>> = {
  requested: 0,
  accepted: 1,
  confirmed: 1,
  in_progress: 2,
  completed: 4,
};

/**
 * A linha do tempo da estadia (Pedido, Confirmada, Chegou, Voltou pra casa) com o momento de cada marco, só do que a
 * API informa; o que falta mostra só o dia previsto. Recusada, expirada e cancelada acabam no marco em que pararam
 * (feitos até ali + uma etapa "parou" com o nome da situação), sem etapas futuras: o motivo vem do detalhe da reserva.
 *
 * @example <StatusTimeline label="Andamento" steps={stayTrail(booking)} />
 */
export function stayTrail(booking: Booking): TimelineStep[] {
  const happened = [booking.requestedAt, booking.confirmedAt, booking.checkedInAt, booking.checkedOutAt];
  const position = TRAIL_POSITION[booking.status];
  if (position === undefined) {
    const reached = Math.max(1, happened.findIndex((moment) => !moment) === -1 ? 4 : happened.findIndex((m) => !m));
    return [
      ...TRAIL_LABELS.slice(0, reached).map((label, index) => ({
        id: label,
        label,
        state: "done" as const,
        detail: formatMoment(happened[index]!),
      })),
      { id: booking.status, label: statusLabel[booking.status], state: "stopped" },
    ];
  }
  const planned = [null, null, booking.checkIn, booking.checkOut];
  return TRAIL_LABELS.map((label, index) => {
    const state = index < position ? "done" : index === position ? "current" : "todo";
    const moment = happened[index];
    const day = planned[index];
    const detail = state === "todo" ? (day ? formatStayDay(day) : null) : moment ? formatMoment(moment) : null;
    return { id: label, label, state, detail };
  });
}

/** O destaque "o que acontece agora": a frase da etapa, linhas de apoio e a ação possível. */
export interface StayNow {
  tone: NoticeProps["tone"];
  heading: string;
  title: string;
  /** Linhas de apoio, uma por parágrafo. */
  details: string[];
  action: "pay" | "viewPayment" | "search" | null;
}

/**
 * A frase da etapa em que a estadia está, com o prazo, o que aconteceu com o dinheiro e a ação que existe: "Pagar"
 * (aceita), "Ver pagamento e parcelas" (confirmada, em andamento e concluída) e busca (recusada, expirada).
 *
 * @example const now = stayNow(booking, new Date());
 */
export function stayNow(booking: Booking, moment: Date): StayNow {
  const host = booking.host?.name ?? copy.theHost;
  const { now } = copy;
  const base = { heading: now.heading, details: [] as string[], action: null } as const;
  switch (booking.status) {
    case "requested":
      return {
        ...base,
        tone: "info",
        title: booking.responseDeadline
          ? now.requested(host, formatDeadline(booking.responseDeadline, moment))
          : now.requestedHold,
        details: booking.responseDeadline ? [now.requestedHold] : [],
      };
    case "accepted":
      return {
        ...base,
        tone: "atencao",
        title: booking.paymentDeadline
          ? now.accepted(formatDeadline(booking.paymentDeadline, moment))
          : now.acceptedNoDeadline,
        action: "pay",
      };
    case "confirmed":
      return { ...base, tone: "ok", title: now.confirmed(formatStayDay(booking.checkIn)), action: "viewPayment" };
    case "in_progress":
      return {
        ...base,
        tone: "info",
        title: now.inProgress(host, formatStayDay(booking.checkOut)),
        action: "viewPayment",
      };
    case "completed":
      return { ...base, tone: "ok", title: now.completed(host), action: "viewPayment" };
    case "declined":
      return {
        ...base,
        heading: now.closedHeading,
        tone: "atencao",
        title: copy.declined(host),
        details: [...(booking.declineReason ? [copy.declinedReason(booking.declineReason)] : []), now.nothingCharged],
        action: "search",
      };
    case "expired":
      return {
        ...base,
        heading: now.closedHeading,
        tone: "atencao",
        title: booking.respondedAt ? now.paymentExpired : copy.expired(host),
        details: [now.nothingCharged],
        action: "search",
      };
    case "cancelled":
      return {
        ...base,
        heading: now.closedHeading,
        tone: "ok",
        title: copy.cancelled,
        details: booking.refundPercentage !== null ? [copy.refund(booking.refundPercentage)] : [],
      };
  }
}
