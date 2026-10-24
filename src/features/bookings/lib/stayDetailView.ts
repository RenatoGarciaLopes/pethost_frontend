import type { TimelineStep } from "@/shared/ui/data-display/StatusTimeline";
import type { NoticeProps } from "@/shared/ui/feedback/Notice";
import type { Booking } from "../types";
import { bookingCopy } from "./bookingCopy";
import { formatDeadline, formatMoment, formatStayDay } from "./formatStay";
import { TRAIL_LABELS, trailSteps } from "./bookingStatus";

const copy = bookingCopy.stay;

export interface StayTrailStep {
  id: string;
  label: string;
  state: TimelineStep["state"];
  /** Quando aconteceu ("10 de dez., 14h30") ou, se falta, "previsto sáb., 20 de dez."; sem dado, `null`. */
  when: string | null;
}

/**
 * A linha do tempo da estadia (Pedido, Confirmada, Chegou, Voltou pra casa) com o momento de cada marco, só do que a
 * API informa. Recusada, expirada e cancelada não têm trilha (`null`).
 *
 * @example const steps = stayTrail(booking); steps && <StayTimeline steps={steps} />
 */
export function stayTrail(booking: Booking): StayTrailStep[] | null {
  const steps = trailSteps(booking.status);
  if (!steps) return null;
  const happened = [booking.requestedAt, booking.confirmedAt, booking.checkedInAt, booking.checkedOutAt];
  const planned = [null, null, booking.checkIn, booking.checkOut];
  return steps.map((step, index) => {
    const moment = happened[index];
    const day = planned[index];
    const when =
      step.state === "todo" && day
        ? copy.planned(formatStayDay(day))
        : step.state !== "todo" && moment
          ? formatMoment(moment)
          : null;
    return { id: TRAIL_LABELS[index]!, label: step.label, state: step.state, when };
  });
}

/** O destaque "o que acontece agora": a frase da etapa, linhas de apoio e a ação possível. */
export interface StayNow {
  tone: NoticeProps["tone"];
  heading: string;
  title: string;
  /** Linhas de apoio, uma por parágrafo. */
  details: string[];
  action: "pay" | "search" | null;
}

/**
 * A frase da etapa em que a estadia está, com o prazo, o que aconteceu com o dinheiro e a ação que existe: "Pagar"
 * (aceita) e "Procurar outro cantinho" (recusada, expirada). Concluída e em andamento não têm ação (sem tela de avaliação).
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
      return { ...base, tone: "ok", title: now.confirmed(formatStayDay(booking.checkIn)) };
    case "in_progress":
      return { ...base, tone: "info", title: now.inProgress(host, formatStayDay(booking.checkOut)) };
    case "completed":
      return { ...base, tone: "ok", title: now.completed(host) };
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
