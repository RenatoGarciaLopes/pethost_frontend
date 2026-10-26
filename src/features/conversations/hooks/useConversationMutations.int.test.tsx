import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { CIDA_CONVERSATION_ID, conversationDto, messageDto } from "@/test/fixtures/conversations";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient } from "@/test/render";
import { conversationDtoSchema, messageDtoSchema } from "../api/contracts";
import { toConversation, toMessage } from "../api/mappers";
import { conversationQueries } from "../api/queries";
import { useMarkConversationRead, useSendMessage } from "./useConversationMutations";

const ACCOUNT = "account-1";
const path = `*/api/conversations/${CIDA_CONVERSATION_ID}`;

function setup() {
  const client = createTestQueryClient();
  const messagesKey = conversationQueries.messages(ACCOUNT, CIDA_CONVERSATION_ID).queryKey;
  const listKey = conversationQueries.mine(ACCOUNT).queryKey;
  const detailKey = conversationQueries.detail(ACCOUNT, CIDA_CONVERSATION_ID).queryKey;
  const unreadKey = conversationQueries.unreadCount(ACCOUNT).queryKey;
  const existing = toMessage(messageDtoSchema.parse(messageDto({ body: "Já jantou!" })));
  client.setQueryData(messagesKey, { pages: [{ items: [existing], hasMore: false }], pageParams: [null] });
  client.setQueryData(listKey, []);
  client.setQueryData(detailKey, toConversation(conversationDtoSchema.parse(conversationDto())));
  client.setQueryData(unreadKey, 2);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const view = renderHook(
    () => ({
      send: useSendMessage(ACCOUNT, CIDA_CONVERSATION_ID),
      read: useMarkConversationRead(ACCOUNT, CIDA_CONVERSATION_ID),
    }),
    { wrapper },
  );
  return { ...view, client, messagesKey, listKey, detailKey, unreadKey, existing };
}

// As listas invalidadas voltam a buscar: respostas vazias para os efeitos não reprovarem por falta de handler.
const summaryHandlers = [
  http.get("*/api/conversations/me", () =>
    HttpResponse.json(apiOk({ items: [], page: 1, pageSize: 50, totalCount: 0 })),
  ),
  http.get("*/api/conversations/me/unread-count", () => HttpResponse.json(apiOk({ total: 0 }))),
];

describe("useConversationMutations", () => {
  it("REQ-CHAT-008 a mensagem enviada entra na hora no topo da conversa e a lista é atualizada", async () => {
    const sent = messageDto({ sentBy: "owner", body: "Boa noite!", createdAt: "2026-12-21T19:30:00Z" });
    server.use(
      http.post(`${path}/messages`, () => HttpResponse.json(apiOk(sent), { status: 201 })),
      ...summaryHandlers,
    );
    const { result, client, messagesKey, listKey, existing } = setup();

    await act(() => result.current.send.mutateAsync({ body: "Boa noite!", photo: null }));

    const items = client.getQueryData(messagesKey)?.pages[0]?.items ?? [];
    expect(items.map((item) => item.id)).toEqual([sent.id, existing.id]);
    expect(client.getQueryState(listKey)?.isInvalidated).toBe(true);
  });

  it("REQ-CHAT-009 com foto, vai pela rota de foto", async () => {
    const sent = messageDto({
      sentBy: "owner",
      body: undefined,
      imageUrl: "https://bucket/foto.jpg",
      createdAt: "2026-12-21T19:30:00Z",
    });
    server.use(
      http.post(`${path}/messages/photo`, () => HttpResponse.json(apiOk(sent), { status: 201 })),
      ...summaryHandlers,
    );
    const { result, client, messagesKey } = setup();
    const photo = new File([new Uint8Array(4)], "pipoca.jpg", { type: "image/jpeg" });

    await act(() => result.current.send.mutateAsync({ body: "", photo }));

    expect(client.getQueryData(messagesKey)?.pages[0]?.items[0]?.imageUrl).toBe("https://bucket/foto.jpg");
  });

  it("REQ-CHAT-001 marcar como lida grava o contador novo e zera as não lidas da conversa", async () => {
    server.use(
      http.put(`${path}/read-marker`, () => HttpResponse.json(apiOk({ total: 0 }))),
      ...summaryHandlers,
    );
    const { result, client, detailKey, unreadKey } = setup();

    await act(() => result.current.read.mutateAsync());

    expect(client.getQueryData(unreadKey)).toBe(0);
    expect(client.getQueryData(detailKey)?.unreadCount).toBe(0);
  });
});
