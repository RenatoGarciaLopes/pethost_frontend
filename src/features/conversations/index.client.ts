/**
 * API pública client de conversations (spec 055, em rascunho).
 * Reexporte aqui componentes client e hooks para ilhas interativas.
 * A diretiva use client pertence à implementação, não a este índice.
 * Não exporte recursos server-only.
 */
export { ConversationHeader } from "./components/client/ConversationHeader";
export type { ConversationHeaderProps } from "./components/client/ConversationHeader";
export { ConversationList } from "./components/client/ConversationList";
export type { ConversationListProps } from "./components/client/ConversationList";
export { MessageComposer } from "./components/client/MessageComposer";
export type { MessageComposerProps } from "./components/client/MessageComposer";
export { MyConversations } from "./components/client/MyConversations";
export type { MyConversationsProps } from "./components/client/MyConversations";
export { MessageThread } from "./components/client/MessageThread";
export type { MessageThreadProps } from "./components/client/MessageThread";
export { useMarkConversationRead, useSendMessage } from "./hooks/useConversationMutations";

export { openConversation } from "./api/client/conversations.client";

export { UnreadBadge } from "./components/client/UnreadBadge";
