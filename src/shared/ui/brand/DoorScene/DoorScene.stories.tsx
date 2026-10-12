import { Box, Button, Stack, TextField } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DoorScene } from "./DoorScene";
import { DOOR_TARGET_ATTR, DOOR_WARM_ATTR } from "./useDoorTarget";

const meta = {
  title: "Quintal/Brand/DoorScene",
  component: DoorScene,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Conta / Entrar" } },
  render: (args) => (
    <Box sx={{ width: 420 }}>
      <DoorScene {...args} />
    </Box>
  ),
} satisfies Meta<typeof DoorScene>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Pose do logo, luz respirando. Brinque: mouse na porta, clique na porta, no capacho e no gramado. */
export const Entreaberta: Story = { name: "REQ-DS-015 Entreaberta", args: { state: "closed" } };

/** Aberta: o formulário recebeu mouse ou foco. */
export const Aberta: Story = { name: "REQ-DS-015 Aberta", args: { state: "open" } };

/** Bem aberta e luz quente: mouse ou foco em "Entrar". */
export const BemAberta: Story = { name: "REQ-DS-015 Bem aberta", args: { state: "wide" } };

/** Largura de celular: a cena acompanha o contêiner. */
export const Celular: Story = {
  name: "REQ-DS-015 Celular",
  render: (args) => (
    <Box sx={{ width: 200 }}>
      <DoorScene {...args} />
    </Box>
  ),
};

/** Reage a um formulário de verdade: foque um campo ou passe o mouse em "Entrar". */
export const ComFormulario: Story = {
  name: "REQ-DS-015 Reage ao formulário",
  render: () => (
    <Stack direction="row" spacing={6} sx={{ alignItems: "center" }}>
      <Box sx={{ width: 380 }}>
        <DoorScene />
      </Box>
      <Stack component="form" spacing={2} sx={{ width: 320 }} {...{ [DOOR_TARGET_ATTR]: "" }}>
        <TextField label="E-mail" />
        <Button variant="contained" type="button" {...{ [DOOR_WARM_ATTR]: "" }}>
          Entrar
        </Button>
      </Stack>
    </Stack>
  ),
};
