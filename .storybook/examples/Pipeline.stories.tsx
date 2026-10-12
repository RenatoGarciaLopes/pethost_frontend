import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

/** Temporary inline pipeline probe with no props/state; remove in spec 002 T12. */
function PipelineButton() {
  return <button type="button">Validar pipeline</button>;
}

const meta = {
  title: "Tooling/Pipeline",
  component: PipelineButton,
  tags: ["autodocs"],
} satisfies Meta<typeof PipelineButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** REQ-TOOL-011 verifies the accessible button through the browser story runner. */
export const AccessibleButton: Story = {
  name: "REQ-TOOL-011 botão acessível",
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Validar pipeline" })).toBeVisible();
  },
};
