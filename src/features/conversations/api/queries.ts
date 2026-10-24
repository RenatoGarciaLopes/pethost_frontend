import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { bffClient } from "@/shared/api/client/bffClient";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import { GetApiV1ConversationsMeUnreadCountResponse } from "@/shared/api/generated/conversations/conversations.zod";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { LIST_POLL_MS, LIST_PAGE_SIZE, MESSAGE_PAGE_SIZE, THREAD_POLL_MS } from "../lib/constants";
import { conversationDtoSchema, conversationPageSchema, messagePageSchema } from "./contracts";
import { toConversation, toMessagePage } from "./mappers";

type Transport = Pick<HttpTransport, "request">;

const unreadCountSchema = unwrapData(GetApiV1ConversationsMeUnreadCountResponse);
const conversationPath = (conversationId: string) => `/conversations/${encodeURIComponent(conversationId)}`;

/**
 * Conversas por conta (spec 055). Sem o hub de tempo real (decisão pendente com a API), a lista e a conversa aberta
 * se atualizam por consulta periódica. O transporte vem de fora: `bffClient` no navegador, `backendForRequest` no
 * prefetch.
 *
 * @example useQuery(conversationQueries.mine(user.id))
 * @example useInfiniteQuery(conversationQueries.messages(user.id, conversationId))
 */
export const conversationQueries = {
  all: (accountId: string) => accountQueryKey(accountId, "conversations"),
  /** Tudo que muda quando chega ou sai mensagem: a lista e o contador. */
  summaries: (accountId: string) => [...conversationQueries.all(accountId), "summary"] as const,
  mine: (accountId: string, transport: Transport = bffClient) =>
    queryOptions({
      queryKey: [...conversationQueries.summaries(accountId), "mine"] as const,
      queryFn: async () => {
        const page = await transport.request(
          { method: "GET", path: "/conversations/me", query: { page: 1, pageSize: LIST_PAGE_SIZE } },
          conversationPageSchema,
        );
        return page.items.map(toConversation);
      },
      refetchInterval: LIST_POLL_MS,
    }),
  unreadCount: (accountId: string, transport: Transport = bffClient) =>
    queryOptions({
      queryKey: [...conversationQueries.summaries(accountId), "unread-count"] as const,
      queryFn: async () =>
        (await transport.request({ method: "GET", path: "/conversations/me/unread-count" }, unreadCountSchema)).total,
      refetchInterval: LIST_POLL_MS,
    }),
  detail: (accountId: string, conversationId: string, transport: Transport = bffClient) =>
    queryOptions({
      queryKey: [...conversationQueries.all(accountId), "detail", conversationId] as const,
      queryFn: async () =>
        toConversation(
          await transport.request({ method: "GET", path: conversationPath(conversationId) }, conversationDtoSchema),
        ),
      refetchInterval: LIST_POLL_MS,
    }),
  /**
   * Mensagens por cursor (REQ-CHAT-007): a primeira página são as mais recentes; a seguinte pede as anteriores à
   * mais antiga recebida (`before`).
   */
  messages: (accountId: string, conversationId: string, transport: Transport = bffClient) =>
    infiniteQueryOptions({
      queryKey: [...conversationQueries.all(accountId), "messages", conversationId] as const,
      queryFn: async ({ pageParam }) =>
        toMessagePage(
          await transport.request(
            {
              method: "GET",
              path: `${conversationPath(conversationId)}/messages`,
              query: { pageSize: MESSAGE_PAGE_SIZE, ...(pageParam ? { before: pageParam } : {}) },
            },
            messagePageSchema,
          ),
        ),
      initialPageParam: null as string | null,
      getNextPageParam: (last) => (last.hasMore ? (last.items.at(-1)?.id ?? null) : null),
      refetchInterval: THREAD_POLL_MS,
    }),
};
