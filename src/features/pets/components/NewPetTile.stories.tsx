import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NewPetTile } from "./NewPetTile";

const meta = {
  title: "Pets/NewPetTile",
  component: NewPetTile,
  tags: ["autodocs"],
  parameters: { a11y: { test: "error" } },
} satisfies Meta<typeof NewPetTile>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Tutor: Story = { args: { role: "owner" } };
export const Anfitriao: Story = { args: { role: "host" } };
