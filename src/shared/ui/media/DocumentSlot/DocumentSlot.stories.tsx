import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { DocumentSlot } from "./DocumentSlot";

/** Desenho simples de documento, só para a story (a feature traz os desenhos de verdade). */
const card = (
  <svg viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth="3">
    <rect x="4" y="4" width="112" height="72" rx="10" />
    <circle cx="34" cy="36" r="12" />
    <path d="M60 28h40M60 42h30M20 62h80" strokeLinecap="round" />
  </svg>
);

/** Foto escolhida, em memória (sem rede): um quadrado de cor. */
const chosen = new File(
  [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><rect width="120" height="80" fill="#8EC5E8"/></svg>`],
  "frente.svg",
  { type: "image/svg+xml" },
);

const meta = {
  title: "Quintal/Media/DocumentSlot",
  component: DocumentSlot,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Verificacao" } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    label: "Foto da frente do documento",
    hint: "O documento inteiro, com a foto aparecendo.",
    illustration: card,
    camera: "environment",
    file: null,
    onPick: fn(),
  },
} satisfies Meta<typeof DocumentSlot>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Vaga vazia: o desenho do que se espera e "Tirar foto". */
export const Vazia: Story = { name: "REQ-HVER-006 Vazia" };

/** Foto escolhida: miniatura e "Tirar de novo". */
export const Escolhida: Story = { name: "REQ-HVER-006 Foto escolhida", args: { file: chosen } };

/** Já enviada antes (a imagem não volta da API). */
export const Enviada: Story = { name: "REQ-HVER-010 Enviada", args: { uploaded: true } };

/** Erro na própria vaga. */
export const ComErro: Story = {
  name: "REQ-HVER-008 Erro na vaga",
  args: { error: "Essa foto não deu certo. Tira outra, de dia e sem flash." },
};

/** Preparando a foto (reduzindo antes de enviar). */
export const Preparando: Story = { name: "REQ-HVER-007 Preparando", args: { busy: true } };

/** Selfie: abre a câmera da frente. */
export const Selfie: Story = {
  name: "REQ-HVER-006 Selfie",
  args: { label: "Selfie segurando o documento", hint: "Seu rosto e o documento na mão.", camera: "user" },
};

/** Celular (390 px). */
export const Celular: Story = {
  name: "REQ-HVER-006 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};
