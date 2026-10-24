import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { createBffClient } from "@/shared/api/client/bffClient";
import {
  CIDA_CONVERSATION_ID,
  conversationDto,
  messageDto,
  previewConversationDtos,
} from "@/test/fixtures/conversations";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient } from "@/test/render";
import { conversationQueries } from "./queries";

const transport = createBffClient({ baseUrl: "http://localhost/api" });
const ACCOUNT = "account-1";

describe("conversationQueries", () => {
  it("REQ-CHAT-001 a lista pede a primeira página e chega já convertida", async () => {
    server.use(
      http.get("*/api/conversations/me", ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("page")).toBe("1");
        expect(url.searchParams.get("pageSize")).toBe("50");
        const items = previewConversationDtos();
        return HttpResponse.json(apiOk({ items, page: 1, pageSize: 50, totalCount: items.length }));
      }),
    );
    const list = await createTestQueryClient().fetchQuery(conversationQueries.mine(ACCOUNT, transport));
    expect(list.map((conversation) => conversation.host?.name)).toEqual(["Dona Cida", "Teresa", "Seu Antônio e Marli"]);
  });

  it("REQ-CHAT-001 o contador soma as não lidas da conta", async () => {
    server.use(http.get("*/api/conversations/me/unread-count", () => HttpResponse.json(apiOk({ total: 4 }))));
    expect(await createTestQueryClient().fetchQuery(conversationQueries.unreadCount(ACCOUNT, transport))).toBe(4);
  });

  it("REQ-CHAT-002 o detalhe abre uma conversa", async () => {
    server.use(
      http.get(`*/api/conversations/${CIDA_CONVERSATION_ID}`, () => HttpResponse.json(apiOk(conversationDto()))),
    );
    const conversation = await createTestQueryClient().fetchQuery(
      conversationQueries.detail(ACCOUNT, CIDA_CONVERSATION_ID, transport),
    );
    expect(conversation.unreadCount).toBe(2);
  });

  it("REQ-CHAT-007 mensagens por cursor: sem 'before' as recentes; depois, as anteriores à mais antiga recebida", async () => {
    const newest = messageDto({ createdAt: "2026-12-21T19:03:00Z" });
    const oldest = messageDto({ createdAt: "2026-12-21T19:02:00Z" });
    const older = messageDto({ createdAt: "2026-12-20T17:20:00Z" });
    const befores: (string | null)[] = [];
    server.use(
      http.get(`*/api/conversations/${CIDA_CONVERSATION_ID}/messages`, ({ request }) => {
        const before = new URL(request.url).searchParams.get("before");
        befores.push(before);
        const page = before ? { items: [older], hasMore: false } : { items: [newest, oldest], hasMore: true };
        return HttpResponse.json(apiOk({ ...page, pageSize: 50 }));
      }),
    );
    const client = createTestQueryClient();
    const options = conversationQueries.messages(ACCOUNT, CIDA_CONVERSATION_ID, transport);
    await client.fetchInfiniteQuery(options);
    await client.fetchInfiniteQuery({ ...options, pages: 2 });

    expect(befores).toEqual([null, null, oldest.id]);
    const pages = client.getQueryData(options.queryKey)?.pages ?? [];
    expect(pages.flatMap((page) => page.items.map((item) => item.id))).toEqual([newest.id, oldest.id, older.id]);
  });

  it("REQ-CHAT-001 o cache é separado por conta", () => {
    expect(conversationQueries.mine("a").queryKey).not.toEqual(conversationQueries.mine("b").queryKey);
  });
});
