import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { CpfField } from "./CpfField";

const meta = {
  title: "Quintal/Forms/CpfField",
  component: CpfField,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Conta / Criar conta 1/2" } },
  args: {
    label: "CPF",
    value: "",
    helperText: "Pra identificar quem paga. Não aparece pra ninguém.",
    onValueChange: fn(),
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <CpfField
        {...args}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          args.onValueChange(next);
        }}
      />
    );
  },
} satisfies Meta<typeof CpfField>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Vazio, com a ajuda de por que pedimos. */
export const Default: Story = { name: "REQ-OREG-006 Vazio" };

/** Preenchido: máscara aplicada. */
export const Preenchido: Story = { name: "REQ-OREG-016 Preenchido", args: { value: "52998224725" } };

/** Erro do schema. */
export const ComErro: Story = {
  name: "REQ-OREG-003 Com erro",
  args: { value: "52998224724", error: true, helperText: "Esse CPF não confere. Dá uma olhada nos números." },
};
