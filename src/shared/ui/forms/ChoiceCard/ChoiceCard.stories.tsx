import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ChoiceCard } from "./ChoiceCard";

const meta = {
  title: "Quintal/Forms/ChoiceCard",
  component: ChoiceCard,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Pet" } },
  args: { label: "Casa", value: "house", description: "Com quintal", checked: false, icon: <span>⌂</span> },
} satisfies Meta<typeof ChoiceCard>;
export default meta;
type Story = StoryObj<typeof meta>;
/** Board state: Default. */
export const Default: Story = { name: "REQ-DS-018 Default" };
/** Board state: Selected. */
export const Selected: Story = { name: "REQ-DS-018 Selected", args: { checked: true } };
/** Board state: Disabled. */
export const Disabled: Story = { name: "REQ-DS-018 Disabled", args: { disabled: true } };
/** Ícone grande em cima, centralizado (tipo de casa no cantinho). */
export const Coluna: Story = {
  name: "REQ-DS-018 Coluna",
  args: { orientation: "column", checked: true, description: "Térrea ou sobrado" },
};
/** Cartão compacto de escolha múltipla (espécies). */
export const CompactoCheckbox: Story = {
  name: "REQ-DS-018 Compacto checkbox",
  args: {
    control: "checkbox",
    density: "compact",
    label: "Porquinho-da-índia",
    icon: undefined,
    description: undefined,
  },
};
