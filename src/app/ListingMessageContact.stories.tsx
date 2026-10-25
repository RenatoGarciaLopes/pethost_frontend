import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, fn, userEvent, within } from "storybook/test";
import { ListingMessageContact } from "@/features/conversations/index.client";
import { listingDetailFixture, listingPhotosFixture, listingReviewFixture } from "@/test/fixtures/listingPage";
import { ListingPageScreen } from "@/features/listing-page";

const listing = listingDetailFixture({ photos: listingPhotosFixture, rating: { average: 4.9, count: 18 } });

const meta = {
  title: "Listing page/Contato pelo anúncio",
  component: ListingPageScreen,
  parameters: { layout: "fullscreen", design: { board: "Página do cantinho" } },
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  beforeEach: () => {
    useRouter.mockReturnValue({ ...getRouter(), push: fn(), replace: fn(), refresh: fn(), bfcacheId: "listing-contact" });
  },
  args: {
    listing,
    isOwner: false,
    accountRole: "owner",
    reviews: [listingReviewFixture()],
    contact: (
      <ListingMessageContact
        listingId={listing.id}
        accountId="0199f0a0-0000-7000-8000-00000000c0a1"
        recipientName="Dona Cida"
      />
    ),
    stay: {
      today: "2026-12-01",
      search: "where=Zona+7&pets=pet-1&from=2026-12-20&to=2026-12-25",
      where: "Zona 7",
      from: "2026-12-20",
      to: "2026-12-25",
      petIds: ["pet-1"],
      pets: [{ id: "pet-1", name: "Pipoca", coverUrl: null }],
    },
  },
} satisfies Meta<typeof ListingPageScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const TutorEscrevendo: Story = {
  name: "Tutor escreve antes de abrir a conversa",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Enviar mensagem" }));
    const messageField = canvas.getByRole("textbox", { name: "Mensagem para Dona Cida" });
    await expect(messageField).toBeVisible();
  },
};
