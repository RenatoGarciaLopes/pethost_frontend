import type { BOOKING_STATUSES } from "./api/contracts";

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Um pet do pedido: nome, espécie e porte (nulos se a ficha sumiu). */
export interface BookingPet {
  id: string;
  name: string | null;
  species: string | null;
  size: string | null;
}

/** Nome e foto de quem está do outro lado. */
export interface BookingPerson {
  name: string;
  avatarUrl: string | null;
}

/** Endereço exato do cantinho (só para o tutor, depois da confirmação). */
export interface BookingAddress {
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
}

/** Contato liberado depois da confirmação: telefone do outro lado e, para o tutor, o endereço exato. */
export interface BookingContact {
  phone: string | null;
  address: BookingAddress | null;
}

/** A reserva como as telas usam (specs 050 a 054). Dinheiro em centavos; datas de calendário `yyyy-MM-dd`. */
export interface Booking {
  id: string;
  status: BookingStatus;
  listing: { id: string; title: string; neighborhood: string; city: string } | null;
  owner: BookingPerson | null;
  host: BookingPerson | null;
  pets: BookingPet[];
  checkIn: string;
  checkOut: string;
  nights: number;
  petCount: number;
  nightlyRateCents: number;
  totalCents: number;
  /** Quando o pedido foi feito (ISO). */
  requestedAt: string;
  /** Quando a estadia foi confirmada (ISO). */
  confirmedAt: string | null;
  /** Só enquanto `requested`: até quando o anfitrião responde (ISO). */
  responseDeadline: string | null;
  /** Só enquanto `accepted`: até quando o tutor paga a 1ª parcela (ISO); sem pagar, a reserva expira. */
  paymentDeadline: string | null;
  /** Quando o anfitrião respondeu (ISO); distingue o pedido que expirou sem resposta da aceita que expirou sem pagamento. */
  respondedAt: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  cancelledBy: "owner" | "host" | null;
  declineReason: string | null;
  /** Quanto volta para o tutor no cancelamento (100 ou 50). */
  refundPercentage: number | null;
  contact: BookingContact | null;
}

/** Uma página da lista de reservas. */
export interface BookingPage {
  items: Booking[];
  page: number;
  totalCount: number;
  totalPages: number;
}
