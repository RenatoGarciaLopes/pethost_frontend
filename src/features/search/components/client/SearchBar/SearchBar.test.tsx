import { fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { searchPetsFixture, searchQueryFixture } from "@/test/fixtures/search";
import { SearchBar } from "./SearchBar";
it("REQ-SRCH-003/004 valida antes de buscar e permite escolher pets ativos", async () => {
  const onSearch = vi.fn();
  const { user } = renderWithProviders(
    <SearchBar query={searchQueryFixture()} pets={searchPetsFixture} today="2026-10-15" onSearch={onSearch} />,
  );
  await user.click(screen.getByRole("button", { name: "Onde, datas e pet" }));
  const dialog = screen;
  fireEvent.change(dialog.getByLabelText("Chegada"), { target: { value: "2026-10-14" } });
  fireEvent.change(dialog.getByLabelText("Saída"), { target: { value: "2026-10-17" } });
  await user.click(dialog.getByRole("button", { name: "Achar um cantinho" }));
  expect(onSearch).not.toHaveBeenCalled();
  expect(dialog.getByText("A chegada pode ser de hoje até 365 dias à frente.")).toBeVisible();
  fireEvent.change(dialog.getByLabelText("Chegada"), { target: { value: "2026-10-15" } });
  await user.click(dialog.getByRole("combobox", { name: "Pet" }));
  await user.click(dialog.getByRole("option", { name: "Luna" }));
  await user.keyboard("{Escape}");
  await user.click(dialog.getByRole("button", { name: "Achar um cantinho" }));
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
  const dialog = screen;
  await user.click(dialog.getByRole("combobox", { name: "Pet" }));
  await user.click(dialog.getByRole("option", { name: "2 pets" }));
  await user.click(dialog.getByRole("button", { name: "Achar um cantinho" }));
  expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ count: 2 }));
});
