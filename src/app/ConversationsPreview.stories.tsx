import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { usePathname, useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { fn } from "storybook/test";
import { ConversationList } from "@/features/conversations/index.client";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { AppHeader } from "@/widgets/app-shell";
import { ConversationsLayout } from "@/widgets/conversation-panel";
import { ConversationPanel } from "@/widgets/conversation-panel/index.client";
import { previewConversations, previewMessages, usePreviewMessages } from "@/test/conversationsPreview";
import { CIDA_CONVERSATION_ID, CONVERSATIONS_NOW, previewStay } from "@/test/fixtures/conversations";

const ACCOUNT = "story-conversations";

interface PreviewProps {
  /** O que o celular mostra: a lista (`/conversations`) ou a conversa aberta (`/conversations/{id}`). */
  focus: "list" | "panel";
}

/**
 * A tela de Conversas montada como a rota vai montar, sem login e sem backend: o cabeçalho real da casca, a lista e a
 * conversa da Dona Cida. O envio fica só na memória da story.
 */
function ConversationsPreview({ focus }: PreviewProps) {
  const [client] = useState(() => {
    const cache = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    cache.setQueryData(accountQueryKey(ACCOUNT, "linked-accounts"), []);
    return cache;
  });
  const [messages, send] = usePreviewMessages(previewMessages(), "owner");
  const conversations = previewConversations();
  const open = conversations.find((conversation) => conversation.id === CIDA_CONVERSATION_ID)!;
  return (
    <QueryClientProvider client={client}>
      <AppHeader user={{ id: ACCOUNT, fullName: "Camila Souza", role: "owner", avatarUrl: null }} />
      <main id="conteudo">
        <ConversationsLayout
          focus={focus}
          list={
            <ConversationList
              conversations={conversations}
              viewer="owner"
              selectedId={focus === "panel" ? open.id : undefined}
              hrefOf={(id) => `/conversations/${id}`}
              now={CONVERSATIONS_NOW}
            />
          }
          panel={
            <ConversationPanel
              conversation={open}
              viewer="owner"
              messages={messages}
              stay={previewStay}
              onSend={send}
              backHref="/conversations"
              now={CONVERSATIONS_NOW}
            />
          }
        />
      </main>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Conversas/Prévia sem backend",
  component: ConversationsPreview,
  parameters: { layout: "fullscreen", design: { board: "Fluxo-Conversas" } },
  globals: { viewport: { value: "desktop", isRotated: false } },
  args: { focus: "panel" },
  // O menu da conta usa o roteador do Next: na story, um roteador simulado que não sai da página.
  beforeEach: () => {
    useRouter.mockReturnValue({ ...getRouter(), refresh: fn(), bfcacheId: "story" });
    usePathname.mockReturnValue("/conversations");
  },
} satisfies Meta<typeof ConversationsPreview>;

// O formato CSF do Storybook exige o meta como export default.
export default meta;
type Story = StoryObj<typeof meta>;

export const Computador: Story = { name: "Computador" };
export const CelularConversa: Story = {
  name: "Celular: conversa aberta",
  globals: { viewport: { value: "celular", isRotated: false } },
};
export const CelularLista: Story = {
  name: "Celular: lista",
  args: { focus: "list" },
  globals: { viewport: { value: "celular", isRotated: false } },
};
