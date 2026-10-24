import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { conversationsCopy } from "@/features/conversations";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { previewConversation, previewMessages } from "@/test/conversationsPreview";
import { CONVERSATIONS_NOW, previewStay } from "@/test/fixtures/conversations";
import { renderWithProviders } from "@/test/render";
import { ConversationPanel } from "./ConversationPanel";

function setup(overrides: Record<string, unknown> = {}, withStay = true) {
  const onSend = vi.fn();
  const view = renderWithProviders(
    <ConversationPanel
      conversation={previewConversation(overrides)}
      viewer="owner"
      messages={previewMessages()}
      stay={withStay ? previewStay : null}
      onSend={onSend}
      backHref="/conversations"
      now={CONVERSATIONS_NOW}
    />,
    { theme: quintalTheme },
  );
  return { ...view, onSend };
}

describe("ConversationPanel", () => {
  it("REQ-CHAT-011 com estadia acontecendo: cantinho, dia da estadia, faixa e a chegada no meio da conversa", () => {
    setup();
    expect(screen.getByRole("region", { name: "Dona Cida" })).toBeInTheDocument();
    expect(screen.getByText("Casa da Dona Cida · Jd. Alvorada")).toBeInTheDocument();
    expect(screen.getByText("Pipoca aqui · dia 2 de 5")).toBeInTheDocument();
    expect(screen.getByText("Acontecendo")).toBeInTheDocument();
    expect(screen.getByText("20 a 25 de dez. · Pipoca está na casa de Dona Cida")).toBeInTheDocument();
    expect(screen.getByText("Pipoca chegou na casa de Dona Cida · 14h18")).toBeInTheDocument();
  });

  it("REQ-CHAT-011 sem estadia, só a conversa", () => {
    setup({}, false);
    expect(screen.queryByText(/dia 2 de 5/)).not.toBeInTheDocument();
    expect(screen.queryByText("Acontecendo")).not.toBeInTheDocument();
    expect(screen.queryByText(/chegou na casa/)).not.toBeInTheDocument();
  });

  it("REQ-CHAT-008 o campo envia para quem está do outro lado", async () => {
    const { user, onSend } = setup();
    await user.type(screen.getByRole("textbox", { name: "Mensagem para Dona Cida" }), "Boa noite!{Enter}");
    expect(onSend).toHaveBeenCalledWith({ body: "Boa noite!", photo: null });
  });

  it.each([
    [{ blocked: true, blockedByMe: true }, conversationsCopy.blocked.byMe],
    [{ blocked: true }, conversationsCopy.blocked.byOther],
    [{ blocked: true, blockedByModeration: true }, conversationsCopy.blocked.byModeration],
  ])("REQ-CHAT-010 bloqueada (%o): o aviso no lugar do campo, e as mensagens continuam", (overrides, notice) => {
    setup(overrides);
    expect(screen.getByRole("status")).toHaveTextContent(notice);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.getByText("Hoje tem jogo e vai ter rojão. Já separei a toalha dela no banheiro."),
    ).toBeInTheDocument();
  });
});
