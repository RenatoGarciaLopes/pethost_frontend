import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getBookingDetail } from "@/features/bookings/index.server";
import { conversationQueries, type ConversationMessage, type ConversationSide } from "@/features/conversations";
import { MyConversations } from "@/features/conversations/index.client";
import { getConversation, prefetchMessages, prefetchMyConversations } from "@/features/conversations/index.server";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { stayBookingIdOf, toConversationStay, type ConversationStay } from "../../../lib/stayContext";
import { ConversationRoom } from "../../client/ConversationRoom";
import { ConversationsLayout } from "../ConversationsLayout";

export interface ConversationsScreenProps {
  /** Conta da sessão (já confirmada pela API na página). */
  accountId: string;
  /** De que lado está quem vê (o papel da sessão). */
  viewer: ConversationSide;
  /** Conversa aberta; sem ela, só a lista (no computador, com o pedido para escolher uma). */
  conversationId?: string;
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
 * Conversas no servidor (spec 055): antecipa a lista, a conversa aberta, as mensagens mais recentes e a estadia, e
 * entrega o cache hidratado. Conversa de outra pessoa ou inexistente vira o 404 da casca.
 *
 * Use nas páginas `/conversations` e `/conversations/[conversationId]`, depois de confirmar a sessão.
 *
 * @example <ConversationsScreen accountId={user.id} viewer={user.role} conversationId={id} />
 */
export async function ConversationsScreen({ accountId, viewer, conversationId }: ConversationsScreenProps) {
  const queryClient = getQueryClient();
  let stay: ConversationStay | null = null;
  if (conversationId) {
    queryClient.setQueryData(
      conversationQueries.detail(accountId, conversationId).queryKey,
      await getConversation(accountId, conversationId),
    );
    stay = await loadStay(accountId, await prefetchMessages(queryClient, accountId, conversationId));
  }
  await prefetchMyConversations(queryClient, accountId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ConversationsLayout
        focus={conversationId ? "panel" : "list"}
        list={<MyConversations accountId={accountId} viewer={viewer} selectedId={conversationId} />}
        panel={
          conversationId ? (
            <ConversationRoom accountId={accountId} viewer={viewer} conversationId={conversationId} stay={stay} />
          ) : undefined
        }
      />
    </HydrationBoundary>
  );
}
