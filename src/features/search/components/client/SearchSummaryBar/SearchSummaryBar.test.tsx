import { screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { searchPetsFixture } from "@/test/fixtures/search";
import { renderWithProviders } from "@/test/render";
import { SearchSummaryBar } from "./SearchSummaryBar";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(window.location.search) }));

function renderBar(url: string) {
  window.history.replaceState(null, "", url);
  return renderWithProviders(<SearchSummaryBar pets={searchPetsFixture} />, { theme: quintalTheme });
}

afterEach(() => window.history.replaceState(null, "", "/"));

it("REQ-SRCH-014 sem busca na URL a barra compacta não aparece", () => {
  renderBar("/");
  expect(screen.queryByRole("group", { name: "Sua busca" })).not.toBeInTheDocument();
});

it("REQ-SRCH-014 com busca resume lugar, datas e pet em segmentos", () => {
  renderBar(`/?where=Zona+7&from=2026-12-20&to=2026-12-25&pets=${searchPetsFixture[0]!.id}`);
  expect(screen.getByRole("button", { name: "Editar o lugar: Zona 7" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Editar as datas: 20 a 25 dez" })).toBeVisible();
  expect(screen.getByRole("button", { name: `Editar o pet: ${searchPetsFixture[0]!.name}` })).toBeVisible();
});

it("REQ-SRCH-014 tocar no lugar abre a edição com o campo em foco e buscar atualiza a URL", async () => {
  const { user } = renderBar("/?where=Zona+7");
  await user.click(screen.getByRole("button", { name: /^Editar o lugar/ }));
  const field = await screen.findByRole("textbox", { name: "Onde" });
  expect(field).toHaveFocus();
  await user.clear(field);
  await user.type(field, "Zona 5");
  await user.click(screen.getByRole("button", { name: "Achar um cantinho" }));
  expect(window.location.search).toContain("where=Zona+5");
  expect(screen.queryByRole("textbox", { name: "Onde" })).not.toBeInTheDocument();
});

it("REQ-SRCH-014 tocar nas datas abre o calendário", async () => {
  const { user } = renderBar("/?where=Zona+7");
  await user.click(screen.getByRole("button", { name: /^Editar as datas/ }));
  expect(await screen.findByRole("dialog", { name: "Escolher as datas da estadia" })).toBeVisible();
});
