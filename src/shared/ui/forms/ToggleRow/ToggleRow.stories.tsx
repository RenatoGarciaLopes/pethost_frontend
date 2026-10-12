import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, waitFor } from "storybook/test";
import { useState } from "react";
import { TextField } from "@mui/material";
import { ToggleRow } from "./ToggleRow";

const meta = {
  title: "Quintal/Forms/ToggleRow",
  component: ToggleRow,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Pet" } },
  args: { label: "Tem observação?", checked: false, onChange: fn(), children: <TextField label="Observação" /> },
  render: function Render(args) {
    const [checked, setChecked] = useState(args.checked);
    return (
      <ToggleRow
        {...args}
        checked={checked}
        onChange={(next) => {
          setChecked(next);
          args.onChange(next);
        }}
      />
    );
  },
} satisfies Meta<typeof ToggleRow>;
export default meta;
type Story = StoryObj<typeof meta>;
/** Board state: Default. */
export const Default: Story = {
  name: "REQ-DS-018 Default",
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("switch", { name: "Tem observação?" }));
    await waitFor(() => expect(canvas.getByRole("textbox", { name: "Observação" })).toBeVisible());
  },
};
/** Board state: Expanded. */
export const Expanded: Story = { name: "REQ-DS-018 Expanded", args: { checked: true } };
/** Board state: Disabled. */
export const Disabled: Story = { name: "REQ-DS-018 Disabled", args: { disabled: true } };
/** Board state: ReducedMotion. */
export const ReducedMotion: Story = {
  name: "REQ-DS-018 ReducedMotion",
  parameters: { reducedMotion: true },
  args: { checked: true },
};

/** Keyboard focus must remain visible around the switch, whose native input is transparent. */
export const KeyboardFocus: Story = {
  name: "REQ-DS-006 foco visível do switch",
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("switch", { name: "Tem observação?" });
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    const label = toggle.closest("label")!;
    const hasVisibleRing = Array.from(label.querySelectorAll("*")).some((element) => {
      const styles = getComputedStyle(element);
      return styles.outlineWidth === "3px" && styles.outlineColor === "rgb(47, 90, 134)" && styles.opacity !== "0";
    });
    await expect(hasVisibleRing).toBe(true);
  },
};
