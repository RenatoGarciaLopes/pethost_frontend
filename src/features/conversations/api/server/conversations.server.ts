import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { cache } from "react";
import { isApiError } from "@/shared/api/errors/ApiError";
import { createQueryClient } from "@/shared/api/query/queryClient";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import type { Conversation, ConversationMessage } from "../../types";
import { conversationQueries } from "../queries";

/**
 * Uma conversa da conta, uma busca por requisição (`cache()`). De outra pessoa ou inexistente vira o 404 da casca, sem
 * dizer se o id existe (a API responde `CONVERSATION_NOT_FOUND` nos dois casos).
 *
 * @example const conversation = await getConversation(user.id, conversationId);
 */
export const getConversation = cache(async (accountId: string, conversationId: string): Promise<Conversation> => {
  try {
    return await createQueryClient().fetchQuery(
      conversationQueries.detail(accountId, conversationId, await backendForRequest()),
    );
  } catch (error) {
    if (isApiError(error) && (error.code === "CONVERSATION_NOT_FOUND" || error.status === 404)) notFound();
    throw error;
  }
});

/**
 * Antecipa no servidor a lista de conversas. Falha não derruba a página: a lista mostra o erro e tenta de novo.
 * @example await prefetchMyConversations(queryClient, user.id);
 */
export async function prefetchMyConversations(queryClient: QueryClient, accountId: string): Promise<void> {
  await queryClient.prefetchQuery(conversationQueries.mine(accountId, await backendForRequest()));
}

/**
 * Antecipa no servidor as mensagens mais recentes e devolve as que vieram (para achar a estadia da conversa).
 * @example const recent = await prefetchMessages(queryClient, user.id, conversationId);
 */
export async function prefetchMessages(
  queryClient: QueryClient,
  accountId: string,
  conversationId: string,
): Promise<ConversationMessage[]> {
  const options = conversationQueries.messages(accountId, conversationId, await backendForRequest());
  await queryClient.prefetchInfiniteQuery(options);
  return queryClient.getQueryData(options.queryKey)?.pages[0]?.items ?? [];
}
