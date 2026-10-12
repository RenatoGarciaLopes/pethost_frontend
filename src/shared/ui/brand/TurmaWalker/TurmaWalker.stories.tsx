import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TurmaDog } from "./TurmaDog";
import { TurmaWalker } from "./TurmaWalker";

const meta = {
  title: "Quintal/Brand/TurmaWalker",
  component: TurmaWalker,
  tags: ["autodocs"],
  parameters: { design: { board: "Quintal-Visitante" } },
  decorators: [(Story) => <Box sx={{ width: 520 }}>{Story()}</Box>],
} satisfies Meta<typeof TurmaWalker>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Desfile contínuo, um cachorro por vez. */
export const Desfile: Story = { name: "REQ-DS-016 Desfile" };

/** Dois na pista ao mesmo tempo (ritmo do loading). */
export const DoisPorVez: Story = {
  name: "REQ-DS-016 Dois por vez",
  args: { crossingMs: 2000, intervalMs: 667, dogHeight: 64 },
};

/** Um cachorro de vez em quando (cena do login: a cada 16 s). */
export const DeVezEmQuando: Story = {
  name: "REQ-DS-016 De vez em quando",
  args: { crossingMs: 6000, intervalMs: 16000, dogHeight: 64 },
};

/** Cada um passa uma vez e para. */
export const UmaVez: Story = { name: "REQ-DS-016 Uma vez", args: { repeat: "once", crossingMs: 3000 } };

/** Um cachorro parado (primeiro quadro), como fica com movimento reduzido. */
export const Parado: Story = {
  name: "REQ-DS-008 Parado",
  render: () => <TurmaDog member="golden" height={84} still />,
};
