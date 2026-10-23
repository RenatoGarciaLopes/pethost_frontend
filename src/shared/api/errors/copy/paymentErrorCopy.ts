import type { CopyCatalog } from "../copyTypes";

/** Pagamento das estadias (parcelas e Stripe). */
export const paymentErrorCopy = {
  PAYMENT_BOOKING_NOT_AWAITING_PAYMENT: "Essa estadia não está esperando pagamento.",
  PAYMENT_BOOKING_NOT_FOUND: "Não achamos essa estadia.",
  PAYMENT_CLOSED: "Esse pagamento já foi encerrado.",
  PAYMENT_CONFLICT: "O pagamento mudou enquanto você olhava. Confere de novo.",
  PAYMENT_HOST_NOT_FOUND: "Não achamos o anfitrião dessa estadia.",
  PAYMENT_INSTALLMENT_ALREADY_PAID: "Essa parcela já foi paga.",
  PAYMENT_INSTALLMENT_COUNT_NOT_ALLOWED: "Essa quantidade de parcelas não vale pra essa estadia.",
  PAYMENT_INSTALLMENT_NOT_FOUND: "Não achamos essa parcela.",
  PAYMENT_INSTALLMENT_OUT_OF_ORDER: "Paga as parcelas na ordem, começando pela mais antiga.",
  PAYMENT_INSTALLMENT_PROCESSING: "Essa parcela está sendo processada. Espera um instante.",
  PAYMENT_NOT_FOUND: "Não achamos esse pagamento.",
  PAYMENT_OWNER_NOT_FOUND: "Não achamos o tutor dessa estadia.",
  PAYMENT_PLAN_LOCKED: "O parcelamento dessa estadia já foi escolhido e não muda mais.",
  PAYMENT_STRIPE_REQUEST_REJECTED: "O Stripe não aceitou esse pagamento. Confere os dados do cartão.",
  PAYMENT_STRIPE_UNAVAILABLE: "O Stripe não respondeu agora. Tenta de novo em alguns minutos.",
  PAYMENT_WINDOW_CLOSED: "O prazo pra pagar essa parcela passou.",
} satisfies CopyCatalog;
