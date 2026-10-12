import { Button, Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Celebration } from "./Celebration";

const meta = {
  title: "Quintal/Brand/Celebration",
  component: Celebration,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Pet / Prazer Pipoca!" }, layout: "centered" },
  args: { children: <Typography variant="h1">Prazer, Pipoca!</Typography> },
} satisfies Meta<typeof Celebration>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Toca uma vez ao aparecer. */
export const Default: Story = { name: "REQ-DS-016 Prazer, Pipoca!" };

/** Repetir trocando o `playKey`. */
export const Repetir: Story = {
  name: "REQ-DS-016 Repetir",
  render: (args) => <RepetirDemo {...args} />,
};

function RepetirDemo(args: Story["args"]) {
  const [round, setRound] = useState(0);
  return (
    <Stack spacing={4} sx={{ alignItems: "center" }}>
      <Celebration {...args} playKey={round}>
        {args?.children}
      </Celebration>
      <Button variant="contained" onClick={() => setRound((value) => value + 1)}>
        Comemorar de novo
      </Button>
    </Stack>
  );
}
