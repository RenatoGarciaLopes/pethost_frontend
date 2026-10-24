import { GetApiV1ConversationsConversationIdParams } from "@/shared/api/generated/conversations/conversations.zod";

/** A lista de conversas (spec 055). */
export const CONVERSATIONS_PATH = "/conversations";

/**
 * Endereço de uma conversa.
 * @example conversationPath(conversation.id) // "/conversations/0199…"
 */
export const conversationPath = (conversationId: string) =>
  `${CONVERSATIONS_PATH}/${encodeURIComponent(conversationId)}`;

/**
 * O segmento da URL é um id de conversa possível (UUID)? Id inválido vai direto para o 404, sem chamar a API.
 * @example isConversationId("conversa-1") // false
 */
export const isConversationId = (value: string): boolean =>
  GetApiV1ConversationsConversationIdParams.safeParse({ conversationId: value }).success;
