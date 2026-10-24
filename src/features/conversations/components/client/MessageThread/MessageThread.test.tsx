import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { previewMessages } from "@/test/conversationsPreview";
import { CONVERSATIONS_NOW } from "@/test/fixtures/conversations";
import { renderWithProviders } from "@/test/render";
import { conversationsCopy } from "../../../lib/conversationsCopy";
import { MessageThread } from "./MessageThread";

function setup(props: Partial<Parameters<typeof MessageThread>[0]> = {}) {
  return renderWithProviders(
    <MessageThread
      messages={previewMessages()}
      viewer="owner"
      otherName="Dona Cida"
      now={CONVERSATIONS_NOW}
      {...props}
    />,
    { theme: quintalTheme },
  );
}

describe("MessageThread", () => {
  it("REQ-CHAT-004 mostra os dias em ordem de leitura, com as mensagens de cada um", () => {
    setup();
    const log = screen.getByRole("log", { name: conversationsCopy.threadLabel("Dona Cida") });
    const days = within(log).getAllByRole("heading", { level: 3 });
    expect(days.map((day) => day.textContent)).toEqual(["Ontem", "Hoje"]);

    const today = screen.getByRole("region", { name: "Hoje" });
    const texts = within(today)
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(texts[0]).toContain("Brincou a tarde toda com o Bóris.");
    expect(texts[1]).toContain("Hoje tem jogo e vai ter rojão.");
  });

  it("REQ-CHAT-005 diz quem falou e a hora, sem marcar 'lida'", () => {
    setup();
    const yesterday = screen.getByRole("region", { name: "Ontem" });
    const [fromHost, fromMe] = within(yesterday).getAllByRole("listitem");
    expect(fromHost).toHaveTextContent("Dona Cida disse:A Pipoca chegou! Já cheirou o quintal inteiro.14h20");
    expect(fromMe).toHaveTextContent("Você disse:Que alívio! Obrigada, Dona Cida.14h31");
    expect(screen.queryByText(/lida/)).not.toBeInTheDocument();
  });

  it("REQ-CHAT-006 foto com a legenda logo abaixo e texto alternativo de quem mandou", () => {
    setup();
    const photo = screen.getByRole("img", { name: conversationsCopy.photoAlt("Dona Cida") });
    expect(photo).toHaveAttribute("src", "/brand/turma/golden.webp");
    expect(photo.closest("li")).toHaveTextContent("Brincou a tarde toda com o Bóris. Já jantou!");
  });

  it("REQ-CHAT-011 acontecimento da estadia entra no meio, com a hora", () => {
    setup({ events: [{ id: "check-in", at: "2026-12-20T17:18:00Z", label: "Pipoca chegou na casa de Dona Cida" }] });
    const items = within(screen.getByRole("region", { name: "Ontem" })).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Pipoca chegou na casa de Dona Cida · 14h18");
  });

  it("REQ-CHAT-007 com mensagens anteriores, o botão pede a página anterior; buscando, ele espera", async () => {
    const onLoadOlder = vi.fn();
    const { user, rerender } = setup({ hasMore: true, onLoadOlder });
    await user.click(screen.getByRole("button", { name: conversationsCopy.loadOlder }));
    expect(onLoadOlder).toHaveBeenCalledOnce();

    rerender(
      <MessageThread
        messages={previewMessages()}
        viewer="owner"
        otherName="Dona Cida"
        now={CONVERSATIONS_NOW}
        hasMore
        isLoadingOlder
        onLoadOlder={onLoadOlder}
      />,
    );
    expect(screen.getByRole("button", { name: conversationsCopy.loadingOlder })).toBeDisabled();
  });

  it("REQ-CHAT-007 sem mensagens anteriores, nada de botão", () => {
    setup();
    expect(screen.queryByRole("button", { name: conversationsCopy.loadOlder })).not.toBeInTheDocument();
  });
});
