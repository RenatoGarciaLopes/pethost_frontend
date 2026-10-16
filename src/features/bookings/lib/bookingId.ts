import { GetApiV1BookingsBookingIdParams } from "@/shared/api/generated/bookings/bookings.zod";

/**
 * O segmento da URL é um id de reserva possível (UUID)? Id inválido vai direto para o 404, sem chamar a API.
 * @example isBookingId("pedido-1") // false
 */
export const isBookingId = (value: string): boolean =>
  GetApiV1BookingsBookingIdParams.safeParse({ bookingId: value }).success;
