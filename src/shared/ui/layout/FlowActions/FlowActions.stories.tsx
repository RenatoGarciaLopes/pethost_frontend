import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { FlowActions } from "./FlowActions";

const meta = {
  title: "Quintal/Layout/FlowActions",
  component: FlowActions,
  tags: ["autodocs"],
  parameters: { a11y: { test: "error" } },
  args: { onBack: fn(), onContinue: fn() },
} satisfies Meta<typeof FlowActions>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Navegacao: Story = {};
export const PrimeiroPasso: Story = { args: { onBack: undefined } };
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
