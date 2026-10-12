import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { useState } from "react";
import { MaskedTextField } from "./MaskedTextField";

const meta = {
  title: "Quintal/Forms/MaskedTextField",
  component: MaskedTextField,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Conta" } },
  args: { label: "CPF", mask: "cpf", value: "12345678901", onValueChange: fn() },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <MaskedTextField
        {...args}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          args.onValueChange(next);
        }}
      />
    );
  },
} satisfies Meta<typeof MaskedTextField>;
export default meta;
type Story = StoryObj<typeof meta>;
/** Board state: Default. */
export const Default: Story = { name: "REQ-DS-018 Default" };
/** Board state: Empty. */
export const Empty: Story = { name: "REQ-DS-018 Empty", args: { value: "" } };
/** Board state: Cep. */
export const Cep: Story = { name: "REQ-DS-018 Cep", args: { label: "CEP", mask: "cep", value: "12345678" } };
/** Board state: Phone. */
export const Phone: Story = {
  name: "REQ-DS-018 Phone",
  args: { label: "Telefone", mask: "phone", value: "11987654321" },
};
/** Board state: Error. */
export const Error: Story = {
  name: "REQ-DS-018 Error",
  args: { error: true, helperText: "Confira o número informado" },
};
/** Board state: Disabled. */
export const Disabled: Story = { name: "REQ-DS-018 Disabled", args: { disabled: true } };
