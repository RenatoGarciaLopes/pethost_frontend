"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { markConversationRead, sendMessage, sendPhotoMessage } from "../api/client/conversations.client";
import { toMessage } from "../api/mappers";
import { conversationQueries } from "../api/queries";
import type { ComposedMessage, ConversationMessage, MessagePage } from "../types";

/** Põe a mensagem gravada no topo da primeira página (a mais recente), sem repetir se a consulta já trouxe. */
function withNewMessage<TPageParam>(
  data: InfiniteData<MessagePage, TPageParam> | undefined,
  message: ConversationMessage,
) {
  if (!data) return data;
  const [first, ...rest] = data.pages;
  if (!first) return data;
  const items = [message, ...first.items.filter((item) => item.id !== message.id)];
  return { ...data, pages: [{ ...first, items }, ...rest] };
}

/**
 * Envia texto ou foto com legenda (REQ-CHAT-008 e 009). A mensagem gravada entra na hora na conversa aberta e a
 * lista e o contador são atualizados. Sem nova tentativa automática: a mensagem não sai duas vezes.
 *
 * @example useSendMessage(user.id, conversation.id).mutateAsync({ body: "Oi!", photo: null })
 */
export function useSendMessage(accountId: string, conversationId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ body, photo }: ComposedMessage) =>
      photo ? sendPhotoMessage(conversationId, photo, body) : sendMessage(conversationId, body),
    retry: false,
    onSuccess: async (dto) => {
      client.setQueryData(conversationQueries.messages(accountId, conversationId).queryKey, (data) =>
        withNewMessage(data, toMessage(dto)),
      );
      await client.invalidateQueries({ queryKey: conversationQueries.summaries(accountId) });
    },
  });
}

/**
 * Marca como lidas as mensagens recebidas ao abrir a conversa ou quando chega mensagem nova do outro lado. Grava o
 * contador novo e zera as não lidas dessa conversa na lista.
 *
 * @example useMarkConversationRead(user.id, conversation.id).mutate()
 */
export function useMarkConversationRead(accountId: string, conversationId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => markConversationRead(conversationId),
    onSuccess: async (total) => {
      client.setQueryData(conversationQueries.unreadCount(accountId).queryKey, total);
      client.setQueryData(conversationQueries.detail(accountId, conversationId).queryKey, (current) =>
        current ? { ...current, unreadCount: 0 } : current,
      );
      await client.invalidateQueries({ queryKey: conversationQueries.mine(accountId).queryKey });
    },
  });
}
