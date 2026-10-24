import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Container } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "@/shared/api/errors/ApiError";
import { BOOKING_ID, bookingDto } from "@/test/fixtures/bookings";
import { paymentFixture, paymentSessionFixture } from "@/test/fixtures/bookingPayment";
import { bookingDtoSchema } from "../../api/contracts";
import { toBooking } from "../../api/mappers";
import { paymentQuery } from "../../api/paymentQueries";
import { bookingQueries } from "../../api/queries";
import { useBookingPayment } from "../../hooks/useBookingPayment";
import { BookingPaymentView } from "./BookingPayment";

type Mode = "ready" | "loading" | "opening" | "sdk" | "waiting" | "error" | "expired" | "success" | "installments";
const ACCOUNT = "storybook-payment";

function Content({ mode, coverUrl }: { mode: Mode; coverUrl?: string }) {
  const state = useBookingPayment(ACCOUNT, BOOKING_ID);
  return (
    <BookingPaymentView
      bookingId={BOOKING_ID}
      coverUrl={coverUrl}
      state={{
        ...state,
        busy: mode === "opening",
        waiting: mode === "waiting",
        celebrate: mode === "success",
        session: mode === "sdk" ? paymentSessionFixture : null,
        error:
          mode === "error"
            ? new ApiError({ status: 503, code: "PAYMENT_STRIPE_UNAVAILABLE", message: "synthetic" })
            : null,
        open: async () => {},
        synchronize: async () => {},
      }}
    />
  );
}

/** Cache isolado e desabilitado para rede; stories mostram estados sem chamar API ou cobrar. */
function Frame({ mode = "ready", coverUrl }: { mode?: Mode; coverUrl?: string }) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false, enabled: false } },
    });
    if (mode === "loading") return queryClient;
    const paid = mode === "success";
    const payment = paymentFixture(
      paid
        ? { status: "paid", paidAmount: 300, installments: [{ ...paymentFixture().installments[0]!, status: "paid" }] }
        : mode === "expired"
          ? { paymentDeadline: "2020-01-01T12:00:00Z" }
          : mode === "installments"
            ? {
                status: "active",
                options: null,
                installmentCount: 3,
                installments: [
                  { ...paymentFixture().installments[0]!, amount: 100, status: "paid" },
                  {
                    ...paymentFixture().installments[0]!,
                    number: 2,
                    amount: 100,
                    amountDue: 105,
                    lateFee: 5,
                    status: "overdue",
                  },
                ],
              }
            : {},
    );
    queryClient.setQueryData(paymentQuery(ACCOUNT, BOOKING_ID).queryKey, payment);
    queryClient.setQueryData(
      bookingQueries.detail(ACCOUNT, BOOKING_ID).queryKey,
      toBooking(
        bookingDtoSchema.parse(bookingDto({ status: paid || mode === "installments" ? "confirmed" : "accepted" })),
      ),
    );
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
        <Content mode={mode} coverUrl={coverUrl} />
      </Container>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/Bookings/Payment",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", design: { board: "desk-pagamento" } },
  args: { mode: "ready" },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SemFoto: Story = {};
export const CapaIndisponivel: Story = { args: { coverUrl: "/capa-indisponivel.png" } };
export const Carregando: Story = { args: { mode: "loading" } };
export const AbrindoSessao: Story = { args: { mode: "opening" } };
export const CheckoutSemConfiguracao: Story = { args: { mode: "sdk" } };
export const EsperandoPix: Story = { args: { mode: "waiting" } };
export const Erro: Story = { args: { mode: "error" } };
export const PrazoVencido: Story = { args: { mode: "expired" } };
export const Fechado: Story = { args: { mode: "success" } };
export const ProximaParcela: Story = { args: { mode: "installments" } };
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
