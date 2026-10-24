import type { BookingPaymentData } from "../api/paymentContracts";
import type { BookingStatus } from "../types";

/** Primeira parcela não paga; nunca pula processing/desconhecida para cobrar a próxima. */
export function nextPayableInstallment(payment: BookingPaymentData) {
  if (payment.status === "cancelled" || payment.status === "paid") return null;
  const first = [...payment.installments].sort((a, b) => a.number - b.number).find((i) => i.status !== "paid");
  return first && (first.status === "pending" || first.status === "overdue") ? first : null;
}
/** O prazo inicial não limita parcelas posteriores; a API valida novamente cada escrita. */
export function paymentWindowClosed(payment: BookingPaymentData, now: number) {
  return (
    (payment.status === "not_started" || payment.status === "pending") &&
    !!payment.paymentDeadline &&
    Date.parse(payment.paymentDeadline) <= now
  );
}
/** O SDK não decide confirmação: exige reserva confirmada e primeira parcela paga na API. */
export function isPaymentConfirmed(payment: BookingPaymentData, bookingStatus: BookingStatus) {
  return bookingStatus === "confirmed" && payment.installments.some((i) => i.number === 1 && i.status === "paid");
}
