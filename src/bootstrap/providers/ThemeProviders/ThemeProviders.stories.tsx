import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeProviders } from "./ThemeProviders";
import { Button } from "@mui/material";
const meta = {
  title: "Quintal/ThemeProviders",
  component: ThemeProviders,
  parameters: { design: { board: "Fluxo-Conta" } },
  args: { children: <Button variant="contained">Continuar</Button> },
} satisfies Meta<typeof ThemeProviders>;
export default meta;
export const Default: StoryObj<typeof meta> = { name: "REQ-DS-001 tema aplicado" };
