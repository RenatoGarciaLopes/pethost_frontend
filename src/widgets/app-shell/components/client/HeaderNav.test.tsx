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

  it.each([
    ["/host", "Painel"],
    ["/host/application", "Minha verificação"],
    ["/host/bookings/123", "Pedidos"],
    ["/host/payments", "Painel"],
  ])("REQ-UIC-003 %s marks only the most specific matching host shortcut", (pathname, label) => {
    navigation.pathname = pathname;
    const { unmount } = renderWithProviders(<HeaderNav items={navItemsFor("host")} />, { theme: quintalTheme });
    expect(screen.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("link", { current: "page" })).toHaveLength(1);
    unmount();
    navigation.pathname = "/pets/0199d2a0-0000-7000-8000-000000000001";
  });

  it("REQ-SHELL-006 o botão do menu tem nome e estado, e a gaveta abre pela direita com os mesmos atalhos", async () => {
    const { user } = setup();
    const trigger = screen.getByRole("button", { name: "Abrir a navegação" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    const drawer = await screen.findByRole("presentation");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", drawer.id);
    expect(drawer).toHaveClass("MuiDrawer-anchorRight");
    const nav = within(drawer).getByRole("navigation", { name: "Navegação principal" });
    expect(within(nav).getByRole("link", { name: "Meus pets" })).toHaveAttribute("href", "/pets");
    expect(within(nav).getByRole("link", { name: "Meus pets" })).toHaveAttribute("aria-current", "page");
  });

  it("REQ-SHELL-006 o X fecha a gaveta e devolve o foco ao botão", async () => {
    const { user } = setup();
    const trigger = screen.getByRole("button", { name: "Abrir a navegação" });
    await user.click(trigger);
    const close = within(await screen.findByRole("presentation")).getByRole("button", { name: "Fechar menu" });
    expect(close).toHaveFocus();

    await user.click(close);

    await waitFor(() => expect(screen.queryByRole("presentation")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("REQ-SHELL-006 Esc fecha a gaveta e tocar num atalho também", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Abrir a navegação" }));
    await screen.findByRole("presentation");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("presentation")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Abrir a navegação" }));
    const drawer = await screen.findByRole("presentation");
    await user.click(within(drawer).getByRole("link", { name: "Minhas estadias" }));
    await waitFor(() => expect(screen.queryByRole("presentation")).not.toBeInTheDocument());
  });
});
