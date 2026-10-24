import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { previewConversation, previewMessages, usePreviewMessages } from "@/test/conversationsPreview";
import { CONVERSATIONS_NOW, previewStay } from "@/test/fixtures/conversations";
import { ConversationPanel } from "./ConversationPanel";

interface FrameProps {
  /** Ajustes na conversa (bloqueio, sem foto…). */
  overrides: Record<string, unknown>;
  /** Mostra a estadia em andamento. */
  withStay: boolean;
}

/** O painel com envio só na memória: escreva e envie para ver a mensagem entrar. Nenhuma story chama a API. */
function Frame({ overrides, withStay }: FrameProps) {
  const [messages, send] = usePreviewMessages(previewMessages(), "owner");
  return (
    <main style={{ height: "min(860px, 100dvh)" }}>
      <ConversationPanel
        conversation={previewConversation(overrides)}
        viewer="owner"
        messages={messages}
        stay={withStay ? previewStay : null}
        onSend={send}
        backHref="/conversations"
        now={CONVERSATIONS_NOW}
      />
    </main>
  );
}

const meta = {
  title: "Widgets/ConversationPanel/ConversationPanel",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Conversas" } },
  args: { overrides: {}, withStay: true },
} satisfies Meta<typeof Frame>;

// O formato CSF do Storybook exige o meta como export default.
export default meta;
type Story = StoryObj<typeof meta>;

export const EstadiaAcontecendo: Story = { name: "REQ-CHAT-011 Com a estadia acontecendo" };
export const SemEstadia: Story = { name: "Sem estadia (conversa antes de pedir)", args: { withStay: false } };
export const BloqueadaPorMim: Story = {
  name: "REQ-CHAT-010 Bloqueada por quem vê",
  args: { overrides: { blocked: true, blockedByMe: true } },
};
export const BloqueadaPelaModeracao: Story = {
  name: "REQ-CHAT-010 Bloqueada pela moderação",
  args: { overrides: { blocked: true, blockedByModeration: true } },
};
export const Celular: Story = {
  name: "REQ-CHAT-012 Celular",
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "celular", isRotated: false } },
};
