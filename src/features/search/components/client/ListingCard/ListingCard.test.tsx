import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { listingFixture, searchPetsFixture, searchQueryFixture } from "@/test/fixtures/search";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { ListingCard } from "./ListingCard";

const pet = { id: searchPetsFixture[0]!.id, name: "Pipoca" };
const render = (ui: React.ReactElement) => renderWithProviders(ui, { theme: quintalTheme });
const compat = (data: { matches: boolean; warnings: { code: string }[] }) =>
  http.get("*/api/listings/:id/compatibility", () =>
    HttpResponse.json(
      apiOk({
        listingId: "0199d2a0-0000-7000-8000-000000000041",
        petId: pet.id,
        petName: "Pipoca",
        guests: null,
        ...data,
      }),
    ),
  );

it("REQ-SRCH-007 link único preserva datas/pets e mostra total, diária, bairro com distância e atributos", () => {
  render(
    <ListingCard
      listing={listingFixture()}
      query={searchQueryFixture({ from: "2026-10-15", to: "2026-10-20", pets: searchPetsFixture.map((p) => p.id) })}
      petCount={2}
    />,
  );
  expect(screen.getAllByRole("link")).toHaveLength(1);
  const link = screen.getByRole("link");
  expect(link.textContent).toMatch(/R\$\s601,00 as 5 noites · R\$\s60,10\/noite/);
  expect(screen.getByRole("heading", { name: "Quintal da Cida" })).toBeVisible();
  expect(link).toHaveTextContent("Zona 7 · 1,4 km de você");
  for (const text of ["Casa", "Quintal", "Responde rápido", "Experiente"]) expect(link).toHaveTextContent(text);
  expect(link).toHaveTextContent("Casa Cida");
  const href = new URL(link.getAttribute("href")!, "http://test");
  expect(href.searchParams.getAll("pets")).toEqual(searchPetsFixture.map((p) => p.id));
  expect(href.searchParams.get("from")).toBe("2026-10-15");
});

it("REQ-SRCH-007 sem período mostra só a diária; sem distância usa a cidade; sem foto avisa", () => {
  render(<ListingCard listing={listingFixture({ distanceKm: null })} query={searchQueryFixture()} petCount={1} />);
  const link = screen.getByRole("link");
  expect(link.textContent).toMatch(/R\$\s60,10\/noite/);
  expect(link.textContent).not.toMatch(/noites/);
  expect(link).toHaveTextContent("Zona 7 · Maringá");
  expect(screen.getByText("Cantinho sem foto")).toBeVisible();
});

it("REQ-SRCH-007 com foto mostra a imagem e o anfitrião com iniciais quando não há avatar", () => {
  render(
    <ListingCard
      listing={listingFixture({ coverPhotoUrl: "/photo.webp" })}
      query={searchQueryFixture()}
      petCount={0}
    />,
  );
  expect(screen.getByAltText("Cantinho Quintal da Cida")).toBeVisible();
  expect(screen.getByText("CC")).toBeVisible();
});

it("REQ-SRCH-021 nota só aparece com avaliação, com uma casa decimal e contagem", () => {
  const { unmount } = render(
    <ListingCard
      listing={listingFixture({ rating: { average: 5, count: 4 } })}
      query={searchQueryFixture()}
      petCount={0}
    />,
  );
  expect(screen.getByLabelText("Nota 5,0 em 4 avaliações")).toHaveTextContent("★ 5,0 (4)");
  unmount();
  render(<ListingCard listing={listingFixture()} query={searchQueryFixture()} petCount={0} />);
  expect(screen.queryByText(/★/)).not.toBeInTheDocument();
});

it("REQ-SRCH-021 Vizinho vira selo na foto e os demais selos viram atributos; sem selos, sem linha", () => {
  const { unmount } = render(
    <ListingCard
      listing={listingFixture({ badges: ["neighbor", "well_rated"], hasYard: false, homeType: "apartment" })}
      query={searchQueryFixture()}
      petCount={0}
    />,
  );
  expect(screen.getByText("Vizinho")).toBeVisible();
  expect(screen.getByText("Bem avaliado")).toBeVisible();
  expect(screen.getByText("Apartamento")).toBeVisible();
  expect(screen.queryByText("Quintal")).not.toBeInTheDocument();
  unmount();
  render(
    <ListingCard
      listing={listingFixture({ badges: [], hasYard: false, homeType: null })}
      query={searchQueryFixture()}
      petCount={0}
    />,
  );
  expect(screen.queryByText("Vizinho")).not.toBeInTheDocument();
  expect(screen.queryByText("Responde rápido")).not.toBeInTheDocument();
});

it("REQ-SRCH-020 sem pet escolhido (visitante) não consulta nem mostra compatibilidade", () => {
  // MSW estrito: chamada sem handler reprova o teste.
  render(<ListingCard listing={listingFixture()} query={searchQueryFixture()} petCount={0} />);
  expect(screen.queryByText(/Combina com/)).not.toBeInTheDocument();
});

it("REQ-SRCH-020 pet sem avisos mostra o chip verde Combina e manda pet e datas à API", async () => {
  let seen: URLSearchParams | undefined;
  server.use(
    http.get("*/api/listings/:id/compatibility", ({ request }) => {
      seen = new URL(request.url).searchParams;
      return HttpResponse.json(
        apiOk({
          listingId: "0199d2a0-0000-7000-8000-000000000041",
          petId: pet.id,
          petName: "Pipoca",
          matches: true,
          warnings: [],
        }),
      );
    }),
  );
  render(
    <ListingCard
      listing={listingFixture()}
      query={searchQueryFixture({ from: "2026-10-15", to: "2026-10-20" })}
      petCount={1}
      compatibility={{ accountId: "owner-1", pets: [pet] }}
    />,
  );
  expect(await screen.findByText("✓ Combina com a Pipoca")).toBeVisible();
  expect(seen?.get("petId")).toBe(pet.id);
  expect(seen?.get("checkIn")).toBe("2026-10-15");
  expect(seen?.get("checkOut")).toBe("2026-10-20");
});

it("REQ-SRCH-020 aviso vira chip tracejado com o texto do código", async () => {
  server.use(compat({ matches: false, warnings: [{ code: "home_has_cats" }] }));
  render(
    <ListingCard
      listing={listingFixture()}
      query={searchQueryFixture()}
      petCount={0}
      compatibility={{ accountId: "owner-1", pets: [pet] }}
    />,
  );
  expect(await screen.findByText("! Tem gato em casa")).toBeVisible();
  expect(screen.queryByText(/Combina com/)).not.toBeInTheDocument();
});

it("REQ-SRCH-020 falha da compatibilidade não mostra chip nem derruba o card", async () => {
  server.use(
    http.get("*/api/listings/:id/compatibility", () =>
      HttpResponse.json(
        { success: false, error: { code: "X", message: "x" }, timestamp: new Date().toISOString() },
        { status: 500 },
      ),
    ),
  );
  render(
    <ListingCard
      listing={listingFixture()}
      query={searchQueryFixture()}
      petCount={0}
      compatibility={{ accountId: "owner-1", pets: [pet] }}
    />,
  );
  expect(await screen.findByRole("heading", { name: "Quintal da Cida" })).toBeVisible();
  expect(screen.queryByText(/Combina com|!/)).not.toBeInTheDocument();
});
