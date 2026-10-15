import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders, createTestQueryClient } from "@/test/render";
import { petDto, petKeeperDto } from "@/test/fixtures/pets";
import { hostPetsSchema } from "../../../api/contracts";
import { toHouseResidents } from "../../../api/mappers";
import { petQueries } from "../../../api/queries";
import { HouseResidents } from "./HouseResidents";
it("REQ-HPETS-006/009 mostra lista sem ações nem detalhes privados", () => {
  const client = createTestQueryClient();
  client.setQueryData(
    petQueries.house("host-profile").queryKey,
    toHouseResidents(
      hostPetsSchema.parse({
        keeper: petKeeperDto,
        pets: [petDto({ microchip: "123456789012345", notes: "segredo" })],
      }),
    ),
  );
  const { container } = renderWithProviders(<HouseResidents hostId="host-profile" />, { queryClient: client });
  expect(screen.getByRole("heading", { name: "Quem mora aqui", level: 2 })).toBeVisible();
  expect(screen.getAllByRole("listitem")).toHaveLength(1);
  expect(screen.getByText("Thor")).toBeVisible();
  expect(screen.getByText("Cachorro · porte médio")).toBeVisible();
  expect(screen.getByText("Se dá bem com cachorro e crianças")).toBeVisible();
  expect(container.querySelector("img")).toHaveAttribute("alt", "");
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(container).not.toHaveTextContent("segredo");
  expect(container).not.toHaveTextContent("123456789012345");
});
it("REQ-HPETS-007 vazio não deixa título nem lista", () => {
  const client = createTestQueryClient();
  client.setQueryData(petQueries.house("empty").queryKey, []);
  const { container } = renderWithProviders(<HouseResidents hostId="empty" />, { queryClient: client });
  expect(container).toBeEmptyDOMElement();
});
