import { useState } from "react";
import {
  conversationDtoSchema,
  messagePageSchema,
  toConversation,
  toMessagePage,
  type ComposedMessage,
  type ConversationMessage,
  type ConversationSide,
} from "@/features/conversations";
import {
  CONVERSATIONS_NOW,
  conversationDto,
  previewConversationDtos,
  previewMessageDtos,
} from "./fixtures/conversations";

/** As três conversas da prancha, já como as telas usam (passando pelo contrato e pelo mapper reais). */
export function previewConversations() {
  return previewConversationDtos().map((dto) => toConversation(conversationDtoSchema.parse(dto)));
}

/** A conversa da Dona Cida, com ajustes (bloqueio, sem foto…). */
export function previewConversation(overrides: Record<string, unknown> = {}) {
  return toConversation(conversationDtoSchema.parse(conversationDto(overrides)));
}

/** As mensagens da conversa da Dona Cida, na ordem da API (da mais nova para a mais antiga). */
export function previewMessages(): ConversationMessage[] {
  return toMessagePage(messagePageSchema.parse({ items: previewMessageDtos(), pageSize: 50, hasMore: false })).items;
}

/**
 * Envio só na memória, para ver a tela sem backend: a mensagem entra na hora, um minuto depois da anterior, com a foto
 * como endereço local. Usado pelas stories; a tela de verdade envia pela API.
 *
 * @example const [messages, send] = usePreviewMessages(previewMessages(), "owner");
 */
export function usePreviewMessages(initial: readonly ConversationMessage[], viewer: ConversationSide) {
  const [messages, setMessages] = useState<ConversationMessage[]>([...initial]);
  const send = ({ body, photo }: ComposedMessage) =>
    setMessages((current) => [
      {
        id: `preview-${current.length + 1}`,
        conversationId: current[0]?.conversationId ?? "preview",
        sentBy: viewer,
        body: body || null,
        imageUrl: photo ? URL.createObjectURL(photo) : null,
        bookingId: null,
        createdAt: new Date(CONVERSATIONS_NOW.getTime() + (current.length + 1) * 60_000).toISOString(),
      },
      ...current,
    ]);
  return [messages, send] as const;
}
