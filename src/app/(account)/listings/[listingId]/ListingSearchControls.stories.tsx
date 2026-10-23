import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { fn } from "storybook/test";
import { ListingSearchControls } from "./ListingSearchControls";

const meta = {
  title: "Listing page/Escolha de datas e pets",
  component: ListingSearchControls,
  parameters: { design: { board: "Fluxo-Reserva" } },
  args: {
    listingId: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c",
    today: "2026-10-15",
    query: { pets: [], species: [], sizes: [] },
    pets: [{ id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1d", name: "Luna", species: "dog", size: "small" }],
  },
  beforeEach: () => {
    useRouter.mockReturnValue({ ...getRouter(), push: fn(), refresh: fn(), bfcacheId: "listing-search" });
  },
} satisfies Meta<typeof ListingSearchControls>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Fechado: Story = {};
export const ComDatas: Story = {
  args: {
    query: {
      pets: ["0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1d"],
      species: [],
      sizes: [],
      from: "2026-10-16",
      to: "2026-10-17",
    },
  },
};
