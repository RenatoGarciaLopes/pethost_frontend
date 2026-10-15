"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hasErrorCode } from "@/shared/api/errors/ApiError";
import {
  acceptBooking,
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  declineBooking,
} from "../api/client/bookingMutations.client";
import type { BookingDto } from "../api/contracts";
import { toBooking } from "../api/mappers";
import { bookingQueries } from "../api/queries";

/** Erros que querem dizer "a reserva mudou": recarregar mostra o status de agora. */
const STALE_CODES = [
  "BOOKING_NOT_AWAITING_RESPONSE",
  "BOOKING_RESPONSE_EXPIRED",
  "BOOKING_CONFLICT",
  "BOOKING_ALREADY_CANCELLED",
  "BOOKING_ALREADY_CLOSED",
  "BOOKING_NOT_CONFIRMED",
  "BOOKING_NOT_IN_PROGRESS",
] as const;

/** Grava a reserva devolvida no detalhe e invalida as listas; erro de reserva mudada recarrega (REQ-HREQ-008). */
function useBookingCallbacks(accountId: string, bookingId: string) {
  const client = useQueryClient();
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: bookingQueries.detail(accountId, bookingId).queryKey }),
      client.invalidateQueries({ queryKey: bookingQueries.lists(accountId) }),
    ]);
  return {
    onSuccess: async (dto: BookingDto) => {
      client.setQueryData(bookingQueries.detail(accountId, dto.id).queryKey, toBooking(dto));
      await client.invalidateQueries({ queryKey: bookingQueries.lists(accountId) });
    },
    onError: async (error: unknown) => {
      if (STALE_CODES.some((code) => hasErrorCode(error, code))) await refresh();
    },
  };
}

/**
 * "Aceitar" o pedido (REQ-HREQ-004).
 * @example useAcceptBooking(user.id, booking.id).mutate()
 */
export function useAcceptBooking(accountId: string, bookingId: string) {
  return useMutation({
    mutationFn: () => acceptBooking(bookingId),
    retry: false,
    ...useBookingCallbacks(accountId, bookingId),
  });
}

/**
 * "Não posso receber", com motivo opcional (REQ-HREQ-005).
 * @example useDeclineBooking(user.id, booking.id).mutate(reason)
 */
export function useDeclineBooking(accountId: string, bookingId: string) {
  return useMutation({
    mutationFn: (reason: string) => declineBooking(bookingId, reason),
    retry: false,
    ...useBookingCallbacks(accountId, bookingId),
  });
}

/**
 * Cancelar até o check-in, com motivo opcional (REQ-HREQ-007; tutor na 052).
 * @example useCancelBooking(user.id, booking.id).mutate(reason)
 */
export function useCancelBooking(accountId: string, bookingId: string) {
  return useMutation({
    mutationFn: (reason: string) => cancelBooking(bookingId, reason),
    retry: false,
    ...useBookingCallbacks(accountId, bookingId),
  });
}

/**
 * "{Pet} chegou" (REQ-STDAY-002).
 * @example useCheckIn(user.id, booking.id).mutate()
 */
export function useCheckIn(accountId: string, bookingId: string) {
  return useMutation({
    mutationFn: () => checkInBooking(bookingId),
    retry: false,
    ...useBookingCallbacks(accountId, bookingId),
  });
}

/**
 * "{Pet} voltou pra casa" (REQ-STDAY-004).
 * @example useCheckOut(user.id, booking.id).mutate()
 */
export function useCheckOut(accountId: string, bookingId: string) {
  return useMutation({
    mutationFn: () => checkOutBooking(bookingId),
    retry: false,
    ...useBookingCallbacks(accountId, bookingId),
  });
}
