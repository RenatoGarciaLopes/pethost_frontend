import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { RegistrationSuccess } from "./RegistrationSuccess";

const render = (next: string | null, role: PersonalRole = "owner") =>
  renderWithProviders(<RegistrationSuccess role={role} fullName="  Camila  Souza Lima " next={next} />, {
    theme: quintalTheme,
  });

const links = () => screen.getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")]);

describe("RegistrationSuccess: tutor", () => {
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
    expect(links()).toEqual([
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

describe("RegistrationSuccess: anfitrião", () => {
  it("REQ-HREG-007 chama pelo primeiro nome e convida para a verificação", () => {
    render(null, "host");
    expect(screen.getByRole("heading", { level: 1, name: "Prazer, Camila!" })).toHaveFocus();
    expect(
      screen.getByText(
        "Sua conta de anfitrião está pronta. Agora mostra quem você é: é rapidinho e protege quem deixa o pet com você.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/apresenta seu pet/)).not.toBeInTheDocument();
  });

  it("REQ-HREG-007 sem next: começar a verificação é o principal, fazer depois vai para /host", () => {
    render(null, "host");
    expect(links()).toEqual([
      ["Começar a verificação", "/host/application"],
      ["Fazer isso depois", "/host"],
    ]);
  });

  it("REQ-HREG-007 com next seguro: voltar é o principal e a verificação vira secundário", () => {
    render("/hosts/42", "host");
    expect(links()).toEqual([
      ["Voltar pra onde eu estava", "/hosts/42"],
      ["Começar a verificação", "/host/application"],
    ]);
  });

  it("REQ-HREG-007 next inseguro é ignorado", () => {
    render("//evil.example", "host");
    expect(links()).toEqual([
      ["Começar a verificação", "/host/application"],
      ["Fazer isso depois", "/host"],
    ]);
  });
});
