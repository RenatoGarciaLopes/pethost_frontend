import { describe, expect, it } from "vitest";
import { paymentFixture } from "@/test/fixtures/bookingPayment";
import { paymentSchema } from "../api/paymentContracts";
import { nextPayableInstallment, paymentWindowClosed, isPaymentConfirmed } from "./paymentState";

describe("pagamento da estadia", () => {
  it("REQ-PAY-004 rejeita status desconhecido e preserva os valores da API", () => {
    expect(paymentSchema.parse(paymentFixture()).totalAmount).toBe(300);
    expect(paymentSchema.safeParse({ ...paymentFixture(), status: "inventado" }).success).toBe(false);
  });
  it("REQ-PAY-005/011 não pula parcela processando nem abre pagamento fechado", () => {
    const payment = paymentFixture();
    expect(nextPayableInstallment(payment)?.number).toBe(1);
    expect(
      nextPayableInstallment(paymentFixture({ installments: [{ ...payment.installments[0]!, status: "processing" }] })),
    ).toBeNull();
    expect(nextPayableInstallment(paymentFixture({ status: "cancelled" }))).toBeNull();
    expect(
      nextPayableInstallment(
        paymentFixture({
          installments: [
            { ...payment.installments[0]!, status: "paid" },
            { ...payment.installments[0]!, number: 2, status: "overdue" },
          ],
        }),
      )?.number,
    ).toBe(2);
  });
  it("REQ-PAY-003 fecha no instante limite, sem afetar parcelas seguintes", () => {
    const payment = paymentFixture({ paymentDeadline: "2026-12-11T12:00:00Z" });
    expect(paymentWindowClosed(payment, Date.parse("2026-12-11T11:59:59Z"))).toBe(false);
    expect(paymentWindowClosed(payment, Date.parse("2026-12-11T12:00:00Z"))).toBe(true);
    expect(
      paymentWindowClosed(
        paymentFixture({ status: "active", paymentDeadline: payment.paymentDeadline }),
        Date.parse("2026-12-12T12:00:00Z"),
      ),
    ).toBe(false);
  });
  it("REQ-PAY-008 exige pagamento e confirmação da reserva pela API", () => {
    const paid = paymentFixture({ installments: [{ ...paymentFixture().installments[0]!, status: "paid" }] });
    expect(isPaymentConfirmed(paid, "accepted")).toBe(false);
    expect(isPaymentConfirmed(paymentFixture(), "confirmed")).toBe(false);
    expect(isPaymentConfirmed(paid, "confirmed")).toBe(true);
  });
});
