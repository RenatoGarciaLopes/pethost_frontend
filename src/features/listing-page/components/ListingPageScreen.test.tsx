import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import type { ListingDetail } from "../api/contracts";
import { ListingPageScreen } from "./ListingPageScreen";

const listing = {
  id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c",
  hostId: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1d",
  host: {
    id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1d",
    name: "Casa Cida",
    avatarUrl: null,
    isCompany: false,
    isAvailable: true,
    payoutsEnabled: true,
  },
  title: "Quintal da Cida",
  description: "Um espaço calmo para brincar.",
  homeType: "house",
  hasYard: true,
  hasDogs: false,
  hasCats: true,
  hasKids: false,
  acceptedSpecies: ["dog", "cat"],
  acceptsSmall: true,
  acceptsMedium: false,
  acceptsLarge: true,
  capacity: 3,
  nightlyRate: 60.1,
  houseRules: "Sem subir no sofá.",
  availableWeekdays: ["monday", "friday"],
  address: { neighborhood: "Centro", city: "Curitiba", state: "PR" },
  photos: [{ id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1e", url: "/cover.webp", position: 1 }],
  isActive: true,
  deactivatedAt: null,
  createdAt: "2026-10-15T12:00:00Z",
  updatedAt: "2026-10-15T12:00:00Z",
  badges: ["yard"],
} as ListingDetail;

it("REQ-LPAGE-001/003/005 mostra conteúdo público sem rua e sinaliza cada pet escolhido", () => {
  renderWithProviders(
    <ListingPageScreen
      listing={listing}
      query={{ pets: ["pet-1", "pet-2"], from: "2026-10-15", to: "2026-10-20" }}
      requestSearch="from=2026-10-15&to=2026-10-20&pets=pet-1&pets=pet-2"
      selectedPets={[
        { id: "pet-1", name: "Luna", species: "dog", size: "small" },
        { id: "pet-2", name: "Piu", species: "parrot", size: null },
      ]}
      isOwner={false}
      accountRole="owner"
    />,
  );
  expect(screen.getByRole("heading", { name: "Quintal da Cida" })).toBeVisible();
  expect(screen.getByText("Centro, Curitiba · PR")).toBeVisible();
  expect(screen.getByText("O endereço chega quando a estadia for confirmada.")).toBeVisible();
  expect(screen.queryByText(/Rua/)).not.toBeInTheDocument();
  expect(screen.getByText("Combina com Luna")).toBeVisible();
  expect(screen.getByText("! Piu: esse cantinho não recebe papagaio")).toBeVisible();
  const href = screen.getByRole("link", { name: "Pedir estadia" }).getAttribute("href")!;
  const params = new URL(href, "http://test").searchParams;
  expect(params.get("from")).toBe("2026-10-15");
  expect(params.get("to")).toBe("2026-10-20");
  expect(params.getAll("pets")).toEqual(["pet-1", "pet-2"]);
  expect(screen.getByText(/601,00/)).toBeVisible();
  expect(screen.getByAltText("Foto 1 de Quintal da Cida")).toBeVisible();
});

it("REQ-LPAGE-003/006 só mostra a rua na visão verificada da pessoa anfitriã", () => {
  const withStreet = {
    ...listing,
    address: { ...listing.address, street: "Rua da Casa", number: "10" },
  } as ListingDetail;
  const { rerender } = renderWithProviders(
    <ListingPageScreen
      listing={withStreet}
      query={{ pets: [] }}
      requestSearch=""
      selectedPets={[]}
      isOwner={false}
      accountRole="owner"
    />,
  );
  expect(screen.queryByText("Rua da Casa, 10")).not.toBeInTheDocument();
  rerender(
    <ListingPageScreen
      listing={withStreet}
      query={{ pets: [] }}
      requestSearch=""
      selectedPets={[]}
      isOwner
      accountRole="host"
    />,
  );
  expect(screen.getByText("Rua da Casa, 10")).toBeVisible();
});

it("REQ-LPAGE-006/007 omite pedido para anfitrião dono e orienta outro anfitrião a trocar de conta", () => {
  const { rerender } = renderWithProviders(
    <ListingPageScreen
      listing={listing}
      query={{ pets: [] }}
      requestSearch=""
      selectedPets={[]}
      isOwner
      accountRole="host"
    />,
  );
  expect(screen.getByRole("status")).toHaveTextContent("É assim que os tutores veem seu cantinho (sem a rua)");
  expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute(
    "href",
    "/host/listings/0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c/edit",
  );
  expect(screen.queryByRole("link", { name: "Pedir estadia" })).not.toBeInTheDocument();
  rerender(
    <ListingPageScreen
      listing={listing}
      query={{ pets: [] }}
      requestSearch=""
      selectedPets={[]}
      isOwner={false}
      accountRole="host"
    />,
  );
  expect(screen.getByText("Pra pedir uma estadia, entra com a conta de tutor.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Trocar de conta" })).toHaveAttribute("href", "/users/switch");
});
