import { Button, Paper, Stack, TextField, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Reveal } from "./Reveal";

const meta = {
  title: "Quintal/Motion/Reveal",
  component: Reveal,
  tags: ["autodocs"],
  args: { order: 0, children: <Typography variant="h2">Um bloco</Typography> },
} satisfies Meta<typeof Reveal>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Um bloco sozinho entrando com a mola "assentar". */
export const Default: Story = { name: "REQ-DS-008 Bloco" };

/** Tela se montando em ordem: título, cartão e campos, 60 ms entre cada um. Recarregue para rever. */
export const Sequencia: Story = {
  name: "REQ-DS-008 Sequência",
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 360 }}>
      <Reveal order={0}>
        <Typography variant="h1">Entra que a porta tá aberta.</Typography>
      </Reveal>
      <Reveal order={1}>
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Reveal order={2}>
              <TextField label="E-mail" fullWidth />
            </Reveal>
            <Reveal order={3}>
              <TextField label="Senha" fullWidth />
            </Reveal>
            <Reveal order={4}>
              <Button variant="contained" fullWidth>
                Entrar
              </Button>
            </Reveal>
          </Stack>
        </Paper>
      </Reveal>
    </Stack>
  ),
};
