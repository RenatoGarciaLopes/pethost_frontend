import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import type { GeolocationStatus } from "@/shared/hooks/useGeolocation";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { listingFixture } from "@/test/fixtures/search";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { NearbyListings } from "./NearbyListings";

const geo = vi.hoisted(() => ({
  state: { status: "idle", coords: null as { latitude: number; longitude: number } | null },
  request: vi.fn(),
}));
vi.mock("@/shared/hooks/useGeolocation", () => ({ useGeolocation: () => ({ ...geo.state, request: geo.request }) }));

const point = { latitude: -23.43, longitude: -51.94 };
function setup(status: GeolocationStatus, coords: typeof point | null = null, scope = "visitor") {
  geo.state = { status, coords };
  geo.request.mockReset();
  return renderWithProviders(<NearbyListings scope={scope} />, { theme: quintalTheme });
}
const apiError = (status: number, code: string) =>
  HttpResponse.json(
    { success: false, error: { code, message: code }, timestamp: new Date().toISOString() },
    { status },
  );

it("REQ-NEARBY-010 antes do gesto só oferece o botão e não consulta a API", async () => {
  const hit = vi.fn();
  server.use(
    http.get(
      "*/api/listings",
      () => (hit(), HttpResponse.json(apiOk({ items: [], page: 1, pageSize: 6, totalCount: 0 }))),
    ),
  );
  const { user } = setup("idle");
  expect(screen.getByRole("heading", { name: "Casas com vaga perto de você" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Usar minha localização" }));
  expect(geo.request).toHaveBeenCalledOnce();
  expect(hit).not.toHaveBeenCalled();
});

it("REQ-NEARBY-011 com a posição, mostra a contagem e os cards sem pedir login", async () => {
  let seen: URLSearchParams | undefined;
  server.use(
    http.get("*/api/listings", ({ request }) => {
      seen = new URL(request.url).searchParams;
      return HttpResponse.json(
        apiOk({
          items: [
            listingFixture(),
            listingFixture({ id: "0199d2a0-0000-7000-8000-000000000043", title: "Varanda da Bia" }),
          ],
          page: 1,
          pageSize: 6,
          totalCount: 2,
        }),
      );
    }),
  );
  setup("granted", point);
  expect(await screen.findByRole("heading", { name: "2 casas com vaga perto de você" })).toBeVisible();
  expect(screen.getByRole("link", { name: /Varanda da Bia/ })).toBeVisible();
  expect(screen.getByRole("link", { name: "Ver todos os cantinhos" })).toHaveAttribute("href", "/search");
  expect(seen?.get("latitude")).toBe("-23.43");
  expect(seen?.get("longitude")).toBe("-51.94");
  expect(seen?.get("radiusKm")).toBe("10");
  expect(seen?.get("pageSize")).toBe("6");
});

it("REQ-NEARBY-012 permissão negada orienta a busca por cidade e não consulta", () => {
  setup("denied");
  expect(screen.getByText(/Sem a localização não dá para olhar por perto/)).toBeVisible();
  expect(screen.queryByRole("button", { name: "Usar minha localização" })).not.toBeInTheDocument();
});

it("REQ-NEARBY-013 falha de posição deixa tentar de novo", async () => {
  const { user } = setup("failed");
  expect(screen.getByText("Não conseguimos saber onde você está agora.")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(geo.request).toHaveBeenCalledOnce();
});

it("REQ-NEARBY-014 API ainda exigindo conta vira convite para entrar, sem erro na tela", async () => {
  server.use(http.get("*/api/listings", () => apiError(401, "UNAUTHORIZED")));
  setup("granted", point);
  expect(await screen.findByText("Entre para ver os cantinhos disponíveis.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
  expect(screen.queryByText("Não conseguimos carregar os cantinhos agora.")).not.toBeInTheDocument();
});

it("REQ-NEARBY-015 sem cantinhos no raio explica e a falha da API deixa tentar de novo", async () => {
  server.use(
    http.get("*/api/listings", () => HttpResponse.json(apiOk({ items: [], page: 1, pageSize: 6, totalCount: 0 }))),
  );
  const empty = setup("granted", point, "owner-1");
  expect(await screen.findByText(/Ainda não achamos cantinhos num raio de 10 km/)).toBeVisible();
  empty.unmount();
  server.use(http.get("*/api/listings", () => apiError(503, "SERVICE_UNAVAILABLE")));
  setup("granted", point, "owner-2");
  await waitFor(() => expect(screen.getByText("Não conseguimos carregar os cantinhos agora.")).toBeVisible());
  expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeVisible();
});
