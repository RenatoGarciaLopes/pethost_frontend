import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { RegisterChoice } from "./RegisterChoice";

const render = (next: string | null) => renderWithProviders(<RegisterChoice next={next} />, { theme: quintalTheme });

describe("RegisterChoice", () => {
  it("REQ-OREG-001 abre com as duas contas e nenhuma marcada; continuar fica travado com o motivo", () => {
    render(null);
    expect(screen.getByRole("heading", { level: 1, name: "Como você vai usar o PetHost?" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Tenho pet e vou viajar/ })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /Quero receber pets em casa/ })).not.toBeChecked();
    const next = screen.getByRole("button", { name: "Continuar" });
    expect(next).toBeDisabled();
    expect(next).toHaveAccessibleDescription("Escolhe uma das duas pra continuar.");
  });

  it("REQ-OREG-001 escolher tutor leva ao formulário de tutor com o next seguro", async () => {
    const { user } = render("/hosts/42");
    await user.click(screen.getByRole("radio", { name: /Tenho pet e vou viajar/ }));
    expect(screen.getByRole("link", { name: "Continuar como tutor" })).toHaveAttribute(
      "href",
      "/register/owner?next=%2Fhosts%2F42",
    );
  });

  it("REQ-OREG-001 escolher anfitrião leva ao formulário de anfitrião; next inseguro é descartado", async () => {
    const { user } = render("https://evil.example");
    await user.click(screen.getByRole("radio", { name: /Quero receber pets em casa/ }));
    expect(screen.getByRole("link", { name: "Continuar como anfitrião" })).toHaveAttribute("href", "/register/host");
  });

  it("REQ-OREG-001 o link de entrar mantém o next", () => {
    render("/hosts/42");
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login?next=%2Fhosts%2F42");
  });
});
