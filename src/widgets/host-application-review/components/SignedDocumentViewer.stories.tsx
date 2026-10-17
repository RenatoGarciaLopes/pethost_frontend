import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { documentDrawings } from "@/features/host-applications";
import { SignedDocumentViewer } from "./SignedDocumentViewer";
// Somente PNG sintético da story; nenhuma imagem real de documento.
const image =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMZ8AAAAASUVORK5CYII=";
const meta = {
  title: "Admin/SignedDocumentViewer",
  component: SignedDocumentViewer,
  parameters: { design: { board: "Fluxo-Admin" } },
  args: {
    label: "Frente do documento",
    illustration: documentDrawings.front,
    load: async () => ({ url: image, expiresAt: Math.floor(Date.now() / 1000) + 300 }),
  },
} satisfies Meta<typeof SignedDocumentViewer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {};
export const Vencida: Story = { args: { load: async () => ({ url: image, expiresAt: 1 }) } };
