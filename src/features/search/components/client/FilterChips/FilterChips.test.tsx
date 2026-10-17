import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { searchQueryFixture } from "@/test/fixtures/search";
import { FilterChips } from "./FilterChips";
it("REQ-SRCH-006 sem criança envia false e limpar preserva lugar e datas", async () => {
  const onChange = vi.fn();
  const query = searchQueryFixture({
    where: "Maringá",
    from: "2026-10-15",
    to: "2026-10-20",
    hasKids: false,
    maxNightlyRate: 80,
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
    maxNightlyRate: undefined,
  });
});
