import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Surface } from "@/shared/ui/layout/Surface";
import { listingPhotoFixture } from "@/test/fixtures/listingPage";
import { StayBookingCard } from "./StayBookingCard";

const meta = {
  title: "Listing page/Lateral de reserva",
  component: StayBookingCard,
  parameters: { design: { board: "Página do cantinho" } },
  decorators: [
    (Story) => (
      <Surface elevation="lg" sx={{ p: 3, maxWidth: 360 }}>
        <Story />
      </Surface>
    ),
  ],
  args: {
    listingId: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c",
    nightlyRate: 60,
    hostName: "Dona Cida",
    today: "2026-12-01",
    search: "pets=pet-1&from=2026-12-20&to=2026-12-25",
    from: "2026-12-20",
    to: "2026-12-25",
    petIds: ["pet-1"],
    pets: [
      { id: "pet-1", name: "Pipoca", coverUrl: listingPhotoFixture("#FFE9B0", "#C58B4F") },
      { id: "pet-2", name: "Mel", coverUrl: null },
    ],
  },
} satisfies Meta<typeof StayBookingCard>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Como na prancha: Pipoca escolhida, 5 noites, conta e total. */
export const ComEstadia: Story = {};
export const SemDatas: Story = { args: { search: "", from: undefined, to: undefined, petIds: [] } };
export const SemPets: Story = { args: { pets: [], petIds: [] } };
/** No celular o botão vai para a barra fixa no rodapé. */
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
