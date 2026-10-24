import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { bookingDto, bookingPageDto, THOR_ID } from "@/test/fixtures/bookings";
import { BOOKING_STATUSES, bookingPageSchema } from "../../api/contracts";
import { toBookingPage } from "../../api/mappers";
import { bookingQueries } from "../../api/queries";
import { StayList } from "./StayList";

const ACCOUNT = "storybook-owner";
const id = (n: number) => `0199f0a0-0000-7000-8000-0000000002${String(n).padStart(2, "0")}`;
const FAR = "2099-12-31T20:00:00+00:00";
const closed = { responseDeadline: null };

interface FrameProps {
  items: unknown[];
}

/** Primeira página semeada; staleTime infinito: nenhuma story chama a API. */
function Frame({ items }: FrameProps) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    queryClient.setQueryData(bookingQueries.infinite(ACCOUNT, BOOKING_STATUSES).queryKey, {
      pages: [toBookingPage(bookingPageSchema.parse(bookingPageDto(items)))],
      pageParams: [1],
    });
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <main>
        <StayList accountId={ACCOUNT} />
      </main>
    </QueryClientProvider>
  );
}

const PRANCHA = [
  bookingDto({ ...closed, id: id(1), status: "accepted", paymentDeadline: FAR }),
  bookingDto({
    ...closed,
    id: id(2),
    status: "in_progress",
    pets: [{ id: THOR_ID, name: "Mel", species: "cat", size: "small" }],
  }),
  bookingDto({ ...closed, id: id(3), status: "completed" }),
  bookingDto({ ...closed, id: id(4), status: "expired" }),
];

const meta = {
  title: "Features/Bookings/StayList",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Reserva" } },
  args: { items: PRANCHA },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Prancha: Story = { name: "REQ-STAYS-002 Aceita, em andamento, concluída e expirada" };
export const Esperando: Story = {
  name: "REQ-STAYS-010 Esperando resposta e confirmada",
  args: {
    items: [
      bookingDto({ id: id(5), responseDeadline: FAR }),
      bookingDto({ ...closed, id: id(6), status: "confirmed" }),
    ],
  },
};
export const NaoAconteceram: Story = {
  name: "REQ-STAYS-010 Não aceita, expirada sem pagar e cancelada",
  args: {
    items: [
      bookingDto({ ...closed, id: id(7), status: "declined" }),
      bookingDto({ ...closed, id: id(8), status: "expired", respondedAt: "2026-12-10T13:00:00+00:00" }),
      bookingDto({ ...closed, id: id(9), status: "cancelled", refundPercentage: 100 }),
    ],
  },
};
export const Vazia: Story = { name: "REQ-STAYS-003 Lista vazia", args: { items: [] } };
export const Celular: Story = {
  name: "REQ-STAYS-002 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};
