import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { useState } from "react";
import { ChoiceCardGroup } from "./ChoiceCardGroup";

const meta = {
  title: "Quintal/Forms/ChoiceCardGroup",
  component: ChoiceCardGroup,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Pet" } },
  args: {
    label: "Espécie",
    options: [
      { value: "dog", label: "Cachorro", icon: <span>♧</span> },
      { value: "cat", label: "Gato", description: "Atenção: tem gato em casa" },
    ],
    value: "dog",
    onChange: fn(),
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <ChoiceCardGroup
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
        }}
      />
    );
  },
} satisfies Meta<typeof ChoiceCardGroup>;
export default meta;
type Story = StoryObj<typeof meta>;
/** Board state: Default. */
export const Default: Story = {
  name: "REQ-DS-018 Default",
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("radio", { name: /Gato/ }));
    await expect(canvas.getByRole("radio", { name: /Gato/ })).toBeChecked();
  },
};
/** Board state: Disabled. */
export const Disabled: Story = { name: "REQ-DS-018 Disabled", args: { disabled: true } };
/** Board state: Mobile. */
export const Mobile: Story = {
  name: "REQ-DS-018 Mobile",
  globals: { viewport: { value: "celular", isRotated: false } },
};
