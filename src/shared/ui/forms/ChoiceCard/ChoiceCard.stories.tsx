import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ChoiceCard } from "./ChoiceCard";

const meta = {
  title: "Quintal/Forms/ChoiceCard",
  component: ChoiceCard,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Pet" } },
  args: { label: "Casa", value: "house", description: "Com quintal", checked: false, icon: <span>⌂</span> },
} satisfies Meta<typeof ChoiceCard>;
export default meta;
type Story = StoryObj<typeof meta>;
/** Board state: Default. */
export const Default: Story = { name: "REQ-DS-018 Default" };
/** Board state: Selected. */
export const Selected: Story = { name: "REQ-DS-018 Selected", args: { checked: true } };
/** Board state: Disabled. */
export const Disabled: Story = { name: "REQ-DS-018 Disabled", args: { disabled: true } };
