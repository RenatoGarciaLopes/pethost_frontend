import { PageContainer } from "@/shared/ui/layout/PageContainer";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { BOOKING_ID, bookingDto } from "@/test/fixtures/bookings";
import { bookingDtoSchema } from "../../api/contracts";
import { toBooking } from "../../api/mappers";
import { bookingQueries } from "../../api/queries";
import { StayDetail } from "./StayDetail";

const ACCOUNT = "storybook-owner";
const NOW = new Date("2026-12-10T15:00:00Z");
const hostContact = {
  phone: "44988887777",
  address: {
    zipCode: "87020000",
    street: "Avenida Brasil",
    number: "120",
    complement: "Casa 2",
    neighborhood: "Zona 01",
    city: "Maringá",
    state: "PR",
  },
};

/** Estadia semeada no cache; staleTime infinito: nenhuma story chama a API. */
function Frame({ overrides }: { overrides: Record<string, unknown> }) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    queryClient.setQueryData(
      bookingQueries.detail(ACCOUNT, BOOKING_ID).queryKey,
      toBooking(bookingDtoSchema.parse(bookingDto(overrides))),
    );
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <main>
        <PageContainer width="page">
          <StayDetail accountId={ACCOUNT} bookingId={BOOKING_ID} now={NOW} />
        </PageContainer>
      </main>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/Bookings/StayDetail",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Reserva" } },
  args: { overrides: {} },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Pedido: Story = { name: "REQ-STAYS-004 Esperando resposta" };
export const Confirmada: Story = {
  name: "REQ-STAYS-005 Confirmada com contato",
  args: { overrides: { status: "confirmed", responseDeadline: null, contact: hostContact } },
};
export const Acontecendo: Story = {
  name: "REQ-STAYS-004 Acontecendo",
  args: { overrides: { status: "in_progress", responseDeadline: null, contact: hostContact } },
};
export const Recusada: Story = {
  name: "REQ-STAYS-008 Não aceita",
  args: { overrides: { status: "declined", responseDeadline: null, declineReason: "Já estou com a casa cheia" } },
};
export const Expirada: Story = {
  name: "REQ-STAYS-008 Expirou",
  args: { overrides: { status: "expired", responseDeadline: null } },
};
export const Cancelada: Story = {
  name: "REQ-STAYS-007 Cancelada",
  args: {
    overrides: { status: "cancelled", responseDeadline: null, cancelledBy: "owner", refundPercentage: 100 },
  },
};
export const Celular: Story = {
  name: "REQ-STAYS-004 Celular",
  args: { overrides: { status: "confirmed", responseDeadline: null, contact: hostContact } },
  globals: { viewport: { value: "celular", isRotated: false } },
};
