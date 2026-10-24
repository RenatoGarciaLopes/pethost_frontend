import type { Conversation, ConversationMessage, ConversationParty, MessagePage } from "../types";
import type { ConversationDto, MessageDto, MessagePageDto } from "./contracts";

const party = (value: { id: string; name: string; avatarUrl?: string | null } | null | undefined) =>
  value ? ({ id: value.id, name: value.name, avatarUrl: value.avatarUrl ?? null } satisfies ConversationParty) : null;

/**
 * A mensagem da API para as telas: campos omitidos viram `null`.
 * @example const message = toMessage(messageDtoSchema.parse(data));
 */
export function toMessage(dto: MessageDto): ConversationMessage {
  return {
    id: dto.id,
    conversationId: dto.conversationId,
    sentBy: dto.sentBy,
    body: dto.body ?? null,
    imageUrl: dto.imageUrl ?? null,
    bookingId: dto.bookingId ?? null,
    createdAt: dto.createdAt,
  };
}

/**
 * A conversa da API para as telas: as pessoas só com nome e foto, a última mensagem já convertida.
 * @example const conversation = toConversation(conversationDtoSchema.parse(data));
 */
export function toConversation(dto: ConversationDto): Conversation {
  return {
    id: dto.id,
    owner: party(dto.owner),
    host: party(dto.host),
    lastMessage: dto.lastMessage ? toMessage(dto.lastMessage) : null,
    unreadCount: dto.unreadCount,
    blocked: dto.blocked,
    blockedByMe: dto.blockedByMe,
    blockedByModeration: dto.blockedByModeration,
    lastMessageAt: dto.lastMessageAt ?? null,
    createdAt: dto.createdAt,
  };
}

/**
 * Uma página de mensagens, na ordem da API (da mais nova para a mais antiga).
 * @example const page = toMessagePage(messagePageSchema.parse(data));
 */
export function toMessagePage(dto: MessagePageDto): MessagePage {
  return { items: dto.items.map(toMessage), hasMore: dto.hasMore };
}
