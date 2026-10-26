import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getBookingDetail } from "@/features/bookings/index.server";
import { conversationQueries, type ConversationMessage, type ConversationSide } from "@/features/conversations";
import { getConversation, prefetchMessages, prefetchMyConversations } from "@/features/conversations/index.server";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { stayBookingIdOf, toConversationStay, type ConversationStay } from "../../../lib/stayContext";
import { ConversationRoom } from "../../client/ConversationRoom";
import { ConversationsShell } from "../../client/ConversationsShell";

export interface ConversationsScreenProps {
  /** Conta da sessão (já confirmada pela API na página). */
  accountId: string;
  /** De que lado está quem vê (o papel da sessão). */
  viewer: ConversationSide;
  /** Segmento de rota: conversa ou estado inicial, carregado independentemente. */
  children: ReactNode;
}

/**
 * A estadia da conversa, se as mensagens recentes falam de uma. A reserva que não abre (apagada, de outra conta) só
 * deixa a conversa sem contexto: a conversa continua.
 */
async function loadStay(accountId: string, recent: readonly ConversationMessage[]): Promise<ConversationStay | null> {
  const bookingId = stayBookingIdOf(recent);
  if (!bookingId) return null;
  const booking = await getBookingDetail(accountId, bookingId).catch(() => null);
  return booking ? toConversationStay(booking) : null;
}

/**
 * Casca persistente no servidor: antecipa apenas a lista e entrega o cache hidratado.
 *
 * Use no layout compartilhado de `/conversations`, depois de confirmar a sessão.
 *
 * @example <ConversationsScreen accountId={user.id} viewer={user.role}>{children}</ConversationsScreen>
 */
export async function ConversationsScreen({ accountId, viewer, children }: ConversationsScreenProps) {
  const queryClient = getQueryClient();
  await prefetchMyConversations(queryClient, accountId);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ConversationsShell accountId={accountId} viewer={viewer}>
        {children}
      </ConversationsShell>
    </HydrationBoundary>
  );
}

/** Dados da conversa carregam dentro do painel, independentemente da lista persistente. */
export async function ConversationContent({
  accountId,
  viewer,
  conversationId,
}: {
  accountId: string;
  viewer: ConversationSide;
  conversationId: string;
}) {
  const queryClient = getQueryClient();
  queryClient.setQueryData(
    conversationQueries.detail(accountId, conversationId).queryKey,
    await getConversation(accountId, conversationId),
  );
  const stay = await loadStay(accountId, await prefetchMessages(queryClient, accountId, conversationId));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ConversationRoom accountId={accountId} viewer={viewer} conversationId={conversationId} stay={stay} />
    </HydrationBoundary>
  );
}
