import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@mui/material";
import { PageHeader } from "./PageHeader";

const meta = {
  title: "Quintal/Layout/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  parameters: { a11y: { test: "error" } },
  args: { title: "Seu painel", subtitle: "Acompanhe as próximas etapas." },
} satisfies Meta<typeof PageHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Simples: Story = {};
export const ComAcao: Story = { args: { actions: <Button variant="contained">Ver pedidos</Button> } };
export const ComSobretitulo: Story = {
  args: {
    eyebrow: "Pedido de Camila · responda até amanhã às 16h50",
    title: "Pipoca quer passar 5 noites aqui.",
    subtitle: undefined,
  },
};
