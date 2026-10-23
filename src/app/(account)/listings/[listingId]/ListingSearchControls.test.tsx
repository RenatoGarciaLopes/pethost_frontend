import { fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { ListingSearchControls } from "./ListingSearchControls";

it("REQ-LPAGE-004 abre os campos existentes da busca e preserva datas e pets na URL", async () => {
  renderWithProviders(
    <ListingSearchControls
      listingId="listing-1"
      today="2026-10-15"
      query={{ pets: [], species: [], sizes: [] }}
      pets={[{ id: "pet-1", name: "Luna", species: "dog", size: "small" }]}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Escolher datas e pets" }));
  fireEvent.change(screen.getByLabelText("Chegada"), { target: { value: "2026-10-16" } });
  fireEvent.change(screen.getByLabelText("Saída"), { target: { value: "2026-10-17" } });
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Pet" }));
  fireEvent.click(screen.getByRole("option", { name: "Luna" }));
  fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });
  fireEvent.click(screen.getByRole("button", { name: "Achar um cantinho" }));
  expect(push).toHaveBeenCalledWith("/listings/listing-1?pets=pet-1&from=2026-10-16&to=2026-10-17");
});
