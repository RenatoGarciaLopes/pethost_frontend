import { z } from "zod";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import {
  GetApiV1ConversationsConversationIdMessagesResponse,
  GetApiV1ConversationsConversationIdResponse,
  GetApiV1ConversationsMeResponse,
  PostApiV1ConversationsConversationIdMessagesResponse,
  PostApiV1ConversationsConversationIdMessagesPhotoResponse,
  PutApiV1ConversationsConversationIdReadMarkerResponse,
} from "@/shared/api/generated/conversations/conversations.zod";

/** Quem enviou: a API só usa estes dois. Outro valor = `CONTRACT_MISMATCH`. */
const sentBySchema = z.enum(["owner", "host"]);

/**
 * Uma mensagem da API, com `sentBy` estreitado.
 * @example messageDtoSchema.parse(data)
 */
export const messageDtoSchema = unwrapData(
  GetApiV1ConversationsConversationIdMessagesResponse,
).shape.items.element.extend({ sentBy: sentBySchema });

/**
 * Uma conversa (`GET /conversations/{id}`), com a última mensagem estreitada.
 * @example conversationDtoSchema.parse(data)
 */
export const conversationDtoSchema = unwrapData(GetApiV1ConversationsConversationIdResponse).extend({
  lastMessage: messageDtoSchema.nullish(),
});

/**
 * Uma página de `GET /conversations/me`.
 * @example conversationPageSchema.parse(data)
 */
export const conversationPageSchema = unwrapData(GetApiV1ConversationsMeResponse).extend({
  items: z.array(conversationDtoSchema),
});

/**
 * Uma página de `GET /conversations/{id}/messages`, da mais nova para a mais antiga.
 * @example messagePageSchema.parse(data)
 */
export const messagePageSchema = unwrapData(GetApiV1ConversationsConversationIdMessagesResponse).extend({
  items: z.array(messageDtoSchema),
});

/** Resposta do envio de texto: a mensagem gravada. */
export const sentMessageSchema = unwrapData(PostApiV1ConversationsConversationIdMessagesResponse).extend({
  sentBy: sentBySchema,
});

/** Resposta do envio de foto: a mensagem gravada, com o endereço da foto. */
export const sentPhotoMessageSchema = unwrapData(PostApiV1ConversationsConversationIdMessagesPhotoResponse).extend({
  sentBy: sentBySchema,
});

/** Resposta de `PUT .../read-marker`: o contador novo da conta. */
export const readMarkerSchema = unwrapData(PutApiV1ConversationsConversationIdReadMarkerResponse);

export type MessageDto = z.output<typeof messageDtoSchema>;
export type ConversationDto = z.output<typeof conversationDtoSchema>;
export type ConversationPageDto = z.output<typeof conversationPageSchema>;
export type MessagePageDto = z.output<typeof messagePageSchema>;
