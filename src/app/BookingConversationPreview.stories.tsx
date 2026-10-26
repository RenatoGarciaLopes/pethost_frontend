import { useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Container } from "@mui/material";
import { useState } from "react";
import { expect, within, fn } from "storybook/test";
import { bookingQueries, StayDetail, HostBookingDetail } from "@/features/bookings/index.client";
import { conversationQueries, conversationDtoSchema, toConversation } from "@/features/conversations";
import { BookingConversation } from "@/widgets/booking-conversation";
import { BOOKING_ID, bookingDto } from "@/test/fixtures/bookings";
import { conversationDto } from "@/test/fixtures/conversations";
import { bookingDtoSchema, toBooking } from "@/features/bookings";

/** Prévia da composição das rotas, com cache determinístico e sem backend.
 * @example <Preview side="host" hasConversation /> */
function Preview({ side, hasConversation }: { side: "owner" | "host"; hasConversation: boolean }) {
  const [client] = useState(() => {
    const cache = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false, refetchInterval: false } },
    });
    const booking = toBooking(bookingDtoSchema.parse(bookingDto()));
    cache.setQueryData(bookingQueries.detail("preview", BOOKING_ID).queryKey, booking);
    cache.setQueryData(
      conversationQueries.mine("preview").queryKey,
      hasConversation
        ? [toConversation(conversationDtoSchema.parse(conversationDto({ ownerId: booking.ownerId })))]
        : [],
    );
    return cache;
  });
  const props = {
    accountId: "preview",
    bookingId: BOOKING_ID,
    now: new Date("2026-12-10T15:00:00Z"),
    conversation: <BookingConversation accountId="preview" bookingId={BOOKING_ID} side={side} />,
  };
  return (
    <QueryClientProvider client={client}>
      <Container component="main" maxWidth={side === "owner" ? "md" : "lg"} sx={{ py: 3 }}>
        {side === "owner" ? (
          <StayDetail {...props} />
        ) : (
          <HostBookingDetail {...props} petProfiles={<p>A ficha da Pipoca aparece aqui.</p>} />
        )}
      </Container>
    </QueryClientProvider>
  );
}
const meta = {
  beforeEach: () => {
    useRouter.mockReturnValue({ ...getRouter(), refresh: fn(), bfcacheId: "105" });
  },
  title: "Reservas/Conversa",
  component: Preview,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: false } },
  args: { side: "owner", hasConversation: true },
} satisfies Meta<typeof Preview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Tutor: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("button", { name: "Conversar com Aparecida Souza" })).toBeVisible();
  },
};
export const Anfitriao: Story = {
  args: { side: "host" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("link", { name: /Conversar com Camila/ })).toHaveAttribute(
      "href",
      "/conversations/0199f0a0-0000-7000-8000-00000000c1a1",
    );
  },
};
export const AnfitriaoSemConversa: Story = {
  args: { side: "host", hasConversation: false },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/A conversa abre quando/)).toBeVisible();
  },
};
