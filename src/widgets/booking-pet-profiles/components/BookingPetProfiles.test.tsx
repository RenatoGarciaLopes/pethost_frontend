import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { PIPOCA_ID, THOR_ID } from "@/test/fixtures/bookings";
import { petDto } from "@/test/fixtures/pets";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { BookingPetProfiles } from "./BookingPetProfiles";

const pets = [
  { id: PIPOCA_ID, name: "Pipoca" },
  { id: THOR_ID, name: "Thor" },
];

describe("BookingPetProfiles", () => {
  it("REQ-HREQ-003 a ficha completa de cada pet do pedido, lida de GET /pets/{id}", async () => {
    server.use(
      http.get(`*/api/pets/${PIPOCA_ID}`, () =>
        HttpResponse.json(apiOk(petDto({ id: PIPOCA_ID, name: "Pipoca", vetContact: "Dra. Ana 44 99999-0000" }))),
      ),
      http.get(`*/api/pets/${THOR_ID}`, () => HttpResponse.json(apiOk(petDto({ id: THOR_ID, name: "Thor" })))),
    );
    renderWithProviders(<BookingPetProfiles accountId="account-1" pets={pets} />, { theme: quintalTheme });
    const pipoca = await screen.findByRole("article", { name: "Carteirinha de Pipoca" });
    for (const block of ["Saúde", "Rotina e manias", "Convivência"])
      expect(within(pipoca).getByRole("heading", { name: block })).toBeInTheDocument();
    expect(within(pipoca).getByText("Dra. Ana 44 99999-0000")).toBeInTheDocument();
    expect(await screen.findByRole("article", { name: "Carteirinha de Thor" })).toBeInTheDocument();
  });

  it("REQ-HREQ-003 ficha que falha não impede o resto e diz qual pet", async () => {
    server.use(
      http.get(`*/api/pets/${PIPOCA_ID}`, () => HttpResponse.json(apiFail("PET_NOT_FOUND"), { status: 404 })),
      http.get(`*/api/pets/${THOR_ID}`, () => HttpResponse.json(apiOk(petDto({ id: THOR_ID, name: "Thor" })))),
    );
    renderWithProviders(<BookingPetProfiles accountId="account-1" pets={pets} />, { theme: quintalTheme });
    expect(await screen.findByText("Não deu pra abrir a ficha de Pipoca agora.")).toBeInTheDocument();
    expect(await screen.findByRole("article", { name: "Carteirinha de Thor" })).toBeInTheDocument();
  });
});
