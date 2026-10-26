import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PawMark } from "./PawMark";

const meta = {
  title: "Quintal/Brand/PawMark",
  component: PawMark,
  tags: ["autodocs"],
  args: { size: 48 },
} satisfies Meta<typeof PawMark>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Decorativa: some para o leitor de tela. */
export const Padrao: Story = { name: "REQ-PETS-001 Patinha" };
