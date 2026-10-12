import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Sticker } from "./Sticker";

const meta = {
  title: "Quintal/Feedback/Sticker",
  component: Sticker,
  tags: ["autodocs"],
  parameters: { design: { board: "Quintal-Casas" } },
  args: { label: "Vizinho", color: "grama" },
} satisfies Meta<typeof Sticker>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Adesivo "Vizinho". */
export const Vizinho: Story = { name: "REQ-DS-014 Vizinho" };

/** As três cores. */
export const Cores: Story = {
  name: "REQ-DS-014 Cores",
  render: () => (
    <Stack direction="row" spacing={2} sx={{ p: 2 }}>
      <Sticker label="Vizinho" color="grama" />
      <Sticker label="Novo por aqui" color="ceu" tilt={-3} />
      <Sticker label="Aberto!" color="gema" />
    </Stack>
  ),
};
