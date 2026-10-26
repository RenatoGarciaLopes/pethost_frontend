import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { paymentSessionFixture } from "@/test/fixtures/bookingPayment";
import { renderWithProviders } from "@/test/render";
import { createStripeSdkFixture } from "@/test/stripeSdk";
import { StripePaymentForm } from "./StripePaymentForm";

const { confirmPayment } = vi.hoisted(() => ({ confirmPayment: vi.fn() }));
vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn(() => Promise.resolve(createStripeSdkFixture({ confirm: confirmPayment }))),
}));
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_test_synthetic");
  confirmPayment.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe("Stripe Payment Element", () => {
  it("102 mostra prazo apenas no Pix e acompanha mudanças do Payment Element", async () => {
    const { user } = renderWithProviders(
      <StripePaymentForm session={paymentSessionFixture} returnPath="/payment" onSubmitted={vi.fn()} />,
    );
    expect(screen.getByText(/No Pix, o código vale até/)).toBeVisible();
    await user.click(await screen.findByRole("radio", { name: "Cartão de crédito" }));
    expect(screen.queryByText(/No Pix, o código vale até/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Pix" }));
    expect(screen.getByText(/No Pix, o código vale até/)).toBeVisible();
    expect(confirmPayment).not.toHaveBeenCalled();
  });
  it("REQ-PAY-005/006 só envia após SDK pronto, sem segredo na URL de retorno", async () => {
    let resolve!: (result: unknown) => void;
    confirmPayment.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const onSubmitted = vi.fn();
    const { user } = renderWithProviders(
      <StripePaymentForm
        session={paymentSessionFixture}
        returnPath="/owner/bookings/id/payment"
        onSubmitted={onSubmitted}
      />,
    );
    const submit = screen.getByRole("button", { name: /Pagar/ });
    expect(submit).toBeDisabled();
    await user.click(await screen.findByRole("button", { name: "SDK pronto" }));
    await user.dblClick(submit);
    expect(confirmPayment).toHaveBeenCalledTimes(1);
    resolve({ paymentIntent: { status: "succeeded" } });
    await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
    expect(confirmPayment.mock.calls[0]?.[0]).toMatchObject({
      redirect: "if_required",
      confirmParams: { return_url: expect.stringContaining("payment_return=1&installment=1") },
    });
    expect(JSON.stringify(confirmPayment.mock.calls)).not.toContain(paymentSessionFixture.clientSecret);
  });
  it("REQ-PAY-009 erro do SDK não confirma nem exibe a mensagem crua", async () => {
    confirmPayment.mockResolvedValue({ error: { message: "secret raw bank response" } });
    const onSubmitted = vi.fn();
    const { user } = renderWithProviders(
      <StripePaymentForm session={paymentSessionFixture} returnPath="/payment" onSubmitted={onSubmitted} />,
    );
    await user.click(await screen.findByRole("button", { name: "SDK pronto" }));
    await user.click(screen.getByRole("button", { name: /Pagar/ }));
    expect(await screen.findByRole("alert")).not.toHaveTextContent("secret raw bank response");
    expect(onSubmitted).not.toHaveBeenCalled();
  });
  it("REQ-PAY-010 falha ao carregar oferece aviso e não permite envio", async () => {
    const { user } = renderWithProviders(
      <StripePaymentForm session={paymentSessionFixture} returnPath="/payment" onSubmitted={vi.fn()} />,
    );
    await user.click(await screen.findByRole("button", { name: "SDK falhou" }));
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(screen.getByRole("button", { name: /Pagar/ })).toBeDisabled();
  });
});
