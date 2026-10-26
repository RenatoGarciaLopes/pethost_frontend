import type { BookingPaymentData, PaymentSession } from "@/features/bookings";
import { BOOKING_ID } from "./bookings";

/** Pagamento sintético. Overrides permitem plano inicial, atraso e confirmação sem dados reais. */
export function paymentFixture(overrides: Partial<BookingPaymentData> = {}): BookingPaymentData {
  return {
    id: "0199f0a0-0000-7000-8000-0000000000f1",
    bookingId: BOOKING_ID,
    status: "pending",
    totalAmount: 300,
    paidAmount: 0,
    refundedAmount: 0,
    currency: "brl",
    installmentCount: 1,
    paymentDeadline: "2099-12-11T12:00:00Z",
    installments: [
      {
        number: 1,
        amount: 300,
        dueAt: "2099-12-11T12:00:00Z",
        status: "pending",
        refundStatus: "none",
        payoutStatus: "held",
        disputeStatus: "none",
        amountDue: 300,
      },
    ],
    options: [
      {
        count: 1,
        firstAmount: 300,
        otherAmount: 0,
        installments: [{ number: 1, amount: 300, dueAt: "2099-12-11T12:00:00Z" }],
      },
      {
        count: 3,
        firstAmount: 100,
        otherAmount: 100,
        installments: [1, 2, 3].map((number) => ({
          number,
          amount: 100,
          dueAt: `2099-${String(number + 8).padStart(2, "0")}-11T12:00:00Z`,
        })),
      },
    ],
    ...overrides,
  };
}

/** Segredo fictício reconhecível apenas nos mocks do SDK. Não é uma credencial Stripe. */
export const paymentSessionFixture: PaymentSession = {
  bookingId: BOOKING_ID,
  installmentNumber: 1,
  installmentCount: 1,
  amount: 300,
  paymentIntentId: "pi_fixture",
  clientSecret: "pi_fixture_secret_synthetic",
  publishableKey: "pk_test_synthetic",
  pixExpiresAt: 4099723200,
  paymentMethods: ["card", "pix"],
  lateFee: 0,
};
