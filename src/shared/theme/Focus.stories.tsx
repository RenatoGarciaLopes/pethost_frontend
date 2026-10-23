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

/**
 * Regressão 081: clique e digitação nunca desenham contorno. O Tab real é conferido no E2E
 * `e2e/mocked/home/keyboard-focus.spec.ts`: o userEvent da story é sintético e não ativa o :focus-visible do Chrome.
 */
export const Pointer: Story = {
  name: "REQ-FOC-081 Clique não mostra contorno",
  play: async ({ canvas }) => {
    const controls = [
      canvas.getByRole("button", { name: "Continuar" }),
      canvas.getByRole("button", { name: "Com quintal" }),
      canvas.getByRole("textbox", { name: "Nome do pet" }),
    ];
    for (const control of controls) {
      await userEvent.click(control);
      await expect(control).toHaveFocus();
      await expect(control).toHaveStyle({ outlineStyle: "none" });
    }
    await userEvent.keyboard("a");
    await expect(controls[2]).toHaveStyle({ outlineStyle: "none" });
  },
};
