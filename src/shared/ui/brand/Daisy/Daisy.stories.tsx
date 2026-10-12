import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Daisy } from "./Daisy";

const meta = {
  title: "Quintal/Brand/Daisy",
  component: Daisy,
  tags: ["autodocs"],
  parameters: { design: { board: "Loading-Caes" } },
  args: { petal: "branco", size: 64 },
} satisfies Meta<typeof Daisy>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Margarida branca balançando. */
export const Default: Story = { name: "REQ-DS-015 Margarida" };

/** As três cores, com atrasos diferentes. */
export const Canteiro: Story = {
  name: "REQ-DS-015 Canteiro",
  render: () => (
    <Stack direction="row" spacing={2} sx={{ alignItems: "flex-end" }}>
      <Daisy petal="branco" />
      <Daisy petal="ceu" size={52} delayMs={500} />
      <Daisy petal="coral" size={58} delayMs={1100} />
    </Stack>
  ),
};

/** Parada (para telas sem movimento). */
export const Parada: Story = { name: "REQ-DS-015 Parada", args: { sway: false } };
