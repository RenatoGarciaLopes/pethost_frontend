import { act, screen, waitFor } from "@testing-library/react";
import { useSyncExternalStore } from "react";
import { http, HttpResponse } from "msw";
import { afterEach, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { apiOk } from "@/test/fixtures/session";
import { listingFixture, searchPetsFixture, searchQueryFixture } from "@/test/fixtures/search";
import { server } from "@/test/msw/server";
import { searchQueries } from "../../../api/queries";
import { SearchResultsSection } from "../SearchResultsSection";

vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams(
      useSyncExternalStore(
        (callback) => {
          window.addEventListener("popstate", callback);
          return () => window.removeEventListener("popstate", callback);
        },
        () => window.location.search,
      ),
    ),
}));

const initialQuery = searchQueryFixture();
const first = listingFixture();
const second = listingFixture({ id: "0199d2a0-0000-7000-8000-000000000043", title: "Varanda da Bia" });
function page(items = [first], number = 1, total = items.length) {
  return { items, page: number, pageSize: 1, totalCount: total };
}
function renderSearch(total = 1) {
  window.history.replaceState(null, "", "/");
  const push = window.history.pushState.bind(window.history);
  vi.spyOn(window.history, "pushState").mockImplementation((...args) => {
    push(...args);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  const client = createTestQueryClient();
  client.setQueryData(searchQueries.infinite("owner", initialQuery, searchPetsFixture).queryKey, {
    pages: [page([first], 1, total)],
    pageParams: [1],
  });
  return renderWithProviders(
    <SearchResultsSection accountId="owner" initialQuery={initialQuery} pets={searchPetsFixture} />,
    { queryClient: client, theme: quintalTheme },
  );
}
afterEach(() => {
  window.history.replaceState(null, "", "/");
});

it("REQ-SRCH-006/008 mantém lista enquanto filtra, escreve URL e troca pela resposta", async () => {
  let resolve!: () => void;
  const gate = new Promise<void>((done) => {
    resolve = done;
  });
  let observed: URL | undefined;
  server.use(
    http.get("http://localhost:3000/api/listings", async ({ request }) => {
      observed = new URL(request.url);
      await gate;
      return HttpResponse.json(apiOk(page([second])));
    }),
  );
  const { user } = renderSearch();
  await user.click(screen.getByRole("button", { name: "Casa com quintal" }));
  expect(window.location.search).toContain("hasYard=true");
  expect(screen.getByRole("link", { name: /Quintal da Cida/ })).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("Farejando cantinhos…");
  await waitFor(() => expect(observed?.searchParams.get("hasYard")).toBe("true"));
  await act(async () => resolve());
  expect(await screen.findByRole("link", { name: /Varanda da Bia/ })).toBeVisible();
  expect(screen.queryByRole("link", { name: /Quintal da Cida/ })).not.toBeInTheDocument();
});

it("REQ-SRCH-009 mostrar mais acumula e manda page 2", async () => {
  let observed: URL | undefined;
  server.use(
    http.get("http://localhost:3000/api/listings", ({ request }) => {
      observed = new URL(request.url);
      return HttpResponse.json(apiOk(page([second], 2, 2)));
    }),
  );
  const { user } = renderSearch(2);
  await user.click(screen.getByRole("button", { name: "Mostrar mais cantinhos" }));
  expect(await screen.findByRole("link", { name: /Varanda da Bia/ })).toBeVisible();
  expect(screen.getByRole("link", { name: /Quintal da Cida/ })).toBeVisible();
  expect(observed?.searchParams.get("page")).toBe("2");
  expect(screen.queryByRole("button", { name: "Mostrar mais cantinhos" })).not.toBeInTheDocument();
});

it("REQ-SRCH-011 erro de endereço oferece perfil e cidade mantendo a lista", async () => {
  server.use(
    http.get("http://localhost:3000/api/listings", () =>
      HttpResponse.json(
        {
          success: false,
          error: { code: "LISTING_SEARCH_ADDRESS_REQUIRED", message: "private backend message" },
          timestamp: new Date().toISOString(),
        },
        { status: 422 },
      ),
    ),
  );
  const { user } = renderSearch();
  await user.click(screen.getByRole("button", { name: "Sem criança" }));
  expect(await screen.findByText("Pra procurar perto de casa, a gente precisa do seu endereço.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Conferir meu endereço" })).toHaveAttribute("href", "/users/profile");
  expect(screen.getByRole("link", { name: "Procurar por cidade" })).toHaveAttribute("href", "#search-fields");
  expect(screen.getByRole("link", { name: /Quintal da Cida/ })).toBeVisible();
  expect(screen.queryByText("private backend message")).not.toBeInTheDocument();
});

it("REQ-SRCH-012 503 mantém cards e repetir busca funciona", async () => {
  let failed = true;
  server.use(
    http.get("http://localhost:3000/api/listings", () =>
      failed
        ? HttpResponse.json(
            {
              success: false,
              error: { code: "LISTING_GEOCODER_UNAVAILABLE", message: "unavailable" },
              timestamp: new Date().toISOString(),
            },
            { status: 503 },
          )
        : HttpResponse.json(apiOk(page([second]))),
    ),
  );
  const { user } = renderSearch();
  await user.click(screen.getByRole("button", { name: "Sem gato" }));
  await screen.findByRole("button", { name: "Tentar de novo" });
  expect(screen.getByRole("link", { name: /Quintal da Cida/ })).toBeVisible();
  failed = false;
  await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(await screen.findByRole("link", { name: /Varanda da Bia/ })).toBeVisible();
});

it("REQ-SRCH-012 400 mostra o erro do campo Onde junto dos chips", async () => {
  server.use(
    http.get("http://localhost:3000/api/listings", () =>
      HttpResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "invalid",
            details: [{ field: "City", messages: ["invalid city"] }],
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      ),
    ),
  );
  const { user } = renderSearch();
  await user.click(screen.getByRole("button", { name: "Casa" }));
  await screen.findByRole("button", { name: "Tentar de novo" });
  expect(screen.getByText("Onde: Confere esse filtro e busca de novo.")).toBeVisible();
});

it("REQ-SRCH-002 histórico restaura o filtro e recarregar usa o mesmo parser", async () => {
  server.use(http.get("http://localhost:3000/api/listings", () => HttpResponse.json(apiOk(page([second])))));
  const { user } = renderSearch();
  await user.click(screen.getByRole("button", { name: "Sem cachorro" }));
  await screen.findByRole("link", { name: /Varanda da Bia/ });
  await act(async () => {
    window.history.replaceState(null, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  expect(screen.getByRole("button", { name: "Sem cachorro" })).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByRole("link", { name: /Quintal da Cida/ })).toBeVisible();
});
