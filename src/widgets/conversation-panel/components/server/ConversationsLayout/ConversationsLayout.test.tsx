import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { conversationsCopy } from "@/features/conversations";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { ConversationsLayout } from "./ConversationsLayout";

describe("ConversationsLayout", () => {
  it("REQ-CHAT-001 título da página, a lista e a conversa", () => {
    renderWithProviders(<ConversationsLayout focus="panel" list={<p>lista</p>} panel={<p>conversa</p>} />, {
      theme: quintalTheme,
    });
    expect(screen.getByRole("heading", { level: 1, name: conversationsCopy.heading })).toBeInTheDocument();
    expect(screen.getByText("lista")).toBeInTheDocument();
    expect(screen.getByText("conversa")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: conversationsCopy.listLabel })).toHaveTextContent("lista");
    expect(screen.queryByText(conversationsCopy.pickConversation.description)).not.toBeInTheDocument();
  });

  it("REQ-CHAT-012 sem conversa aberta, pede para escolher uma", () => {
    renderWithProviders(<ConversationsLayout focus="list" list={<p>lista</p>} />, { theme: quintalTheme });
    expect(screen.getByRole("heading", { name: conversationsCopy.pickConversation.title })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: conversationsCopy.pickConversation.title })).toHaveTextContent(
      conversationsCopy.pickConversation.description,
    );
  });
});
