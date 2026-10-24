/**
 * API pública neutra de conversations (spec 055, em rascunho).
 * Exporte aqui tipos, schemas e funções puras compartilháveis entre ambientes.
 * Não exporte hooks, componentes client ou recursos exclusivos do servidor.
 */
export { conversationDtoSchema, messageDtoSchema, messagePageSchema } from "./api/contracts";
export { toConversation, toMessage, toMessagePage } from "./api/mappers";
export { conversationQueries } from "./api/queries";
export type { TimelineEvent } from "./lib/buildTimeline";
export { blockedNotice, otherParty, otherPartyName } from "./lib/conversationParties";
export { CONVERSATIONS_PATH, conversationPath, isConversationId } from "./lib/conversationPaths";
export { conversationsCopy } from "./lib/conversationsCopy";
export type {
  ComposedMessage,
  Conversation,
  ConversationMessage,
  ConversationParty,
  ConversationSide,
  MessagePage,
} from "./types";
