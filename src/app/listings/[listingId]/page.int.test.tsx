import { isValidElement, type ReactElement, type ReactNode } from "react";
import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, expect, it, vi } from "vitest";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { listingDetailFixture } from "@/test/fixtures/listingPage";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import ListingPage from "./page";

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: vi.fn(async () => undefined),
}));
// Visitante: nenhum cookie de sessão.
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers(),
}));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/listings",
}));

const listing = listingDetailFixture();

async function resolveListingContent(search: Record<string, string> = {}) {
  const page = ListingPage({
    params: Promise.resolve({ listingId: listing.id }),
    searchParams: Promise.resolve(search),
  });
  const content = page as ReactElement;
  const renderContent = content.type as (props: typeof content.props) => Promise<ReactNode>;
  const resolved = await renderContent(content.props);
  if (!isValidElement(resolved)) throw new Error("ListingPageContent não retornou uma composição React.");
  return resolved;
}

afterEach(() => getQueryClient().clear());

it("REQ-LPAGE-012 visitante abre o cantinho sem login, sem o que exige conta, e pedir leva ao login com as datas", async () => {
  const calls: string[] = [];
  server.use(
    http.get("http://api.test/api/v1/listings/:id", ({ request }) => {
      calls.push(`detail auth=${request.headers.get("authorization")}`);
      return HttpResponse.json(apiOk(listing));
    }),
    http.get("http://api.test/api/v1/reviews", () => {
      calls.push("reviews");
      return HttpResponse.json(apiOk({ items: [], page: 1, pageSize: 4, totalCount: 0 }));
    }),
  );

  const content = await resolveListingContent({ where: "Zona 7", from: "2026-12-20", to: "2026-12-22" });
  // Sem sessão: nada de /users/me, pets do tutor, pets da casa, compatibilidade ou /hosts/me.
  expect(calls.sort()).toEqual(["detail auth=null", "reviews"]);

  renderWithProviders(content, { theme: quintalTheme });
  expect(screen.getByRole("heading", { level: 1, name: listing.title })).toBeVisible();
  expect(within(screen.getByRole("banner")).getByRole("link", { name: "Entrar" })).toBeVisible();
  expect(screen.queryByRole("group", { name: "Quem vai se hospedar" })).not.toBeInTheDocument();
  expect(screen.getByLabelText("Chegada e saída")).toBeVisible();

  for (const link of screen.getAllByRole("link", { name: "Pedir estadia" })) {
    const url = new URL(link.getAttribute("href")!, "http://test");
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("as")).toBe("owner");
    const next = new URL(url.searchParams.get("next")!, "http://test");
    expect(next.pathname).toBe(`/listings/${listing.id}`);
    expect(next.searchParams.get("from")).toBe("2026-12-20");
    expect(next.searchParams.get("to")).toBe("2026-12-22");
    expect(next.searchParams.get("where")).toBe("Zona 7");
  }
});
