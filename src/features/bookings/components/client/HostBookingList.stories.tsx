import { bookingCopy } from "../../lib/bookingCopy";
import { Stack } from "@mui/material";
import { PageHeader } from "@/shared/ui/layout/PageHeader";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { bookingDto, bookingPageDto } from "@/test/fixtures/bookings";
import { bookingPageSchema } from "../../api/contracts";
import { toBookingPage } from "../../api/mappers";
import { bookingQueries } from "../../api/queries";
import { HOST_TABS, hostTabOf } from "../../lib/bookingStatus";
import { HostBookingList } from "./HostBookingList";
import { expect, within } from "storybook/test";

const ACCOUNT = "storybook-host";
const NOW = new Date("2026-12-10T15:00:00Z");

interface FrameProps {
  tab: string;
  items: unknown[];
}

/** Cache semeado (a aba e o contador de pedidos); staleTime infinito: nenhuma story chama a API. */
function Frame({ tab, items }: FrameProps) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    const page = toBookingPage(bookingPageSchema.parse(bookingPageDto(items)));
    queryClient.setQueryData(bookingQueries.mine(ACCOUNT, { statuses: hostTabOf(tab).statuses }).queryKey, page);
    queryClient.setQueryData(bookingQueries.mine(ACCOUNT, { statuses: HOST_TABS[0]!.statuses }).queryKey, page);
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <main>
        <PageContainer width="page"><Stack spacing={3}><PageHeader title={bookingCopy.host.heading} />
          <HostBookingList accountId={ACCOUNT} tab={hostTabOf(tab)} page={1} now={NOW} />
        </Stack></PageContainer>
      </main>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/Bookings/HostBookingList",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Anfitriao" } },
  args: { tab: "pedidos", items: [bookingDto()] },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Pedidos: Story = { name: "REQ-HREQ-001 Pedidos" };
export const PrazoPerto: Story = {
  name: "REQ-HREQ-002 Prazo perto",
  args: { items: [bookingDto({ responseDeadline: "2026-12-10T16:30:00Z" })] },
};
export const Vazia: Story = { name: "REQ-HREQ-001 Aba vazia", args: { tab: "acontecendo", items: [] } };
export const Celular: Story = {
  name: "REQ-HREQ-001 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};

const threeBookings = [1, 2, 3].map((id) => bookingDto({ id: `0199f0a0-0000-7000-8000-00000000020${id}` }));
export const GradeDesktop: Story = {
  name: "REQ-UIC-007 Pedidos em grade",
  args: { items: threeBookings },
  globals: { viewport: { value: "desktop" } },
  play: async ({ canvasElement }) => {
    const cards = await within(canvasElement).findAllByRole("article");
    await expect(cards).toHaveLength(3);
    const [first, second] = cards.map((card) => card.getBoundingClientRect());
    await expect(first!.top).toBe(second!.top);
    await expect(second!.left).toBeGreaterThan(first!.right);
  },
};
export const GradeCelular: Story = {
  args: { items: threeBookings },
  globals: { viewport: { value: "celular" } },
  play: async ({ canvasElement }) => {
    const cards = await within(canvasElement).findAllByRole("article");
    const [first, second] = cards.map((card) => card.getBoundingClientRect());
    await expect(first!.left).toBe(second!.left);
    await expect(second!.top).toBeGreaterThan(first!.bottom);
  },
};
