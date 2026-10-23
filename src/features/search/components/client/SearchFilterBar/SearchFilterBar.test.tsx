import { screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { searchPetsFixture } from "@/test/fixtures/search";
import { renderWithProviders } from "@/test/render";
import { SearchFilterBar } from "./SearchFilterBar";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(window.location.search) }));

afterEach(() => window.history.replaceState(null, "", "/"));

it("REQ-SRCH-014 sem busca na URL a faixa de chips não aparece", () => {
  window.history.replaceState(null, "", "/");
  renderWithProviders(<SearchFilterBar pets={searchPetsFixture} />, { theme: quintalTheme });
  expect(screen.queryByRole("button", { name: "Casa com quintal" })).not.toBeInTheDocument();
});

it("REQ-SRCH-014 com busca mostra os chips e ativar um escreve o filtro na URL", async () => {
  window.history.replaceState(null, "", "/?where=Maring%C3%A1");
  const { user } = renderWithProviders(<SearchFilterBar pets={searchPetsFixture} />, { theme: quintalTheme });
  await user.click(screen.getByRole("button", { name: "Casa com quintal" }));
  expect(window.location.search).toBe("?where=Maring%C3%A1&hasYard=true");
});
