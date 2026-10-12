import { Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { EmptyState } from "./EmptyState";

const meta = {
  title: "Quintal/Feedback/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Pet / Meus pets" } },
  args: {
    title: "Ainda não tem pet por aqui.",
    description: "Apresenta seu pet pra gente: leva uns 5 minutos.",
    action: <Button variant="contained">Apresentar meu pet</Button>,
  },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Com ação. */
export const Default: Story = { name: "REQ-DS-014 Vazio com ação" };

/** Só o texto. */
export const SoTexto: Story = {
  name: "REQ-DS-014 Vazio só texto",
  args: {
    title: "Nenhuma verificação na fila.",
    description: "Quando chegar uma, ela aparece aqui.",
    action: undefined,
  },
};
