import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { FormActions } from "./FormActions";

const meta = {
  title: "Quintal/Forms/FormActions",
  component: FormActions,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Pet" } },
  args: { backLabel: "Voltar", nextLabel: "Continuar: saúde", onBack: fn(), onNext: fn() },
} satisfies Meta<typeof FormActions>;
export default meta;
type Story = StoryObj<typeof meta>;
/** Board state: Default. */
export const Default: Story = { name: "REQ-DS-018 Default" };
/** Board state: Blocked. */
export const Blocked: Story = { name: "REQ-DS-018 Blocked", args: { disabledReason: "Falta preencher o nome" } };
/** Board state: Mobile. */
export const Mobile: Story = {
  name: "REQ-DS-018 Mobile",
  globals: { viewport: { value: "celular", isRotated: false } },
};
