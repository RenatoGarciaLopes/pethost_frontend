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
