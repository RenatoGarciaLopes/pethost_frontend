import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { previewMessages } from "@/test/conversationsPreview";
import { CONVERSATIONS_NOW } from "@/test/fixtures/conversations";
import { MessageThread } from "./MessageThread";

const meta = {
  title: "Features/Conversations/MessageThread",
  component: MessageThread,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Conversas" } },
  args: {
    messages: previewMessages(),
    viewer: "owner",
    otherName: "Dona Cida",
    events: [{ id: "check-in", at: "2026-12-20T17:18:00Z", label: "Pipoca chegou na casa de Dona Cida" }],
    now: CONVERSATIONS_NOW,
  },
  // A área rola por dentro: o quadro tem altura fixa, como no painel.
  decorators: [(Story) => <main style={{ height: 640, display: "flex", flexDirection: "column" }}>{Story()}</main>],
} satisfies Meta<typeof MessageThread>;

// O formato CSF do Storybook exige o meta como export default.
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "REQ-CHAT-004 Ontem e hoje, com foto e a chegada" };
export const ComAnteriores: Story = { name: "REQ-CHAT-007 Com mensagens anteriores", args: { hasMore: true } };
export const BuscandoAnteriores: Story = {
  name: "REQ-CHAT-007 Buscando as anteriores",
  args: { hasMore: true, isLoadingOlder: true },
};
export const VistaPeloAnfitriao: Story = {
  name: "REQ-CHAT-005 Vista pelo anfitrião",
  args: { viewer: "host", otherName: "Camila" },
};
export const Celular: Story = {
  name: "REQ-CHAT-012 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};
