import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState, type ComponentProps } from "react";
import { expect, within } from "storybook/test";
import { DateRangeField } from "./DateRangeField";

function Controlled(args: ComponentProps<typeof DateRangeField>) {
  const [range, setRange] = useState({ checkIn: "", checkOut: "" });
  return <DateRangeField {...args} {...range} onChange={setRange} />;
}

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

/** Calendário do PetHost aberto pela chegada; a escolha da saída fecha. */
export const Aberto: Story = {
  name: "REQ-CAL-005 Calendário aberto",
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByLabelText("Chegada"));
    await expect(
      await within(document.body).findByRole("dialog", { name: "Escolher as datas da estadia" }),
    ).toBeInTheDocument();
  },
};
