import { formatBRL, fromCents } from "@/shared/lib/money";
import type { StatusPillTone } from "@/shared/ui/feedback/StatusPill";
import type { Booking, BookingStatus } from "../types";
import { bookingCopy } from "./bookingCopy";
import { formatDeadline, formatPeriod } from "./formatStay";

const copy = bookingCopy.owner.card;

/** O que o card oferece além de abrir a estadia: pagar (066) ou buscar outro cantinho. Sem tela, sem botão. */
export type OwnerStayAction = "pay" | "search" | null;

export interface OwnerStayView {
  /** "Pipoca na casa de Dona Cida"; sem pet nomeado, o título do cantinho. */
  title: string;
  statusLabel: string;
  tone: StatusPillTone;
  /** "20 a 25 de dez. · 5 noites · R$ 300,00". */
  summary: string;
  /** Linha por situação; `deadline` pede atenção (prazo de pagamento). */
  context: { text: string; kind: "deadline" | "note" } | null;
  action: OwnerStayAction;
}

const STATUS_TONE: Readonly<Record<BookingStatus, StatusPillTone>> = {
  requested: "neutro",
  accepted: "gema",
  confirmed: "info",
  in_progress: "info",
  completed: "ok",
  declined: "atencao",
  expired: "atencao",
  cancelled: "atencao",
};

/** Ordem da lista: pagar primeiro, depois o que está acontecendo, o que vem aí, o que acabou e o que não aconteceu. */
const RANK: Readonly<Record<BookingStatus, number>> = {
  accepted: 0,
  in_progress: 1,
  confirmed: 2,
  requested: 3,
  completed: 4,
  declined: 5,
  expired: 5,
  cancelled: 5,
};

const names = new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" });

function titleOf(booking: Booking): string {
  const pets = booking.pets.flatMap((pet) => (pet.name ? [pet.name] : []));
  const host = booking.host?.name;
  if (pets.length === 0) return booking.listing?.title ?? bookingCopy.owner.listingGone;
  return host ? copy.title(names.format(pets), host) : names.format(pets);
}

function contextOf(booking: Booking, now: Date): OwnerStayView["context"] {
  const host = booking.host?.name ?? bookingCopy.stay.theHost;
  switch (booking.status) {
    case "requested":
      return booking.responseDeadline
        ? { kind: "note", text: bookingCopy.stay.deadline(host, formatDeadline(booking.responseDeadline, now)) }
        : null;
    case "accepted":
      return booking.paymentDeadline
        ? { kind: "deadline", text: copy.payBy(formatDeadline(booking.paymentDeadline, now)) }
        : null;
    case "declined":
      return { kind: "note", text: copy.declined(host) };
    case "expired":
      return { kind: "note", text: booking.respondedAt ? copy.paymentExpired : copy.noAnswer(host) };
    case "cancelled":
      return {
        kind: "note",
        text: booking.refundPercentage ? copy.cancelledRefund(booking.refundPercentage) : bookingCopy.stay.cancelled,
      };
    default:
      return null;
  }
}

/**
 * O card de "Minhas estadias" pronto para desenhar (spec 094): título, selo, resumo, linha de contexto e ação por situação.
 * Só mostra ação que existe: "Pagar" (accepted) e "Buscar outro cantinho" (declined, expired, cancelled).
 *
 * @example const view = ownerStayView(booking); view.action === "pay" && <Button>{copy.pay(total)}</Button>
 */
export function ownerStayView(booking: Booking, now: Date = new Date()): OwnerStayView {
  const total = formatBRL(fromCents(booking.totalCents));
  return {
    title: titleOf(booking),
    statusLabel: copy.status[booking.status],
    tone: STATUS_TONE[booking.status],
    summary: [formatPeriod(booking.checkIn, booking.checkOut), bookingCopy.host.nights(booking.nights), total].join(
      " · ",
    ),
    context: contextOf(booking, now),
    action:
      booking.status === "accepted"
        ? "pay"
        : booking.status === "declined" || booking.status === "expired" || booking.status === "cancelled"
          ? "search"
          : null,
  };
}

/**
 * As estadias em ordem de relevância (pagar, acontecendo, confirmadas, esperando, concluídas, as que não aconteceram);
 * dentro de cada grupo, a ordem da API. Não muda a lista recebida.
 *
 * @example sortOwnerStays(pages.flatMap((page) => page.items))
 */
export function sortOwnerStays(stays: readonly Booking[]): Booking[] {
  return stays
    .map((booking, index) => ({ booking, index }))
    .sort((a, b) => RANK[a.booking.status] - RANK[b.booking.status] || a.index - b.index)
    .map(({ booking }) => booking);
}
