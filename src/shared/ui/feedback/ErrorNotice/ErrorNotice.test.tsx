import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { ErrorNotice } from "./ErrorNotice";

describe("ErrorNotice", () => {
  it("REQ-PWD-012 sem mensagem não mostra nada", () => {
    renderWithProviders(<ErrorNotice message={null} tone="erro" />, { theme: quintalTheme });
    expect(screen.queryByText(/./)).not.toBeInTheDocument();
  });

  it("REQ-PWD-012 ao aparecer recebe o foco; mudar só a frase não puxa o foco de volta", async () => {
    const { rerender } = renderWithProviders(<ErrorNotice message={null} tone="atencao" />, { theme: quintalTheme });
    rerender(<ErrorNotice message="Dá pra tentar de novo em 3 segundos." tone="atencao" />);
    const notice = await screen.findByText("Dá pra tentar de novo em 3 segundos.");
    const box = notice.closest("[tabindex]") as HTMLElement;
    expect(box).toHaveFocus();

    box.blur();
    rerender(<ErrorNotice message="Dá pra tentar de novo em 2 segundos." tone="atencao" />);
    expect(await screen.findByText("Dá pra tentar de novo em 2 segundos.")).toBeInTheDocument();
    expect(box).not.toHaveFocus();
  });
});
