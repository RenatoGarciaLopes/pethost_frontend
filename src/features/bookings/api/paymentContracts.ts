import { z } from "zod";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import {
  GetApiV1BookingsBookingIdPaymentResponse,
  PostApiV1BookingsBookingIdPaymentInstallmentsInstallmentNumberPaymentSessionResponse,
} from "@/shared/api/generated/booking-payment/booking-payment.zod";

/** Dados do pagamento; valores em reais, vencimentos UTC. Status desconhecido falha fechado. */
export const paymentSchema = unwrapData(GetApiV1BookingsBookingIdPaymentResponse).extend({
  status: z.enum(["not_started", "pending", "active", "paid", "cancelled"]),
});
/** Sessão efêmera, nunca persistida/desidratada. Chave retornada não substitui env local. */
export const paymentSessionSchema = unwrapData(
  PostApiV1BookingsBookingIdPaymentInstallmentsInstallmentNumberPaymentSessionResponse,
);
export type BookingPaymentData = z.infer<typeof paymentSchema>;
export type PaymentSession = z.infer<typeof paymentSessionSchema>;
