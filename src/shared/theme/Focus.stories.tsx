import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button, Chip, Link, Stack, TextField } from "@mui/material";
import { expect, userEvent } from "storybook/test";

const meta = {
  title: "Quintal/Theme/Focus",
  tags: ["autodocs"],
  render: () => (
    <Stack spacing={3} sx={{ p: 4, alignItems: "flex-start" }}>
      <Button>Continuar</Button>
      <Chip label="Com quintal" onClick={() => undefined} />
      <Link href="#focus-end">Ver cantinho</Link>
      <TextField label="Nome do pet" />
      <span id="focus-end">Fim dos controles</span>
    </Stack>
  ),
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Regressão 072: os quatro controles mantêm foco em tinta ao navegar por Tab. */
export const Keyboard: Story = {
  play: async ({ canvas }) => {
    const controls = [
      canvas.getByRole("button", { name: "Continuar" }),
      canvas.getByRole("button", { name: "Com quintal" }),
      canvas.getByRole("link", { name: "Ver cantinho" }),
      canvas.getByRole("textbox", { name: "Nome do pet" }),
    ];
    controls[0].focus();
    for (let index = 0; index < controls.length; index += 1) {
      if (index > 0) await userEvent.tab();
      await expect(controls[index]).toHaveFocus();
      await expect(controls[index]).toHaveStyle({ outlineColor: "rgb(31, 26, 23)" });
    }
  },
};
