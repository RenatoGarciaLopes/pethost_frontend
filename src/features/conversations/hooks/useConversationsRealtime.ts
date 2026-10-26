"use client";

import { useEffect } from "react";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscribeConversationRealtime } from "../api/client/conversationRealtime";
import { conversationQueries } from "../api/queries";
import { LIST_POLL_MS, THREAD_POLL_MS } from "../lib/constants";

/** Montado no cabeçalho autenticado, inclusive fora da tela de chat; nenhum efeito para visitantes/admin. */
export function useConversationsRealtime(accountId: string | undefined) {
  const client = useQueryClient();
  useEffect(() => (accountId ? subscribeConversationRealtime(client, accountId) : undefined), [client, accountId]);
}

/** Intervalos reativos: os observers param o polling apenas após o handshake real do hub. */
export function useConversationPolling(accountId: string) {
  const { data } = useQuery({
    queryKey: conversationQueries.realtime(accountId),
    queryFn: skipToken,
    initialData: false,
  });
  return { list: data ? (false as const) : LIST_POLL_MS, thread: data ? (false as const) : THREAD_POLL_MS };
}
