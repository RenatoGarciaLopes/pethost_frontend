import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { CIDA_CONVERSATION_ID, previewConversationDtos } from "@/test/fixtures/conversations";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { conversationsCopy } from "../../../lib/conversationsCopy";
import { MyConversations } from "./MyConversations";

const render = () =>
  renderWithProviders(<MyConversations accountId="account-1" viewer="owner" selectedId={CIDA_CONVERSATION_ID} />, {
    theme: quintalTheme,
  });

describe("MyConversations", () => {
  it("REQ-CHAT-001 busca as conversas da conta e mostra a lista, com a aberta marcada", async () => {
    const items = previewConversationDtos();
    server.use(
      http.get("*/api/conversations/me", () =>
        HttpResponse.json(apiOk({ items, page: 1, pageSize: 50, totalCount: items.length })),
      ),
    );
    render();
    expect(screen.getByRole("status", { name: conversationsCopy.loadingList })).toBeInTheDocument();
    const links = await screen.findAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute("href", `/conversations/${CIDA_CONVERSATION_ID}`);
    expect(links[0]).toHaveAttribute("aria-current", "page");
  });

  it("REQ-CHAT-001 se a lista não abre, explica e oferece tentar de novo", async () => {
    server.use(
      http.get("*/api/conversations/me", () => HttpResponse.json(apiFail("UNEXPECTED_ERROR"), { status: 500 })),
    );
    render();
    expect(await screen.findByText(conversationsCopy.listLoadError)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tentar de novo/i })).toBeInTheDocument();
  });
});
