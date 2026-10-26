import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { previewConversations } from "@/test/conversationsPreview";
import { CIDA_CONVERSATION_ID, CONVERSATIONS_NOW } from "@/test/fixtures/conversations";
import { renderWithProviders } from "@/test/render";
import { conversationsCopy } from "../../../lib/conversationsCopy";
import { ConversationList } from "./ConversationList";

const hrefOf = (id: string) => `/conversations/${id}`;

function setup(props: Partial<Parameters<typeof ConversationList>[0]> = {}) {
  return renderWithProviders(
    <ConversationList
      conversations={previewConversations()}
      viewer="owner"
      hrefOf={hrefOf}
      now={CONVERSATIONS_NOW}
      {...props}
    />,
    { theme: quintalTheme },
  );
}

describe("ConversationList", () => {
  it("REQ-CHAT-001 cada conversa é um link com quem está do outro lado, a prévia, quando foi e as não lidas", () => {
    setup();
    const list = screen.getByRole("list", { name: conversationsCopy.listLabel });
    const items = within(list).getAllByRole("link");
    expect(items).toHaveLength(3);

    const cida = items[0]!;
    expect(cida).toHaveAttribute("href", hrefOf(CIDA_CONVERSATION_ID));
    expect(cida).toHaveTextContent("Dona Cida");
    expect(cida).toHaveTextContent("Hoje tem jogo e vai ter rojão.");
    expect(cida).toHaveTextContent("16h03");
    expect(within(cida).getByText("2 mensagens não lidas")).toBeInTheDocument();

    expect(items[1]).toHaveTextContent("Você: Obrigada por tudo!");
    expect(items[1]).toHaveTextContent("8 out");
    expect(within(items[1]!).queryByText(/não lidas?/)).not.toBeInTheDocument();
  });

  it("REQ-CHAT-002 a conversa aberta leva aria-current e as outras não", () => {
    setup({ selectedId: CIDA_CONVERSATION_ID });
    const [cida, teresa] = screen.getAllByRole("link");
    expect(cida).toHaveAttribute("aria-current", "page");
    expect(teresa).not.toHaveAttribute("aria-current");
  });

  it("REQ-CHAT-001 o anfitrião vê o nome do tutor", () => {
    setup({ viewer: "host" });
    expect(screen.getAllByRole("link")[0]).toHaveTextContent("Camila");
  });

  it("REQ-CHAT-003 sem conversas, explica onde elas nascem", () => {
    setup({ conversations: [] });
    expect(screen.getByRole("heading", { name: conversationsCopy.emptyList.title })).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
