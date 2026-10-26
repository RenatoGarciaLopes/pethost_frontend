import { toCents } from "@/shared/lib/money";
import type { Booking, BookingPage, BookingPerson } from "../types";
import type { BookingDto, BookingPageDto } from "./contracts";

const person = (value: { name: string; avatarUrl?: string | null } | null | undefined): BookingPerson | null =>
  value ? { name: value.name, avatarUrl: value.avatarUrl ?? null } : null;

/**
 * A reserva da API para as telas: valores em centavos, só o que a tela mostra do cantinho e das pessoas.
 * @example const booking = toBooking(bookingDtoSchema.parse(data));
 */
export function toBooking(dto: BookingDto): Booking {
  const { listing, contact } = dto;
  return {
    id: dto.id,
    listingId: dto.listingId,
    ownerId: dto.ownerId,
    status: dto.status,
    listing: listing
      ? { id: listing.id, title: listing.title, neighborhood: listing.neighborhood, city: listing.city }
      : null,
    owner: person(dto.owner),
    host: person(dto.host),
    pets: dto.pets.map((pet) => ({
      id: pet.id,
      name: pet.name ?? null,
      species: pet.species ?? null,
      size: pet.size ?? null,
    })),
    checkIn: dto.checkIn,
    checkOut: dto.checkOut,
    nights: dto.nights,
    petCount: dto.petCount,
    nightlyRateCents: toCents(dto.nightlyRate),
    totalCents: toCents(dto.totalPrice),
    requestedAt: dto.requestedAt,
    confirmedAt: dto.confirmedAt ?? null,
    responseDeadline: dto.responseDeadline ?? null,
    paymentDeadline: dto.paymentDeadline ?? null,
    respondedAt: dto.respondedAt ?? null,
    checkedInAt: dto.checkedInAt ?? null,
    checkedOutAt: dto.checkedOutAt ?? null,
    cancelledBy: dto.cancelledBy === "owner" || dto.cancelledBy === "host" ? dto.cancelledBy : null,
    declineReason: dto.declineReason ?? null,
    refundPercentage: dto.refundPercentage ?? null,
    contact: contact
      ? {
          phone: contact.phone ?? null,
          address: contact.address ? { ...contact.address, complement: contact.address.complement ?? null } : null,
        }
      : null,
  };
}

/**
 * Uma página da lista para as telas.
 * @example const page = toBookingPage(bookingPageSchema.parse(data));
 */
export function toBookingPage(dto: BookingPageDto): BookingPage {
  return {
    items: dto.items.map(toBooking),
    page: dto.page,
    totalCount: dto.totalCount,
    totalPages: dto.totalPages ?? 1,
  };
}
