import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AnnouncerProvider } from "@/shared/ui/feedback/Announcer";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { PetWelcome } from "./PetWelcome";
it("REQ-PNEW-020 anúncio único, lista de pets e apresentar outro; busca fica para a 041", async () => {
  const another = vi.fn();
  const { user } = renderWithProviders(
    <AnnouncerProvider>
      <PetWelcome name="Mel" onAnother={another} />
    </AnnouncerProvider>,
    { theme: quintalTheme },
  );
  expect(screen.getByRole("heading", { name: "Prazer, Mel!" })).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("Ficha de Mel salva.");
  expect(screen.getByRole("link", { name: "Ver meus pets" })).toHaveAttribute("href", "/pets");
  expect(screen.queryByRole("link", { name: /Procurar/ })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Apresentar outro pet" }));
  expect(another).toHaveBeenCalledTimes(1);
});
it("REQ-HPETS-004 anfitrião volta à lista enquanto o cantinho não existe e apresenta outro pet da casa", async () => {
  const another = vi.fn();
  const { user } = renderWithProviders(
    <AnnouncerProvider>
      <PetWelcome name="Bóris" role="host" onAnother={another} />
    </AnnouncerProvider>,
    { theme: quintalTheme },
  );
  expect(screen.getByRole("heading", { name: "Prazer, Bóris!" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Ver pets da casa" })).toHaveAttribute("href", "/pets");
  expect(screen.queryByRole("link", { name: "Voltar pro meu cantinho" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Apresentar outro pet da casa" }));
  expect(another).toHaveBeenCalledOnce();
});
