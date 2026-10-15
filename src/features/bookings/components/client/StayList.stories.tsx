import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { bookingDto, bookingPageDto } from "@/test/fixtures/bookings";
import { bookingPageSchema } from "../../api/contracts";
import { toBookingPage } from "../../api/mappers";
import { bookingQueries } from "../../api/queries";
import { ownerTabOf } from "../../lib/bookingStatus";
import { StayList } from "./StayList";

const ACCOUNT = "storybook-owner";

interface FrameProps {
  tab: string;
  items: unknown[];
}

/** Primeira página da aba semeada; staleTime infinito: nenhuma story chama a API. */
function Frame({ tab, items }: FrameProps) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    queryClient.setQueryData(bookingQueries.infinite(ACCOUNT, ownerTabOf(tab).statuses).queryKey, {
      pages: [toBookingPage(bookingPageSchema.parse(bookingPageDto(items)))],
      pageParams: [1],
    });
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <main>
        <StayList accountId={ACCOUNT} tab={ownerTabOf(tab)} />
      </main>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/Bookings/StayList",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Reserva" } },
  args: {
    tab: "proximas",
    items: [bookingDto(), bookingDto({ id: "0199f0a0-0000-7000-8000-000000000201", status: "confirmed" })],
  },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Proximas: Story = { name: "REQ-STAYS-002 Próximas" };
export const Anteriores: Story = {
  name: "REQ-STAYS-001 Anteriores",
  args: {
    tab: "anteriores",
    items: [
      bookingDto({ status: "completed", responseDeadline: null }),
      bookingDto({ id: "0199f0a0-0000-7000-8000-000000000202", status: "declined", responseDeadline: null }),
    ],
  },
};
export const Vazia: Story = { name: "REQ-STAYS-003 Aba vazia", args: { items: [] } };
export const Celular: Story = {
  name: "REQ-STAYS-002 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};
