import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { AccountSectionNav } from "./AccountSectionNav";

const navigation = vi.hoisted(() => ({ pathname: "/users/password" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

describe("REQ-ACC-027 navegação de Minha conta", () => {
  it.each([
    ["/users/profile", "Perfil"],
    ["/users/password", "Senha"],
    ["/users/deactivate", "Pausar conta"],
  ])("em %s marca %s como página atual e liga as três", (pathname, current) => {
    navigation.pathname = pathname;
    renderWithProviders(<AccountSectionNav />, { theme: quintalTheme });

    const nav = screen.getByRole("navigation", { name: "Minha conta" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Perfil", "/users/profile"],
      ["Senha", "/users/password"],
      ["Pausar conta", "/users/deactivate"],
    ]);
    expect(within(nav).getByRole("link", { current: "page" })).toHaveTextContent(current);
  });

  it("fora das três páginas nenhuma fica marcada", () => {
    navigation.pathname = "/users/switch";
    renderWithProviders(<AccountSectionNav />, { theme: quintalTheme });
    expect(screen.queryByRole("link", { current: "page" })).not.toBeInTheDocument();
  });
});
