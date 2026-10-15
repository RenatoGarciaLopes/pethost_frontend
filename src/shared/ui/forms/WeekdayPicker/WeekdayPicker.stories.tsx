import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { WeekdayPicker } from "./WeekdayPicker";

const meta = {
  title: "Quintal/Forms/WeekdayPicker",
  component: WeekdayPicker,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Cantinho" } },
  args: { label: "Dias que recebe", value: ["monday", "friday"], onChange: fn() },
} satisfies Meta<typeof WeekdayPicker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "REQ-LIST-010 Dias marcados" };
export const ComErro: Story = { name: "REQ-LIST-010 Erro", args: { value: [], error: "Escolhe ao menos um dia." } };
export const Celular: Story = {
  name: "REQ-LIST-010 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};
