import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { useState } from "react";
import { SegmentedControl } from "./SegmentedControl";

const meta = {
  title: "Quintal/Forms/SegmentedControl",
  component: SegmentedControl,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Pet" } },
  args: {
    label: "Convivência",
    options: [
      { value: "yes", label: "Sim" },
      { value: "no", label: "Não" },
      { value: "unknown", label: "Ainda não sei" },
    ],
    value: "yes",
    onChange: fn(),
    fullWidth: true,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <SegmentedControl
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
        }}
      />
    );
  },
} satisfies Meta<typeof SegmentedControl>;
export default meta;
type Story = StoryObj<typeof meta>;
/** Board state: Default. */
export const Default: Story = {
  name: "REQ-DS-018 Default",
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("radio", { name: "Não" }));
    await expect(canvas.getByRole("radio", { name: "Não" })).toBeChecked();
  },
};
/** Board state: Disabled. */
export const Disabled: Story = { name: "REQ-DS-018 Disabled", args: { disabled: true } };
/** Board state: Mobile. */
export const Mobile: Story = {
  name: "REQ-DS-018 Mobile",
  globals: { viewport: { value: "celular", isRotated: false } },
};
