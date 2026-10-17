import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DateRangeField } from "./DateRangeField";

const meta = {
  title: "Shared/DateRangeField",
  component: DateRangeField,
  parameters: { design: { board: "Busca-Mapa" } },
  args: { checkIn: "2026-10-15", checkOut: "2026-10-20", today: "2026-10-15", onChange: () => {} },
} satisfies Meta<typeof DateRangeField>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {};
export const Erro: Story = { args: { errors: { checkOut: "Escolhe uma estadia de até 30 noites." } } };
