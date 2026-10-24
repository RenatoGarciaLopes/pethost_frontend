"use client";

import { Skeleton } from "@mui/material";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  CONVERSATIONS_PATH,
  conversationQueries,
  conversationsCopy,
  type ConversationSide,
} from "@/features/conversations";
import { useMarkConversationRead, useSendMessage } from "@/features/conversations/index.client";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import type { ConversationStay } from "../../../lib/stayContext";
import { ConversationPanel } from "../ConversationPanel";

export interface ConversationRoomProps {
  /** Conta da sessão: separa o cache de cada conta. */
  accountId: string;
  /** De que lado está quem vê (o papel da sessão). */
  viewer: ConversationSide;
  conversationId: string;
  /** A estadia da conversa, montada no servidor a partir da reserva; `null` sem estadia. */
  stay: ConversationStay | null;
}

/**
 * A conversa aberta ligada à API (spec 055): mensagens por cursor com "ver anteriores", atualização periódica (sem o
 * hub por enquanto), envio de texto e foto com o erro no lugar certo, e marca como lidas ao abrir e quando chega
 * mensagem nova do outro lado.
 *
 * Use em `/conversations/[conversationId]`, com o cache hidratado pelo servidor. Para ver sem API, use
 * `ConversationPanel` com dados prontos.
 *
 * @example <ConversationRoom accountId={user.id} viewer={user.role} conversationId={id} stay={stay} />
 */
export function ConversationRoom({ accountId, viewer, conversationId, stay }: ConversationRoomProps) {
  const detail = useQuery(conversationQueries.detail(accountId, conversationId));
  const messages = useInfiniteQuery(conversationQueries.messages(accountId, conversationId));
  const send = useSendMessage(accountId, conversationId);
  const { mutate: markRead } = useMarkConversationRead(accountId, conversationId);

  const items = messages.data?.pages.flatMap((page) => page.items) ?? [];
  // A primeira página vem da mais nova para a mais antiga: a primeira do outro lado é a última que chegou.
  const newestIncomingId = items.find((message) => message.sentBy !== viewer)?.id;

  useEffect(() => {
    if (newestIncomingId) markRead();
  }, [newestIncomingId, markRead]);

  if (detail.isPending || messages.isPending)
    return <Skeleton variant="rounded" height="100%" aria-label={conversationsCopy.loadingConversation} />;
  if (detail.isError || messages.isError)
    return (
      <ErrorState
        title={conversationsCopy.conversationLoadError}
        description={getErrorMessage(detail.error ?? messages.error)}
        onRetry={() => void Promise.all([detail.refetch(), messages.refetch()])}
      />
    );

  return (
    <ConversationPanel
      conversation={detail.data}
      viewer={viewer}
      messages={items}
      stay={stay}
      hasMore={messages.hasNextPage}
      isLoadingOlder={messages.isFetchingNextPage}
      onLoadOlder={() => void messages.fetchNextPage()}
      onSend={(message) => send.mutateAsync(message)}
      isSending={send.isPending}
      sendError={send.error ? getErrorMessage(send.error) : null}
      backHref={CONVERSATIONS_PATH}
    />
  );
}
