import { PageContainer } from "@/shared/ui/layout/PageContainer";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { BOOKING_ID, bookingDto, ownerContactDto } from "@/test/fixtures/bookings";
import { bookingDtoSchema } from "../../api/contracts";
import { toBooking } from "../../api/mappers";
import { bookingQueries } from "../../api/queries";
import { HostBookingDetail } from "./HostBookingDetail";

const ACCOUNT = "storybook-host";
const NOW = new Date("2026-12-10T15:00:00Z");

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
          <HostBookingDetail
            accountId={ACCOUNT}
            bookingId={BOOKING_ID}
            now={NOW}
            petProfiles={<p>A ficha dos pets entra aqui (widget booking-pet-profiles).</p>}
          />
        </PageContainer>
      </main>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/Bookings/HostBookingDetail",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Anfitriao" } },
  args: { overrides: {} },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Pedido: Story = { name: "REQ-HREQ-002 Pedido esperando resposta" };
export const Confirmada: Story = {
  name: "REQ-HREQ-007 Confirmada com contato",
  args: { overrides: { status: "confirmed", responseDeadline: null, contact: ownerContactDto } },
};
export const Recusada: Story = {
  name: "REQ-HREQ-005 Recusada",
  args: { overrides: { status: "declined", responseDeadline: null } },
};
export const Celular: Story = {
  name: "REQ-HREQ-002 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};
