import { fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { pickCalendarDays } from "@/test/calendar";
import { renderWithProviders } from "@/test/render";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { ListingSearchControls } from "./ListingSearchControls";

it("REQ-LPAGE-004 abre os campos existentes da busca e preserva datas e pets na URL", async () => {
  const { user } = renderWithProviders(
    <ListingSearchControls
      listingId="listing-1"
      today="2026-10-15"
      query={{ pets: [], species: [], sizes: [] }}
      pets={[{ id: "pet-1", name: "Luna", species: "dog", size: "small" }]}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Escolher datas e pets" }));
  await pickCalendarDays(user, screen.getByLabelText("Chegada e saída"), "2026-10-16", "2026-10-17");
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Pet" }));
  fireEvent.click(screen.getByRole("option", { name: "Luna" }));
  fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });
  fireEvent.click(screen.getByRole("button", { name: "Achar um cantinho" }));
  expect(push).toHaveBeenCalledWith("/listings/listing-1?pets=pet-1&from=2026-10-16&to=2026-10-17");
});
