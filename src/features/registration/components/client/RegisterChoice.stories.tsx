import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { RegisterChoice } from "./RegisterChoice";
const meta = {
  title: "Registration/RegisterChoice",
  component: RegisterChoice,
  args: { role: "owner", onChoose: fn() },
  parameters: { design: { board: "Fluxo-Conta" } },
} satisfies Meta<typeof RegisterChoice>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Tutor: Story = {};
export const Anfitriao: Story = { args: { role: "host" } };
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
