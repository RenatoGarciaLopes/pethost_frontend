import { fireEvent, screen, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Activity, StrictMode, type ActivityProps } from "react";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { BOOKING_ID, bookingDto } from "@/test/fixtures/bookings";
import { paymentFixture, paymentSessionFixture } from "@/test/fixtures/bookingPayment";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import type { BookingPaymentData } from "../../api/paymentContracts";
import { BookingPayment } from "./BookingPayment";

vi.mock("./StripePaymentForm", () => ({
  StripePaymentForm: ({ onSubmitted }: { onSubmitted: () => void }) => (
    <button onClick={onSubmitted}>Confirmar no Stripe simulado</button>
  ),
}));
const path = `*/api/bookings/${BOOKING_ID}`;
beforeEach(() => vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_test_synthetic"));
afterEach(() => vi.unstubAllEnvs());

function setup(
  payment: BookingPaymentData = paymentFixture(),
  bookingStatus = "accepted",
  coverUrl?: string,
  strict = false,
) {
  let current = payment;
  let status = bookingStatus;
  const sessions = vi.fn();
  const choose = vi.fn();
  server.use(
    http.get(path, () => HttpResponse.json(apiOk(bookingDto({ status })))),
    http.get(`${path}/payment`, () => HttpResponse.json(apiOk(current))),
    http.put(`${path}/payment`, async ({ request }) => {
      choose(await request.json());
      current = { ...current, status: "pending", installmentCount: 1, installments: paymentFixture().installments };
      return HttpResponse.json(apiOk(current));
    }),
    http.post(`${path}/payment/installments/:number/payment-session`, async ({ params }) => {
      sessions(params.number);
      await delay(100);
      return HttpResponse.json(apiOk({ ...paymentSessionFixture, installmentNumber: Number(params.number) }));
    }),
    http.post(`${path}/payment/synchronization`, () => HttpResponse.json(apiOk(current))),
  );
  const checkout = (mode: ActivityProps["mode"]) => (
    <Activity mode={mode}>
      {strict ? (
        <StrictMode>
          <BookingPayment accountId="account-1" bookingId={BOOKING_ID} coverUrl={coverUrl} />
        </StrictMode>
      ) : (
        <BookingPayment accountId="account-1" bookingId={BOOKING_ID} coverUrl={coverUrl} />
      )}
    </Activity>
  );
  const view = renderWithProviders(checkout("visible"), {
    theme: quintalTheme,
  });
  return {
    ...view,
    sessions,
    choose,
    setVisibility: (mode: ActivityProps["mode"]) => view.rerender(checkout(mode)),
    confirm: (
      next = paymentFixture({
        status: "paid",
        paidAmount: 300,
        installments: [{ ...paymentFixture().installments[0]!, status: "paid" }],
      }),
    ) => {
      current = next;
      status = "confirmed";
    },
  };
}

describe("checkout da estadia", { timeout: 15000 }, () => {
  it("REQ-PAY-002/006 mostra resumo e lembrete sem repetir aceite obrigatório", async () => {
    setup();
    expect(await screen.findByRole("heading", { name: "Confirme e pague" })).toBeVisible();
    expect(screen.getByRole("complementary", { name: "Resumo da estadia" })).toHaveTextContent("Casa da Cida");
    expect(screen.getByText(/Lembrete: leve a ração/)).toBeVisible();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/Avenida Brasil/)).not.toBeInTheDocument();
  });
  it("REQ-PAY-002 capa da API que falha mostra fallback sem impedir pagamento", async () => {
    setup(paymentFixture(), "accepted", "https://images.example.test/yard.webp");
    const image = await screen.findByRole("img", { name: "Casa da Cida" });
    fireEvent.error(image);
    expect(screen.getByText("Um cantinho esperando por seus pets")).toBeVisible();
    expect(screen.getByRole("button", { name: "Continuar para o pagamento" })).toBeEnabled();
  });
  it("REQ-PAY-004/005 escolhe plano antes da sessão e evita duas sessões", async () => {
    const { user, choose, sessions } = setup(
      paymentFixture({ status: "not_started", installments: [], installmentCount: null }),
    );
    await user.dblClick(await screen.findByRole("button", { name: "Continuar para o pagamento" }));
    expect(await screen.findByRole("button", { name: "Confirmar no Stripe simulado" })).toBeVisible();
    expect(choose).toHaveBeenCalledWith({ installmentCount: 1 });
    expect(sessions).toHaveBeenCalledTimes(1);
  });
  it("101 seleciona plano por teclado e envia installmentCount da API", async () => {
    const { user, choose } = setup(paymentFixture({ status: "not_started", installmentCount: null, installments: [] }));
    const first = await screen.findByRole("radio", { name: /À vista/ });
    first.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: /3×/ })).toBeChecked();
    expect(screen.getByRole("list", { name: "Vencimentos das parcelas" })).toHaveTextContent("3ª parcela");
    await user.click(screen.getByRole("button", { name: "Continuar para o pagamento" }));
    await screen.findByRole("button", { name: "Confirmar no Stripe simulado" });
    expect(choose).toHaveBeenCalledWith({ installmentCount: 3 });
  });
  it("101 preserva ordem e valores desiguais da API e permite escolher por clique", async () => {
    const plans = paymentFixture().options!;
    const { user, choose } = setup(
      paymentFixture({
        status: "not_started",
        installmentCount: null,
        installments: [],
        totalAmount: 345,
        options: [
          {
            ...plans[1]!,
            count: 2,
            firstAmount: 145,
            otherAmount: 200,
            installments: [
              { number: 1, amount: 145, dueAt: "2099-11-11T12:00:00Z" },
              { number: 2, amount: 200, dueAt: "2099-12-11T12:00:00Z" },
            ],
          },
          plans[0]!,
        ],
      }),
    );
    const radios = await screen.findAllByRole("radio");
    expect(radios[0]).toHaveAccessibleName(/2×.*145,00.*200,00/);
    expect(radios[0]).toBeChecked();
    await user.click(radios[1]!);
    await user.click(radios[0]!);
    expect(screen.getByRole("complementary", { name: "Resumo da estadia" })).toHaveTextContent("345,00");
    expect(screen.getByRole("list", { name: "Vencimentos das parcelas" })).toHaveTextContent("200,00");
    await user.click(screen.getByRole("button", { name: "Continuar para o pagamento" }));
    await screen.findByRole("button", { name: "Confirmar no Stripe simulado" });
    expect(choose).toHaveBeenCalledWith({ installmentCount: 2 });
  });
  it("REQ-PAY-007/008 mantém pendência e só celebra após confirmação da API", async () => {
    const { user, confirm } = setup();
    await user.click(await screen.findByRole("button", { name: "Continuar para o pagamento" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar no Stripe simulado" }));
    expect(await screen.findByRole("heading", { name: "Esperando o banco confirmar" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Fechado!" })).not.toBeInTheDocument();
    confirm();
    await user.click(screen.getByRole("button", { name: "Conferir pagamento" }));
    const title = await screen.findByRole("heading", { name: "Fechado!" });
    await waitFor(() => expect(title).toHaveFocus());
    expect(screen.getByRole("link", { name: "Ver a estadia" })).toHaveAttribute(
      "href",
      `/owner/bookings/${BOOKING_ID}`,
    );
  });
  it("REQ-PAY-003/010 prazo vencido bloqueia checkout", async () => {
    const { sessions } = setup(paymentFixture({ paymentDeadline: "2020-01-01T12:00:00Z" }));
    expect(await screen.findByText("O prazo deste pagamento acabou.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Continuar para o pagamento" })).not.toBeInTheDocument();
    expect(sessions).not.toHaveBeenCalled();
  });
  it("REQ-PAY-009 falha 503 não mostra mensagem crua e permite tentar de novo", async () => {
    const { user } = setup();
    server.use(
      http.post(`${path}/payment/installments/:number/payment-session`, () =>
        HttpResponse.json(apiFail("PAYMENT_STRIPE_UNAVAILABLE"), { status: 503 }),
      ),
    );
    await user.click(await screen.findByRole("button", { name: "Continuar para o pagamento" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Continuar para o pagamento" })).toBeEnabled());
    expect(screen.queryByText("PAYMENT_STRIPE_UNAVAILABLE")).not.toBeInTheDocument();
  });
  it("REQ-PAY-005 sem chave não cria sessão", async () => {
    vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "");
    const { sessions } = setup();
    expect(await screen.findByRole("button", { name: "Continuar para o pagamento" })).toBeDisabled();
    expect(sessions).not.toHaveBeenCalled();
  });
  it("REQ-PAY-011 abre a próxima parcela sem nova celebração", async () => {
    const first = paymentFixture().installments[0]!;
    const { user, sessions } = setup(
      paymentFixture({
        status: "active",
        options: null,
        installments: [
          { ...first, status: "paid" },
          { ...first, number: 2, status: "overdue", amountDue: 305, lateFee: 5 },
        ],
      }),
      "confirmed",
    );
    await user.click(await screen.findByRole("button", { name: "Continuar para o pagamento" }));
    await screen.findByRole("button", { name: "Confirmar no Stripe simulado" });
    expect(sessions).toHaveBeenCalledWith("2");
    expect(screen.queryByRole("heading", { name: "Fechado!" })).not.toBeInTheDocument();
  });
  it.each([false, true])(
    "REQ-PAY-011 oculta e restaura o checkout preservado pelo router sem repetir a celebração (StrictMode=%s)",
    async (strict) => {
      const first = { ...paymentFixture().installments[0]!, amount: 100, amountDue: 100 };
      const installments = [first, { ...first, number: 2 }, { ...first, number: 3 }];
      const payment = paymentFixture({ options: null, installmentCount: 3, installments });
      const { user, confirm, sessions, setVisibility } = setup(payment, "accepted", undefined, strict);
      await user.click(await screen.findByRole("button", { name: "Continuar para o pagamento" }));
      await user.click(await screen.findByRole("button", { name: "Confirmar no Stripe simulado" }));
      await screen.findByRole("heading", { name: "Esperando o banco confirmar" });
      const firstPaid = { ...first, status: "paid" as const };
      confirm({
        ...payment,
        status: "active",
        paidAmount: 100,
        installments: [firstPaid, installments[1]!, installments[2]!],
      });
      await user.click(screen.getByRole("button", { name: "Conferir pagamento" }));
      await screen.findByRole("heading", { name: "Fechado!" });

      setVisibility("hidden");
      setVisibility("visible");
      expect(await screen.findByRole("heading", { name: "Confirme e pague" })).toBeVisible();
      expect(screen.queryByRole("heading", { name: "Fechado!" })).not.toBeInTheDocument();
      expect(screen.getByText(/Já pago:.*100,00/)).toBeVisible();
      expect(screen.queryByRole("radiogroup", { name: "Como você prefere pagar?" })).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Continuar para o pagamento" }));
      await screen.findByRole("button", { name: "Confirmar no Stripe simulado" });
      expect(sessions).toHaveBeenLastCalledWith("2");
      confirm({
        ...payment,
        status: "active",
        paidAmount: 200,
        installments: [firstPaid, { ...firstPaid, number: 2 }, installments[2]!],
      });
      await user.click(screen.getByRole("button", { name: "Confirmar no Stripe simulado" }));
      expect(await screen.findByText(/Já pago:.*200,00/)).toBeVisible();
      expect(screen.getByRole("heading", { name: "Confirme e pague" })).toBeVisible();
      expect(screen.queryByRole("heading", { name: "Fechado!" })).not.toBeInTheDocument();
    },
  );
  it("REQ-PAY-009 conflito relê pagamento e reserva antes de permitir nova tentativa", async () => {
    const { user } = setup();
    const readPayment = vi.fn(() => HttpResponse.json(apiOk(paymentFixture())));
    const readBooking = vi.fn(() => HttpResponse.json(apiOk(bookingDto({ status: "accepted" }))));
    server.use(
      http.get(`${path}/payment`, readPayment),
      http.get(path, readBooking),
      http.post(`${path}/payment/installments/:number/payment-session`, () =>
        HttpResponse.json(apiFail("PAYMENT_CONFLICT"), { status: 409 }),
      ),
    );
    await user.click(await screen.findByRole("button", { name: "Continuar para o pagamento" }));
    await waitFor(() => expect(readPayment).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(readBooking).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("heading", { name: "Fechado!" })).not.toBeInTheDocument();
  });
  it.each([false, true])(
    "REQ-PAY-008 retorno do Stripe apaga query sensível e sincroniza sem confiar nela (StrictMode=%s)",
    async (strict) => {
      window.history.replaceState(null, "", "/?payment_return=1&installment=1&payment_intent_client_secret=synthetic");
      const { confirm, user } = setup(paymentFixture(), "accepted", undefined, strict);
      expect(await screen.findByRole("heading", { name: "Esperando o banco confirmar" })).toBeVisible();
      expect(window.location.search).toBe("");
      expect(screen.queryByRole("heading", { name: "Fechado!" })).not.toBeInTheDocument();
      confirm();
      await user.click(screen.getByRole("button", { name: "Conferir pagamento" }));
      expect(await screen.findByRole("heading", { name: "Fechado!" })).toBeVisible();
    },
  );
});
