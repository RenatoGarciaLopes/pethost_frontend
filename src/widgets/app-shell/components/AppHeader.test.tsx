import { screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { sessionUserFixture } from "@/test/fixtures/session";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { AppHeader } from "./AppHeader";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }), usePathname: () => "/" }));

it("REQ-UIC-003 visitante usa cabeçalho da casca, como funciona e entrar, sem links futuros", () => {
  renderWithProviders(<AppHeader variant="home" />, { theme: quintalTheme });
  const banner = within(screen.getByRole("banner"));
  expect(banner.getByRole("link", { name: "PetHost" })).toHaveAttribute("href", "/");
  expect(banner.getByRole("link", { name: "PetHost" })).toHaveStyle({ textDecoration: "none", color: "#1F1A17" });
  expect(banner.getByRole("link", { name: "Como funciona" })).toHaveAttribute("href", "#como-funciona");
  expect(banner.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
  expect(banner.queryByRole("link", { name: "Conversas" })).not.toBeInTheDocument();
  expect(banner.queryByRole("button", { name: /Menu da conta/ })).not.toBeInTheDocument();
});

it("REQ-UIC-003 tutor vê estadias e nome na pílula sem perder o menu da conta", async () => {
  const { user, queryClient } = renderWithProviders(<AppHeader variant="home" user={sessionUserFixture} />, {
    theme: quintalTheme,
  });
  queryClient.setQueryData(accountQueryKey(sessionUserFixture.id, "linked-accounts"), []);
  expect(screen.getByRole("link", { name: "Minhas estadias" })).toHaveAttribute("href", "/owner/bookings");
  const account = screen.getByRole("button", { name: /Menu da conta de Camila Souza/ });
  expect(account).toHaveTextContent("Camila");
  await user.click(account);
  expect(await screen.findByRole("menuitem", { name: "Minha conta" })).toHaveAttribute("href", "/users/profile");
});

it("REQ-SHELL-002 REQ-UIC-003 na casca o tutor vê Buscar (home), Meus pets e Minhas estadias, e a pílula com o nome", () => {
  renderWithProviders(<AppHeader user={sessionUserFixture} />, { theme: quintalTheme });
  const nav = within(screen.getByRole("navigation", { name: "Navegação principal" }));
  expect(nav.getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
    ["Buscar", "/"],
    ["Meus pets", "/pets"],
    ["Minhas estadias", "/owner/bookings"],
  ]);
  expect(nav.queryByRole("link", { name: "Conversas" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Menu da conta de Camila Souza/ })).toHaveTextContent("Camila");
});

it("REQ-LPAGE-012 o Entrar do visitante volta para a página aberta que ele estava vendo", () => {
  renderWithProviders(<AppHeader returnTo="/listings/abc?from=2026-11-10" />, { theme: quintalTheme });
  expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute(
    "href",
    "/login?next=%2Flistings%2Fabc%3Ffrom%3D2026-11-10",
  );
});

it("096 mede busca e chips, atualiza o offset ao redimensionar e limpa ao desmontar", () => {
  let resize: () => void = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe = vi.fn();
      disconnect = disconnect;
    },
  );
  const rect = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect");
  rect.mockReturnValue({ height: 148 } as DOMRect);
  const { unmount } = renderWithProviders(<AppHeader search={<div>Busca</div>} filters={<div>Filtros</div>} />, {
    theme: quintalTheme,
  });
  expect(screen.getByRole("banner")).toHaveStyle({
    position: "sticky",
    top: "0px",
    zIndex: String(quintalTheme.zIndex.appBar),
  });
  expect(document.documentElement.style.getPropertyValue("--app-header-height")).toBe("148px");
  rect.mockReturnValue({ height: 212 } as DOMRect);
  resize();
  expect(document.documentElement.style.getPropertyValue("--app-header-height")).toBe("212px");
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
  expect(document.documentElement.style.getPropertyValue("--app-header-height")).toBe("");
  rect.mockRestore();
  vi.unstubAllGlobals();
});
