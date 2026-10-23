import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { searchPetsFixture, searchQueryFixture } from "@/test/fixtures/search";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { quintalColors } from "@/shared/theme/tokens/colors";
import { FilterChips } from "./FilterChips";
it("REQ-SRCH-006 sem criança envia false e limpar preserva lugar e datas", async () => {
  const onChange = vi.fn();
  const query = searchQueryFixture({
    where: "Maringá",
    from: "2026-10-15",
    to: "2026-10-20",
    hasKids: false,
  });
  const { user } = renderWithProviders(<FilterChips query={query} onChange={onChange} />);
  expect(screen.getByRole("button", { name: "Sem criança" })).toHaveAttribute("aria-pressed", "true");
  await user.click(screen.getByRole("button", { name: "Casa com quintal" }));
  expect(onChange).toHaveBeenLastCalledWith({ ...query, hasYard: true });
  await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
  expect(onChange.mock.lastCall?.[0]).toMatchObject({
    where: "Maringá",
    from: "2026-10-15",
    to: "2026-10-20",
    hasKids: undefined,
  });
});

it("combina usa os pets da busca e permite retirar a seleção", async () => {
  const query = searchQueryFixture({ pets: [searchPetsFixture[0]!.id], hasYard: true });
  const onChange = vi.fn();
  const { user } = renderWithProviders(<FilterChips query={query} pets={searchPetsFixture} onChange={onChange} />);
  const chip = screen.getByRole("button", { name: "Combina com Luna" });
  expect(chip).toHaveAttribute("aria-pressed", "true");
  await user.click(chip);
  expect(onChange).toHaveBeenLastCalledWith({ ...query, pets: [] });
});
it("espécie, porte e tipo de casa alternam sem perder os outros filtros", async () => {
  const query = searchQueryFixture({ species: ["cat"], sizes: ["large"], homeType: "house" });
  const onChange = vi.fn();
  const { user } = renderWithProviders(<FilterChips query={query} onChange={onChange} />);
  await user.click(screen.getByRole("button", { name: "Aceita gatos" }));
  expect(onChange).toHaveBeenLastCalledWith({ ...query, species: [] });
  await user.click(screen.getByRole("button", { name: "Aceita porte grande" }));
  expect(onChange).toHaveBeenLastCalledWith({ ...query, sizes: [] });
  await user.click(screen.getByRole("button", { name: "Apartamento" }));
  expect(onChange).toHaveBeenLastCalledWith({ ...query, homeType: "apartment" });
  await user.click(screen.getByRole("button", { name: /^Casa$/ }));
  expect(onChange).toHaveBeenLastCalledWith({ ...query, homeType: undefined });
});

it("chip selecionado fica verde (grama) e o outro não", () => {
  const query = searchQueryFixture({ hasYard: true });
  renderWithProviders(<FilterChips query={query} onChange={vi.fn()} />, { theme: quintalTheme });
  expect(screen.getByRole("button", { name: "Casa com quintal" })).toHaveStyle({
    backgroundColor: quintalColors.grama,
  });
  expect(screen.getByRole("button", { name: "Apartamento" })).not.toHaveStyle({
    backgroundColor: quintalColors.grama,
  });
});
