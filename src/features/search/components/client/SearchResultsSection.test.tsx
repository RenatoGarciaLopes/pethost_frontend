import { screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { listingFixture, searchPetsFixture, searchQueryFixture } from "@/test/fixtures/search";
import { searchQueries } from "../../api/queries";
import { SearchResultsSection } from "./SearchResultsSection";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(window.location.search) }));
// O MapLibre precisa de WebGL, que o jsdom não tem: o mapa em si é testado em SearchMap.test.tsx.
vi.mock("./SearchMap", () => ({
  SearchMap: ({ listings }: { listings: { id: string }[] }) => (
    <div role="region" aria-label="Mapa dos cantinhos">{`${listings.length} no mapa`}</div>
  ),
}));

function renderSection(query = searchQueryFixture()) {
  // A URL é a fonte da busca; a chave do cache vem dela.
  window.history.replaceState(null, "", query.where ? `/?where=${encodeURIComponent(query.where)}` : "/");
  const client = createTestQueryClient();
  client.setQueryData(searchQueries.infinite("owner", query, searchPetsFixture).queryKey, {
    pages: [{ items: [listingFixture()], page: 1, pageSize: 12, totalCount: 1 }],
    pageParams: [1],
  });
  return renderWithProviders(<SearchResultsSection accountId="owner" initialQuery={query} pets={searchPetsFixture} />, {
    queryClient: client,
    theme: quintalTheme,
  });
}

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

it("REQ-SRCH-013 busca com região mostra o botão Ver mapa, que abre o mapa em tela cheia com os cantinhos da lista", async () => {
  const { user } = renderSection(searchQueryFixture({ where: "Zona 7" }));
  expect(screen.queryByRole("region", { name: "Mapa dos cantinhos" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Ver mapa" }));
  expect(await screen.findByRole("region", { name: "Mapa dos cantinhos" })).toHaveTextContent("1 no mapa");
  await user.click(screen.getByRole("button", { name: "Ver lista" }));
  await waitFor(() => expect(screen.queryByRole("region", { name: "Mapa dos cantinhos" })).not.toBeInTheDocument());
});

it("REQ-SRCH-013 busca sem região não mostra mapa nem botão", () => {
  renderSection();
  expect(screen.queryByRole("button", { name: "Ver mapa" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Quintal da Cida/ })).toBeVisible();
});
