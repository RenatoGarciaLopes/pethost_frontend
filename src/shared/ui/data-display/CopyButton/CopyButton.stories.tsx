import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { CopyButton } from "./CopyButton";

const meta = {
  title: "Shared/DataDisplay/CopyButton",
  component: CopyButton,
  tags: ["autodocs"],
  args: { value: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01", label: "Identificador da requisição" },
} satisfies Meta<typeof CopyButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", { name: "Copiar Identificador da requisição" }),
    ).toBeVisible();
  },
};

export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
