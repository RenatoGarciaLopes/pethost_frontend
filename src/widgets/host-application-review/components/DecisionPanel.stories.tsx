import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DecisionPanel } from "./DecisionPanel";
const meta = {
  title: "Admin/DecisionPanel",
  component: DecisionPanel,
  parameters: { design: { board: "Fluxo-Admin" } },
  args: { personType: "pf", busy: false, onDecide: () => {} },
} satisfies Meta<typeof DecisionPanel>;
export { meta as default };
type Story = StoryObj<typeof meta>;
export const PessoaFisica: Story = {};
export const Empresa: Story = { args: { personType: "pj" } };
export const Salvando: Story = { args: { busy: true } };
export const ErroNoMotivo: Story = { args: { fieldErrors: { reason: ["Escreva o motivo da decisão."] } } };
