import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { listingFixture, searchQueryFixture } from "@/test/fixtures/search";
import { SearchResults } from "./SearchResults";
it("REQ-SRCH-005/010 vazio oferece raio maior", async () => {
  const onExpand = vi.fn();
  const { user } = renderWithProviders(
    <SearchResults
      query={searchQueryFixture()}
      items={[]}
      petCount={1}
      onMore={vi.fn()}
      onRetry={vi.fn()}
      onExpand={onExpand}
    />,
    { theme: quintalTheme },
  );
  expect(screen.getByText("Nenhum cantinho por aqui com esses filtros.")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Bora olhar até 20 km" }));
  expect(onExpand).toHaveBeenCalledWith(20);
});

it.each([
  [5, 10],
  [20, 50],
])("REQ-SRCH-010 amplia raio de %s para %s", async (radius, bigger) => {
  const onExpand = vi.fn();
  const { user } = renderWithProviders(
    <SearchResults
      query={searchQueryFixture({ radius })}
      items={[]}
      petCount={1}
      onMore={vi.fn()}
      onRetry={vi.fn()}
      onExpand={onExpand}
    />,
    { theme: quintalTheme },
  );
  await user.click(screen.getByRole("button", { name: `Bora olhar até ${bigger} km` }));
  expect(onExpand).toHaveBeenCalledWith(bigger);
});

it.each([searchQueryFixture({ radius: 50 }), searchQueryFixture({ where: "Curitiba" })])(
  "REQ-SRCH-010 sem raio maior oferece outras datas ou filtros",
  (query) => {
    renderWithProviders(
      <SearchResults query={query} items={[]} petCount={1} onMore={vi.fn()} onRetry={vi.fn()} onExpand={vi.fn()} />,
      { theme: quintalTheme },
    );
    expect(screen.getByText("Tenta outras datas ou tira um filtro.")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Bora olhar/ })).not.toBeInTheDocument();
  },
);

it.each([searchQueryFixture({ where: "Curitiba" }), searchQueryFixture({ radius: 50 })])(
  "096 lista preenchida não sugere trocar datas ou filtros",
  (query) => {
    renderWithProviders(
      <SearchResults
        query={query}
        items={[listingFixture(), listingFixture({ id: "second" })]}
        petCount={1}
        onMore={vi.fn()}
        onRetry={vi.fn()}
        onExpand={vi.fn()}
      />,
      { theme: quintalTheme },
    );
    expect(screen.queryByText("Tenta outras datas ou tira um filtro.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Bora olhar/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  },
);

it("096 fim de lista preenchida conserva a ampliação do raio", async () => {
  const onExpand = vi.fn();
  const { user } = renderWithProviders(
    <SearchResults
      query={searchQueryFixture({ radius: 10 })}
      items={[listingFixture()]}
      petCount={1}
      onMore={vi.fn()}
      onRetry={vi.fn()}
      onExpand={onExpand}
    />,
    { theme: quintalTheme },
  );
  await user.click(screen.getByRole("button", { name: "Bora olhar até 20 km" }));
  expect(onExpand).toHaveBeenCalledWith(20);
});
