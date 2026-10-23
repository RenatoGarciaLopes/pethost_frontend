import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { fn } from "storybook/test";
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
  // A lateral troca datas e pets pela URL: o router do Next vem do mock do Storybook.
  beforeEach: () => {
    useRouter.mockReturnValue({ ...getRouter(), replace: fn(), refresh: fn(), bfcacheId: "listing-page" });
  },
  args: {
    listingId: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c",
    account: "owner",
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
/** Visitante (sem conta): as datas valem, sem "Quem vai"; "Pedir estadia" leva ao login de tutor e volta aqui. */
export const Visitante: Story = {
  args: { account: "visitor", pets: [], petIds: [], count: 1, search: "from=2026-12-20&to=2026-12-25" },
};
/** Anfitrião vendo cantinho alheio: o mesmo card; "Pedir estadia" leva à troca para a conta de tutor e volta aqui. */
export const Anfitriao: Story = {
  args: { account: "host", pets: [], petIds: [], count: 1, search: "from=2026-12-20&to=2026-12-25" },
};
