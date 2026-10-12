import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { RegistrationSuccess } from "./RegistrationSuccess";

const render = (next: string | null) =>
  renderWithProviders(<RegistrationSuccess fullName="  Camila  Souza Lima " next={next} />, { theme: quintalTheme });

describe("RegistrationSuccess", () => {
  it("REQ-OREG-013 chama pelo primeiro nome e foca o título", () => {
    render(null);
    const heading = screen.getByRole("heading", { level: 1, name: "Prazer, Camila!" });
    expect(heading).toHaveFocus();
    expect(screen.getByText(/Agora apresenta seu pet pra gente/)).toBeInTheDocument();
  });

  it("REQ-OREG-013 sem next: apresentar o pet é o principal, fazer depois vai para a casa", () => {
    render(null);
    expect(screen.getByRole("link", { name: "Apresentar meu pet" })).toHaveAttribute("href", "/pets/new");
    expect(screen.getByRole("link", { name: "Fazer isso depois" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("link", { name: "Voltar pra onde eu estava" })).not.toBeInTheDocument();
  });

  it("REQ-OREG-013 com next seguro: voltar é o principal e o pet vira secundário", () => {
    render("/hosts/42?dias=3");
    const links = screen.getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")]);
    expect(links).toEqual([
      ["Voltar pra onde eu estava", "/hosts/42?dias=3"],
      ["Apresentar meu pet", "/pets/new"],
    ]);
  });

  it("REQ-OREG-013 next inseguro é ignorado", () => {
    render("https://evil.example");
    expect(screen.queryByRole("link", { name: "Voltar pra onde eu estava" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Apresentar meu pet" })).toBeInTheDocument();
  });
});
