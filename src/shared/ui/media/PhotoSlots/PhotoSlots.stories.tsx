import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { PhotoSlots } from "./PhotoSlots";

const meta = {
  title: "Quintal/Media/PhotoSlots",
  component: PhotoSlots,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Pet" } },
  args: { label: "Fotos de Pipoca", files: [null, null, null], onPick: fn(), onRemove: fn() },
} satisfies Meta<typeof PhotoSlots>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Três vagas livres; a primeira é a capa. */
export const Vazias: Story = { name: "REQ-PNEW-007 Vagas livres" };

/** Erro vindo de fora numa vaga (foto repetida). */
export const ComErro: Story = {
  name: "REQ-PNEW-007 Foto repetida",
  args: { errors: [null, "Essa foto já está na ficha.", null] },
};
