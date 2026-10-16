import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FlowProgress } from "./FlowProgress";

const meta = {
  title: "Quintal/Navigation/FlowProgress",
  component: FlowProgress,
  tags: ["autodocs"],
  parameters: { a11y: { test: "error" } },
  args: {
    steps: [
      { id: "account", label: "Conta", description: "Seus dados de acesso" },
      { id: "pet", label: "Corpo", description: "Conte sobre o pet" },
      { id: "photos", label: "Fotos", description: "Escolha as imagens" },
    ],
    current: "pet",
    completed: ["account"],
  },
} satisfies Meta<typeof FlowProgress>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Trilha: Story = {};
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
