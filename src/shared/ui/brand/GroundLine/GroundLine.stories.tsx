import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { GroundLine } from "./GroundLine";

const meta = {
  title: "Quintal/Brand/GroundLine",
  component: GroundLine,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Conta" } },
  decorators: [(Story) => <Box sx={{ width: 480 }}>{Story()}</Box>],
} satisfies Meta<typeof GroundLine>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Chão com tufinhos. */
export const Default: Story = { name: "REQ-DS-015 Chão" };

/** Sem tufinhos, mais baixo. */
export const Liso: Story = { name: "REQ-DS-015 Chão liso", args: { tufts: false, height: 16 } };
