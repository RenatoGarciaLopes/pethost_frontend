import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { navItemsFor } from "@/shared/config/navigation";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { HeaderNav } from "./HeaderNav";

const navigation = vi.hoisted(() => ({ pathname: "/pets/0199d2a0-0000-7000-8000-000000000001" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

function setup() {
  return renderWithProviders(<HeaderNav items={navItemsFor("owner")} />, { theme: quintalTheme });
}

describe("atalhos do cabeçalho", () => {
  it("REQ-SHELL-002 REQ-SHELL-008 mostra os atalhos do papel e marca a página atual, também nas de dentro", () => {
    setup();
    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(within(nav).getByRole("link", { name: "Meus pets" })).toHaveAttribute("aria-current", "page");
  });

  it("REQ-SHELL-008 fora do atalho nada fica marcado", () => {
    navigation.pathname = "/users/profile";
    setup();
    expect(screen.queryByRole("link", { current: "page" })).not.toBeInTheDocument();
    navigation.pathname = "/pets";
  });

  it("REQ-UIC-003 host subroutes keep the Panel shortcut active by prefix", () => {
    navigation.pathname = "/host/bookings/123";
    renderWithProviders(<HeaderNav items={navItemsFor("host")} />, { theme: quintalTheme });
    expect(screen.getByRole("link", { name: "Painel" })).toHaveAttribute("aria-current", "page");
    navigation.pathname = "/pets/0199d2a0-0000-7000-8000-000000000001";
  });

  it("REQ-SHELL-006 a gaveta abre com os mesmos atalhos, fecha com Esc e devolve o foco ao botão", async () => {
    const { user } = setup();
    const trigger = screen.getByRole("button", { name: "Abrir a navegação" });
    await user.click(trigger);
    const drawer = await screen.findByRole("presentation");
    expect(within(drawer).getByRole("link", { name: "Meus pets" })).toHaveAttribute("href", "/pets");

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("presentation")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
