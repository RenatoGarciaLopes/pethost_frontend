import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { withQueryClient } from "@/test/storybook/withQueryClient";
import { NearbyListings } from "./NearbyListings";

const meta = {
  title: "Home/Perto de você",
  component: NearbyListings,
  tags: ["autodocs"],
  parameters: { design: { board: "Quintal-Casas" }, layout: "fullscreen" },
  args: { scope: "visitor" },
  decorators: [withQueryClient],
} satisfies Meta<typeof NearbyListings>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Antes do gesto: só o convite e o botão; a posição nunca é pedida sozinha sem permissão prévia. */
export const AntesDoGesto: Story = { name: "REQ-NEARBY-010 Antes do gesto" };
