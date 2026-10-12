import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { useState } from "react";
import { ChipPicker } from "./ChipPicker";

const meta = {
  title: "Quintal/Forms/ChipPicker",
  component: ChipPicker,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Pet" } },
  args: { label: "Atalhos", options: ["Fogos", "Trovão", "Come duas vezes ao dia"], selected: [], onPick: fn() },
  render: function Render(args) {
    const [selected, setSelected] = useState(args.selected ?? []);
    return (
      <ChipPicker
        {...args}
        selected={selected}
        onPick={(text) => {
          setSelected([...selected, text]);
          args.onPick(text);
        }}
      />
    );
  },
} satisfies Meta<typeof ChipPicker>;
export default meta;
type Story = StoryObj<typeof meta>;
/** Board state: Default. */
export const Default: Story = {
  name: "REQ-DS-018 Default",
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Fogos/ }));
    await expect(canvas.getByRole("button", { name: /Fogos/ })).toHaveAttribute("aria-pressed", "true");
  },
};
/** Board state: Selected. */
export const Selected: Story = { name: "REQ-DS-018 Selected", args: { selected: ["Fogos"] } };
/** Board state: Disabled. */
export const Disabled: Story = { name: "REQ-DS-018 Disabled", args: { disabled: true } };
