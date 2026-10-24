import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { conversationsCopy } from "../../../lib/conversationsCopy";
import { ConversationHeader } from "./ConversationHeader";

describe("ConversationHeader", () => {
  it("REQ-CHAT-011 nome como título da conversa, o cantinho embaixo e o selo à direita", () => {
    renderWithProviders(
      <ConversationHeader
        name="Dona Cida"
        avatarUrl={null}
        subtitle="Casa da Dona Cida · Jd. Alvorada"
        aside={<span>Pipoca aqui · dia 2 de 5</span>}
      />,
      { theme: quintalTheme },
    );
    expect(screen.getByRole("heading", { level: 2, name: "Dona Cida" })).toBeInTheDocument();
    expect(screen.getByText("Casa da Dona Cida · Jd. Alvorada")).toBeInTheDocument();
    expect(screen.getByText("Pipoca aqui · dia 2 de 5")).toBeInTheDocument();
  });

  it("REQ-CHAT-012 com backHref, o link de voltar para a lista", () => {
    renderWithProviders(<ConversationHeader name="Dona Cida" avatarUrl={null} backHref="/conversations" />, {
      theme: quintalTheme,
    });
    expect(screen.getByRole("link", { name: conversationsCopy.back })).toHaveAttribute("href", "/conversations");
  });
});
