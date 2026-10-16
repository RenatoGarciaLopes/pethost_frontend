import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { WaitingRequestsNotice } from "./WaitingRequestsSummary";

describe("WaitingRequestsNotice", () => {
  it("REQ-HREQ-001 o painel mostra quantos pedidos esperam resposta, com o link", () => {
    renderWithProviders(<WaitingRequestsNotice count={2} />, { theme: quintalTheme });
    expect(screen.getByText("2 pedidos esperando resposta")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver pedidos" })).toHaveAttribute("href", "/host/bookings?aba=pedidos");
  });

  it("REQ-HREQ-001 sem pedidos, nada", () => {
    const { container } = renderWithProviders(<WaitingRequestsNotice count={0} />, { theme: quintalTheme });
    expect(container).toBeEmptyDOMElement();
  });
});
