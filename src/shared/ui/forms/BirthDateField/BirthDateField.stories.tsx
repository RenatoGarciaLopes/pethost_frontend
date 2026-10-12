import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { BirthDateField } from "./BirthDateField";

const meta = {
  title: "Quintal/Forms/BirthDateField",
  component: BirthDateField,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Conta / Criar conta 1/2" } },
  args: {
    label: "Quando você nasceu?",
    value: "",
    helperText: "O PetHost é pra quem tem 18 anos ou mais.",
    onValueChange: fn(),
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <BirthDateField
        {...args}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          args.onValueChange(next);
        }}
      />
    );
  },
} satisfies Meta<typeof BirthDateField>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Vazio, com o formato no placeholder e a ajuda de maioridade. */
export const Default: Story = { name: "REQ-OREG-016 Vazio" };

/** Preenchido: máscara dd/mm/aaaa. */
export const Preenchido: Story = { name: "REQ-OREG-016 Preenchido", args: { value: "03051990" } };

/** Erro do schema. */
export const ComErro: Story = {
  name: "REQ-OREG-003 Com erro",
  args: { value: "31042000", error: true, helperText: "Essa data não existe." },
};
