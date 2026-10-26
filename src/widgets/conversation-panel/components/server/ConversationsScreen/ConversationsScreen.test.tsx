import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { previewConversation, previewMessages } from "@/test/conversationsPreview";
import { CIDA_CONVERSATION_ID } from "@/test/fixtures/conversations";
import { renderWithProviders } from "@/test/render";
import { ConversationContent, ConversationsScreen } from "./ConversationsScreen";

const server = vi.hoisted(() => ({
  getConversation: vi.fn(),
  prefetchMessages: vi.fn(),
  prefetchMyConversations: vi.fn(),
  getBookingDetail: vi.fn(),
}));

vi.mock("@/features/conversations/index.server", () => ({
  getConversation: server.getConversation,
  prefetchMessages: server.prefetchMessages,
  prefetchMyConversations: server.prefetchMyConversations,
}));
vi.mock("@/features/bookings/index.server", () => ({ getBookingDetail: server.getBookingDetail }));
// As ilhas têm testes próprios; aqui só importa o que o servidor entrega a elas.
vi.mock("../../client/ConversationRoom", () => ({
  ConversationRoom: ({ stay }: { stay: { listingTitle: string } | null }) => (
    <p>sala {stay ? stay.listingTitle : "sem estadia"}</p>
  ),
}));
vi.mock("../../client/ConversationsShell", () => ({
  ConversationsShell: ({ children }: { children: import("react").ReactNode }) => (
    <>
      <p>lista persistente</p>
      {children}
    </>
  ),
}));

const booking = {
  status: "in_progress",
  listing: { title: "Casa da Cida", neighborhood: "Zona 01" },
  host: { name: "Aparecida" },
  pets: [{ name: "Pipoca" }],
  checkIn: "2026-12-20",
  checkOut: "2026-12-25",
  checkedInAt: null,
};

describe("ConversationsScreen", () => {
  beforeEach(() => {
    server.getConversation.mockResolvedValue(previewConversation());
    server.prefetchMessages.mockResolvedValue(previewMessages());
    server.prefetchMyConversations.mockResolvedValue(undefined);
    server.getBookingDetail.mockResolvedValue(booking);
  });

  it("REQ-CHAT-001 sem conversa aberta, só a lista e nada de conversa", async () => {
    renderWithProviders(await ConversationsScreen({ accountId: "a1", viewer: "owner", children: null }), {
      theme: quintalTheme,
    });
    expect(screen.getByText("lista persistente")).toBeInTheDocument();
    expect(server.getConversation).not.toHaveBeenCalled();
  });

  it("REQ-CHAT-011 conversa aberta: busca a estadia pela mensagem mais recente com reserva", async () => {
    renderWithProviders(
      await ConversationContent({ accountId: "a1", viewer: "owner", conversationId: CIDA_CONVERSATION_ID }),
      { theme: quintalTheme },
    );
    expect(server.prefetchMyConversations).not.toHaveBeenCalled();
    expect(screen.getByText("sala Casa da Cida")).toBeInTheDocument();
    expect(server.getBookingDetail).toHaveBeenCalledWith("a1", previewMessages()[0]?.bookingId);
  });

  it("REQ-CHAT-011 reserva que não abre deixa a conversa sem estadia, sem derrubar a página", async () => {
    server.getBookingDetail.mockRejectedValue(new Error("404"));
    renderWithProviders(
      await ConversationContent({ accountId: "a1", viewer: "owner", conversationId: CIDA_CONVERSATION_ID }),
      { theme: quintalTheme },
    );
    expect(screen.getByText("sala sem estadia")).toBeInTheDocument();
  });
});
