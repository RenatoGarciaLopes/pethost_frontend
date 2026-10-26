import { Box, Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DoorMark } from "./DoorMark";

const meta = {
  title: "Quintal/Brand/DoorMark",
  component: DoorMark,
  tags: ["autodocs"],
  parameters: { design: { board: "marca/04-logo" } },
  args: { title: "PetHost" },
} satisfies Meta<typeof DoorMark>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Símbolo do cabeçalho (40 × 44, traço 8). Passe o mouse: a folha abre e a luz acende. */
export const Cabecalho: Story = { name: "REQ-DS-015 Cabeçalho" };

/** Assinatura: símbolo + "pethost" em Caprasimo. */
export const Assinatura: Story = {
  name: "REQ-DS-015 Assinatura",
  args: { withWordmark: true, title: undefined },
};

/** A assinatura oficial em papel mantém o contraste sobre a camada funda de terra. */
export const AssinaturaNaTerra: Story = {
  args: { withWordmark: true, wordmarkColor: "quintal.papel", title: undefined, interactive: false },
  parameters: { a11y: { test: "error" } },
  decorators: [(Story) => <Box sx={{ bgcolor: "scene.soilDeep", p: 3 }}>{Story()}</Box>],
};

/** Logo grande (traço 6). */
export const Grande: Story = { name: "REQ-DS-015 Grande", args: { size: "large" } };

/** Dentro de um link: o foco do link abre a porta. */
export const NoLink: Story = {
  name: "REQ-DS-015 Dentro de link",
  render: () => (
    <Stack direction="row">
      <a href="#inicio" aria-label="PetHost, início" style={{ color: "inherit", textDecoration: "none" }}>
        <DoorMark withWordmark />
      </a>
    </Stack>
  ),
};
