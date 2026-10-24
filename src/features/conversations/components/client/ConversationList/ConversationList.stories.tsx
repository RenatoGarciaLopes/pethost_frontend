import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { previewConversations } from "@/test/conversationsPreview";
import { CIDA_CONVERSATION_ID, CONVERSATIONS_NOW } from "@/test/fixtures/conversations";
import { ConversationList } from "./ConversationList";

const meta = {
  title: "Features/Conversations/ConversationList",
  component: ConversationList,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Conversas" } },
  args: {
    conversations: previewConversations(),
    viewer: "owner",
    selectedId: CIDA_CONVERSATION_ID,
    hrefOf: (id: string) => `/conversations/${id}`,
    now: CONVERSATIONS_NOW,
  },
  decorators: [(Story) => <main style={{ maxWidth: 380 }}>{Story()}</main>],
} satisfies Meta<typeof ConversationList>;

// O formato CSF do Storybook exige o meta como export default.
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "REQ-CHAT-001 Três conversas, a da Dona Cida aberta" };
export const Vazia: Story = { name: "REQ-CHAT-003 Nenhuma conversa", args: { conversations: [] } };
export const Celular: Story = {
  name: "REQ-CHAT-012 Celular",
  args: { selectedId: undefined },
  globals: { viewport: { value: "celular", isRotated: false } },
};
