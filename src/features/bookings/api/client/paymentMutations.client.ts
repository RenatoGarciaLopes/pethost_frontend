import { bffClient } from "@/shared/api/client/bffClient";
import { paymentSchema, paymentSessionSchema } from "../paymentContracts";

/** Operações owner. Idempotência e autorização são da API; segredos ficam só na memória do caller. */
export const paymentMutations = {
  choose: (id: string, installmentCount: number) =>
    bffClient.request(
      { method: "PUT", path: `/bookings/${encodeURIComponent(id)}/payment`, body: { installmentCount } },
      paymentSchema,
    ),
  session: (id: string, number: number) =>
    bffClient.request(
      { method: "POST", path: `/bookings/${encodeURIComponent(id)}/payment/installments/${number}/payment-session` },
      paymentSessionSchema,
    ),
  synchronize: (id: string) =>
    bffClient.request(
      { method: "POST", path: `/bookings/${encodeURIComponent(id)}/payment/synchronization` },
      paymentSchema,
    ),
};
