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

/** Foto de exemplo em memória (sem rede): um quadrado de cor. */
const savedPhoto = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="${color}"/></svg>`,
  )}`;

/** Fotos já salvas na ficha, com a troca oferecida em cada vaga preenchida. */
export const FotosSalvas: Story = {
  name: "REQ-PEDIT-008 Fotos salvas",
  args: { label: "Fotos de Thor", files: [savedPhoto("#F2C14E"), savedPhoto("#7FB77E"), null], onReplace: fn() },
};

/** Trocando a capa: indicador na vaga e as outras ações travadas. */
export const Trocando: Story = {
  name: "REQ-PEDIT-008 Trocando",
  args: {
    label: "Fotos de Thor",
    files: [savedPhoto("#F2C14E"), savedPhoto("#7FB77E"), null],
    uploadingIndex: 0,
    onReplace: fn(),
  },
};
