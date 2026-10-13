import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PasswordStrengthChecklist } from "./PasswordStrengthChecklist";

const meta = {
  title: "Quintal/Forms/PasswordStrengthChecklist",
  component: PasswordStrengthChecklist,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Conta" } },
  args: {
    password: "",
  },
} satisfies Meta<typeof PasswordStrengthChecklist>;
export default meta;
type Story = StoryObj<typeof meta>;
/** Board state: Empty. */
export const Empty: Story = { name: "REQ-DS-018 Empty" };
/** Board state: Partial. */
export const Partial: Story = { name: "REQ-DS-018 Partial", args: { password: "abc" } };
/** Board state: Complete. */
export const Complete: Story = { name: "REQ-DS-018 Complete", args: { password: "Abcdef1!" } };
