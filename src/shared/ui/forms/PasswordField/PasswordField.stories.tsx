import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { PasswordField } from "./PasswordField";

const meta = {
  title: "Quintal/Forms/PasswordField",
  component: PasswordField,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Conta" } },
  args: { label: "Senha", defaultValue: "Abcdef1!", autoComplete: "new-password" },
} satisfies Meta<typeof PasswordField>;
export default meta;
type Story = StoryObj<typeof meta>;
/** Board state: Default. */
export const Default: Story = {
  name: "REQ-DS-018 Default",

  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Mostrar" }));
    await expect(canvas.getByLabelText("Senha")).toHaveAttribute("type", "text");
  },
};
/** Board state: Empty. */
export const Empty: Story = { name: "REQ-DS-018 Empty", args: { defaultValue: "" } };
/** Board state: Error. */
export const Error: Story = {
  name: "REQ-DS-018 Error",
  args: { error: true, helperText: "Escolha uma senha com os requisitos abaixo" },
};
/** Board state: Disabled. */
export const Disabled: Story = { name: "REQ-DS-018 Disabled", args: { disabled: true } };
