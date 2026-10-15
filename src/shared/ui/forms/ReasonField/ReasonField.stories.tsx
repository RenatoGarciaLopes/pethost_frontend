import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { ReasonField } from "./ReasonField";
const meta = {
  title: "shared/ui/forms/ReasonField",
  component: ReasonField,
  parameters: { design: { board: "Fluxo-Admin" } },
  args: { label: "Motivo", value: "", onChange: () => {} },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <ReasonField {...args} value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof ReasonField>;
export { meta as default };
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {};
export const Erro: Story = { args: { error: "Escreva o motivo da decisão." } };
