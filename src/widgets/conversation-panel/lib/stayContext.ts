import { bookingCopy, formatPeriod, statusLabel, type Booking, type BookingStatus } from "@/features/bookings";
import type { ConversationMessage, TimelineEvent } from "@/features/conversations";
import { brasiliaToday, nightsBetween } from "@/shared/lib/date/stayRules";
import { conversationPanelCopy as copy } from "./conversationPanelCopy";

/**
 * O mínimo da estadia que o painel da conversa mostra. Quem tem a reserva (a página) reduz a ela; o painel não
 * conhece o DTO de reservas.
 */
export interface ConversationStay {
  status: BookingStatus;
  /** Datas de calendário `yyyy-MM-dd`. */
  checkIn: string;
  checkOut: string;
  petNames: readonly string[];
  hostName: string;
  listingTitle: string;
  neighborhood: string;
  /** Instante ISO da chegada ("chegou"), quando já houve. */
  checkedInAt: string | null;
}

/** A faixa abaixo do cabeçalho: o selo do status e a frase da estadia. */
export interface StayBannerContent {
  status: string;
  text: string;
}

const petList = new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" });
const petsOf = (stay: ConversationStay) => ({ pets: petList.format(stay.petNames), many: stay.petNames.length > 1 });

/**
 * A linha embaixo do nome no cabeçalho: o cantinho e o bairro.
 * @example staySubtitle(stay) // "Casa da Dona Cida · Jd. Alvorada"
 */
export function staySubtitle(stay: ConversationStay): string {
  return copy.subtitle(stay.listingTitle, stay.neighborhood);
}

/**
 * Selo do cabeçalho enquanto o pet está hospedado: em que dia da estadia está. Fora disso, nada.
 * @example stayDayPill(stay, now) // "Pipoca aqui · dia 2 de 5"
 */
export function stayDayPill(stay: ConversationStay, now: Date = new Date()): string | null {
  if (stay.status !== "in_progress") return null;
  const total = nightsBetween(stay.checkIn, stay.checkOut);
  const day = Math.min(Math.max(nightsBetween(stay.checkIn, brasiliaToday(now)) + 1, 1), total);
  return copy.dayPill(petsOf(stay).pets, day, total);
}

/**
 * A faixa da estadia em andamento: o status e "20 a 25 de dez. · Pipoca está na casa de Dona Cida". Fora disso, nada.
 * @example stayBanner(stay) // { status: "Acontecendo", text: "20 a 25 de dez. · Pipoca está na casa de Dona Cida" }
 */
export function stayBanner(stay: ConversationStay): StayBannerContent | null {
  if (stay.status !== "in_progress") return null;
  const { pets, many } = petsOf(stay);
  return {
    status: statusLabel[stay.status],
    text: `${formatPeriod(stay.checkIn, stay.checkOut)} · ${copy.staying(pets, many, stay.hostName)}`,
  };
}

/**
 * Os acontecimentos da estadia que entram na linha do tempo da conversa: hoje, a chegada.
 * @example stayEvents(stay) // [{ id: "check-in", at: "2026-12-20T17:18:00Z", label: "Pipoca chegou na casa de Dona Cida" }]
 */
export function stayEvents(stay: ConversationStay): TimelineEvent[] {
  if (!stay.checkedInAt) return [];
  const { pets, many } = petsOf(stay);
  return [{ id: "check-in", at: stay.checkedInAt, label: copy.arrived(pets, many, stay.hostName) }];
}

/**
 * A reserva a que a conversa se refere agora: a da mensagem mais recente enviada durante uma estadia em andamento
 * (a API marca essas mensagens com `bookingId`). Sem nenhuma, a conversa não tem estadia.
 *
 * @example stayBookingIdOf(page.items) // "0199…" ou null
 */
export function stayBookingIdOf(messages: readonly ConversationMessage[]): string | null {
  const newestFirst = [...messages].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  return newestFirst.find((message) => message.bookingId)?.bookingId ?? null;
}

/**
 * Reduz a reserva ao que o painel mostra. Sem o cantinho (removido), não há o que mostrar no cabeçalho: sem estadia.
 * @example toConversationStay(await getBookingDetail(user.id, bookingId))
 */
export function toConversationStay(booking: Booking): ConversationStay | null {
  if (!booking.listing) return null;
  return {
    status: booking.status,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    petNames: booking.pets.map((pet) => pet.name ?? bookingCopy.unknownPet),
    hostName: booking.host?.name ?? booking.listing.title,
    listingTitle: booking.listing.title,
    neighborhood: booking.listing.neighborhood,
    checkedInAt: booking.checkedInAt,
  };
}
