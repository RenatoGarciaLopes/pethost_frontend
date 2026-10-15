import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { listingFixture, searchPetsFixture, searchQueryFixture } from "@/test/fixtures/search";
import { ListingCard } from "./ListingCard";

it("REQ-SRCH-007 link único preserva datas/pets e mostra conta, selos e distância", () => {
  renderWithProviders(
    <ListingCard
      listing={listingFixture()}
      query={searchQueryFixture({ from: "2026-10-15", to: "2026-10-20", pets: searchPetsFixture.map((pet) => pet.id) })}
      petCount={2}
    />,
  );
  const link = screen.getByRole("link");
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(link.textContent).toMatch(/601,00 as 5 noites/);
  expect(link).toHaveTextContent("Casa Cida");
  expect(link).toHaveTextContent("a 1,4 km");
  for (const badge of ["Vizinho", "Responde rápido", "Casa com quintal", "Experiente"])
    expect(link).toHaveTextContent(badge);
  const href = new URL(link.getAttribute("href")!, "http://test");
  expect(href.searchParams.getAll("pets")).toEqual(searchPetsFixture.map((pet) => pet.id));
  expect(href.searchParams.get("from")).toBe("2026-10-15");
});
it("REQ-SRCH-007 sem período mostra diária por pet e sem distância não inventa uma", () => {
  renderWithProviders(
    <ListingCard
      listing={listingFixture({ distanceKm: null, coverPhotoUrl: "/photo.webp" })}
      query={searchQueryFixture()}
      petCount={1}
    />,
  );
  expect(screen.getByRole("link").textContent).toMatch(/60,10 a diária por pet/);
  expect(screen.queryByText(/km/)).not.toBeInTheDocument();
  expect(screen.getByAltText("Cantinho Quintal da Cida")).toBeVisible();
});
