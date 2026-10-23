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
  expect(screen.queryByRole("link", { name: "Ver todos os cantinhos" })).not.toBeInTheDocument();
  expect(seen?.get("latitude")).toBe("-23.43");
  expect(seen?.get("longitude")).toBe("-51.94");
  expect(seen?.get("radiusKm")).toBe("10");
  expect(seen?.get("pageSize")).toBe("6");
});

it("REQ-NEARBY-012 permissão negada sem nenhum cantinho na reserva orienta a busca por cidade", async () => {
  server.use(
    http.get("*/api/listings", () => HttpResponse.json(apiOk({ items: [], page: 1, pageSize: 6, totalCount: 0 }))),
  );
  setup("denied");
  expect(await screen.findByText(/Sem a localização não dá para olhar por perto/)).toBeVisible();
  expect(screen.queryByRole("button", { name: "Usar minha localização" })).not.toBeInTheDocument();
});

it("REQ-NEARBY-013 falha de posição com a reserva fora do ar deixa tentar de novo", async () => {
  server.use(http.get("*/api/listings", () => apiError(503, "SERVICE_UNAVAILABLE")));
  const { user } = setup("failed");
  expect(await screen.findByText("Não conseguimos saber onde você está agora.")).toBeVisible();
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

it("REQ-NEARBY-015 sem cantinhos no raio nem na reserva explica e a falha da API deixa tentar de novo", async () => {
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

/** Raio vazio para quem manda coordenada; a reserva, sem lugar, devolve outras casas. Guarda o que cada chamada pediu. */
function radiusEmptyAllFull() {
  const seen: URLSearchParams[] = [];
  server.use(
    http.get("*/api/listings", ({ request }) => {
      const params = new URL(request.url).searchParams;
      seen.push(params);
      if (params.has("latitude")) return HttpResponse.json(apiOk({ items: [], page: 1, pageSize: 6, totalCount: 0 }));
      return HttpResponse.json(
        apiOk({
          items: [
            listingFixture({ distanceKm: undefined }),
            listingFixture({
              id: "0199d2a0-0000-7000-8000-000000000044",
              title: "Sítio do Leo",
              distanceKm: undefined,
            }),
          ],
          page: 1,
          pageSize: 6,
          totalCount: 9,
        }),
      );
    }),
  );
  return seen;
}

it("REQ-NEARBY-016 raio de 10 km vazio busca os cantinhos sem filtro de lugar e mostra os cards", async () => {
  const seen = radiusEmptyAllFull();
  setup("granted", point);
  expect(await screen.findByRole("heading", { name: "9 casas com vaga para conhecer" })).toBeVisible();
  expect(
    screen.getByText("Ainda não achamos cantinhos num raio de 10 km, então mostramos outras casas."),
  ).toBeVisible();
  expect(screen.getByRole("link", { name: /Sítio do Leo/ })).toBeVisible();
  expect(screen.queryByRole("link", { name: "Ver todos os cantinhos" })).not.toBeInTheDocument();
  expect(screen.queryByText(/Tente outra cidade na busca/)).not.toBeInTheDocument();
  // Primeiro o raio; depois a reserva só com a página, sem coordenada, raio nem lugar.
  expect(seen).toHaveLength(2);
  expect(seen[0]?.get("radiusKm")).toBe("10");
  expect([...seen[1]!.keys()]).toEqual(["pageSize"]);
  expect(seen[1]?.get("pageSize")).toBe("6");
});

it.each([
  [
    "denied",
    "Sem a sua localização, mostramos outras casas. Para olhar por perto, escreva a cidade ou o bairro na busca, no topo da página.",
  ],
  ["unavailable", "Este navegador não informa a localização, então mostramos outras casas."],
  ["failed", "Não conseguimos saber onde você está agora, então mostramos outras casas."],
] as const)(
  "REQ-NEARBY-017 sem posição (%s) também mostra os cantinhos sem filtro de lugar",
  async (status, reason) => {
    const seen = radiusEmptyAllFull();
    setup(status);
    expect(await screen.findByRole("heading", { name: "9 casas com vaga para conhecer" })).toBeVisible();
    expect(screen.getByText(reason)).toBeVisible();
    expect(screen.getByRole("link", { name: /Sítio do Leo/ })).toBeVisible();
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((params) => !params.has("latitude") && !params.has("radiusKm"))).toBe(true);
  },
);

it("REQ-NEARBY-017 com os cards da reserva após falha de posição, ainda dá para pedir a localização de novo", async () => {
  radiusEmptyAllFull();
  const { user } = setup("failed");
  await screen.findByRole("heading", { name: "9 casas com vaga para conhecer" });
  await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(geo.request).toHaveBeenCalledOnce();
});

it("REQ-NEARBY-019 com cantinhos no raio a reserva nunca é consultada", async () => {
  const seen: URLSearchParams[] = [];
  server.use(
    http.get("*/api/listings", ({ request }) => {
      seen.push(new URL(request.url).searchParams);
      return HttpResponse.json(apiOk({ items: [listingFixture()], page: 1, pageSize: 6, totalCount: 1 }));
    }),
  );
  setup("granted", point);
  expect(await screen.findByRole("heading", { name: "1 casa com vaga perto de você" })).toBeVisible();
  expect(screen.queryByText(/mostramos outras casas/)).not.toBeInTheDocument();
  expect(seen).toHaveLength(1);
  expect(seen[0]?.has("latitude")).toBe(true);
});

it("REQ-NEARBY-019 esperando o navegador a reserva também não é consultada", () => {
  // MSW estrito: qualquer chamada sem handler reprova o teste.
  setup("asking");
  expect(screen.getByRole("button", { name: "Esperando o navegador" })).toBeDisabled();
  expect(screen.queryByText(/mostramos outras casas/)).not.toBeInTheDocument();
});

it("REQ-NEARBY-019 reserva recusada (conta sem endereço) volta ao aviso de raio vazio, sem erro", async () => {
  server.use(
    http.get("*/api/listings", ({ request }) =>
      new URL(request.url).searchParams.has("latitude")
        ? HttpResponse.json(apiOk({ items: [], page: 1, pageSize: 6, totalCount: 0 }))
        : apiError(422, "LISTING_SEARCH_ADDRESS_REQUIRED"),
    ),
  );
  setup("granted", point, "owner-3");
  expect(await screen.findByText(/Ainda não achamos cantinhos num raio de 10 km. Tente outra cidade/)).toBeVisible();
  expect(screen.queryByText("Não conseguimos carregar os cantinhos agora.")).not.toBeInTheDocument();
});

it("REQ-SRCH-020 tutor com pet e datas vê o total e a compatibilidade nos cards; visitante nunca consulta", async () => {
  const asked: URLSearchParams[] = [];
  server.use(
    http.get("*/api/listings", () =>
      HttpResponse.json(apiOk({ items: [listingFixture()], page: 1, pageSize: 6, totalCount: 1 })),
    ),
    http.get("*/api/listings/:id/compatibility", ({ request }) => {
      asked.push(new URL(request.url).searchParams);
      return HttpResponse.json(
        apiOk({
          listingId: "0199d2a0-0000-7000-8000-000000000041",
          petId: "0199d2a0-0000-7000-8000-0000000000e1",
          petName: "Pipoca",
          matches: false,
          warnings: [{ code: "home_has_cats" }],
        }),
      );
    }),
  );
  geo.state = { status: "granted", coords: point };
  renderWithProviders(
    <NearbyListings
      scope="owner-1"
      pets={[{ id: "0199d2a0-0000-7000-8000-0000000000e1", name: "Pipoca" }]}
      from="2026-12-20"
      to="2026-12-25"
    />,
    { theme: quintalTheme },
  );
  expect(await screen.findByText("! Tem gato em casa")).toBeVisible();
  expect(screen.getByRole("link", { name: /Quintal da Cida/ }).textContent).toMatch(/R\$\s300,50 as 5 noites/);
  expect(asked[0]?.get("petId")).toBe("0199d2a0-0000-7000-8000-0000000000e1");
  expect(asked[0]?.get("checkIn")).toBe("2026-12-20");
});
