import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { useState } from "react";
import { Counter } from "./Counter";

const meta = {
  title: "Quintal/Forms/Counter",
  component: Counter,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Pet" } },
  args: { label: "Capacidade", min: 1, max: 5, value: 2, onChange: fn() },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <Counter
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
        }}
      />
    );
  },
} satisfies Meta<typeof Counter>;
export default meta;
type Story = StoryObj<typeof meta>;
/** Board state: Default. */
export const Default: Story = {
  name: "REQ-DS-018 Default",
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Aumentar Capacidade" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("3");
  },
};
/** Board state: Minimum. */
export const Minimum: Story = { name: "REQ-DS-018 Minimum", args: { value: 1 } };
/** Board state: Maximum. */
export const Maximum: Story = { name: "REQ-DS-018 Maximum", args: { value: 5 } };
/** Board state: Disabled. */
export const Disabled: Story = { name: "REQ-DS-018 Disabled", args: { disabled: true } };
