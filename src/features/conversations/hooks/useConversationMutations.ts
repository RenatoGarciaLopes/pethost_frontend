"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markConversationRead, sendMessage, sendPhotoMessage } from "../api/client/conversations.client";
import { toMessage } from "../api/mappers";
import { conversationQueries } from "../api/queries";
import type { ComposedMessage } from "../types";
import { withNewMessage } from "../lib/withNewMessage";

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
