import { fireEvent, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { pickCalendarDays } from "@/test/calendar";
import { renderWithProviders } from "@/test/render";
import { searchPetsFixture, searchQueryFixture } from "@/test/fixtures/search";
import { SearchBar } from "./SearchBar";
it("REQ-SRCH-003/004 valida antes de buscar e permite escolher pets ativos", async () => {
  const onSearch = vi.fn();
  const { user } = renderWithProviders(
    <SearchBar
      query={searchQueryFixture({ from: "2026-10-14", to: "2026-10-17" })}
      pets={searchPetsFixture}
      today="2026-10-15"
      onSearch={onSearch}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Onde, datas e pet" }));
  const dialog = within(screen.getByRole("dialog"));
  await user.click(dialog.getByRole("button", { name: "Buscar" }));
  expect(onSearch).not.toHaveBeenCalled();
  expect(dialog.getByText("A chegada pode ser de hoje até 365 dias à frente.")).toBeVisible();
  await pickCalendarDays(user, dialog.getByLabelText("Chegada"), "2026-10-15", "2026-10-17");
  await user.click(dialog.getByLabelText("Luna"));
  await user.click(dialog.getByRole("button", { name: "Buscar" }));
  expect(onSearch).toHaveBeenCalledWith(
    expect.objectContaining({ pets: [searchPetsFixture[0]!.id], from: "2026-10-15", to: "2026-10-17" }),
  );
});
it("REQ-SRCH-003 conta sem pet pode buscar por quantidade", async () => {
  const onSearch = vi.fn();
  const { user } = renderWithProviders(
    <SearchBar query={searchQueryFixture()} pets={[]} today="2026-10-15" onSearch={onSearch} />,
  );
  await user.click(screen.getByRole("button", { name: "Onde, datas e pet" }));
  const dialog = within(screen.getByRole("dialog"));
  fireEvent.change(dialog.getByLabelText("Quantos pets vão?"), { target: { value: "2" } });
  await user.click(dialog.getByRole("button", { name: "Buscar" }));
  expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ count: 2 }));
});
