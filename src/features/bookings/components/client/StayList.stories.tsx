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
import { ownerTabOf } from "../../lib/bookingStatus";
import { StayList } from "./StayList";
import { expect, within } from "storybook/test";
import { bookingCopy } from "../../lib/bookingCopy";

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
        <PageContainer width="page"><Stack spacing={3}><PageHeader title={bookingCopy.owner.heading} />
          <StayList accountId={ACCOUNT} tab={ownerTabOf(tab)} />
        </Stack></PageContainer>
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

export const GradeDesktop: Story = {
  name: "REQ-UIC-007 Estadias em grade",
  globals: { viewport: { value: "desktop" } },
  play: async ({ canvasElement }) => {
    const list = await within(canvasElement).findByRole("list", { name: bookingCopy.owner.listLabel });
    const [first, second] = within(list).getAllByRole("listitem").map((item) => item.getBoundingClientRect());
    await expect(first!.top).toBe(second!.top);
    await expect(second!.left).toBeGreaterThan(first!.right);
  },
};
export const GradeCelular: Story = {
  globals: { viewport: { value: "celular" } },
  play: async ({ canvasElement }) => {
    const list = await within(canvasElement).findByRole("list", { name: bookingCopy.owner.listLabel });
    const [first, second] = within(list).getAllByRole("listitem").map((item) => item.getBoundingClientRect());
    await expect(first!.left).toBe(second!.left);
    await expect(second!.top).toBeGreaterThan(first!.bottom);
  },
};
