import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LockedField } from "./LockedField";

const meta = {
  title: "Quintal/Forms/LockedField",
  component: LockedField,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Verificacao" } },
  args: { label: "Documento", value: "123.456.789-01", reason: "Documento já confirmado" },
} satisfies Meta<typeof LockedField>;
export default meta;
type Story = StoryObj<typeof meta>;
/** Board state: Default. */
export const Default: Story = { name: "REQ-DS-018 Default" };
/** Board state: Empty. */
export const Empty: Story = { name: "REQ-DS-018 Empty", args: { value: "", reason: "Aguardando confirmação" } };
