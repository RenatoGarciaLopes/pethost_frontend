import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StatusPill } from "./StatusPill";

const meta = {
  title: "Quintal/Feedback/StatusPill",
  component: StatusPill,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Verificacao" } },
  args: { label: "Em análise", tone: "info" },
} satisfies Meta<typeof StatusPill>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Em análise: espera, em céu. */
export const EmAnalise: Story = { name: "REQ-DS-014 Em análise" };

/** Todos os tons, nos dois tamanhos. */
export const Tons: Story = {
  name: "REQ-DS-014 Todos os tons",
  render: () => (
    <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
      <Stack direction="row" spacing={1}>
        <StatusPill tone="ok" label="Aprovada" />
        <StatusPill tone="info" label="Esperando resposta" />
        <StatusPill tone="gema" label="Aceita · falta pagar" />
        <StatusPill tone="atencao" label="Falta um documento" />
        <StatusPill tone="erro" label="Recusada" />
        <StatusPill label="Pausada" />
      </Stack>
      <Stack direction="row" spacing={1}>
        <StatusPill size="sm" tone="ok" label="Ativa" />
        <StatusPill size="sm" tone="erro" label="Suspensa" />
      </Stack>
    </Stack>
  ),
};

/** Numa coluna o selo continua do tamanho do texto, sem virar faixa (REQ-UIC-007). */
export const EmColuna: Story = {
  name: "REQ-UIC-007 Do tamanho do texto numa coluna",
  render: () => (
    <Stack spacing={1} sx={{ width: 480 }}>
      <StatusPill tone="info" label="Em análise" />
      <StatusPill tone="ok" label="Confirmada" />
    </Stack>
  ),
};
