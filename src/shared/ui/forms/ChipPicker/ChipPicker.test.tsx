import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../../test/render";
import { ChipPicker } from "./ChipPicker";
it("REQ-DS-014 chips inserem texto e indicam os selecionados", async () => {
  const pick = vi.fn();
  const { user } = renderWithProviders(
    <ChipPicker label="Atalhos" options={["Fogos", "Trovão"]} selected={["Trovão"]} onPick={pick} />,
  );
  expect(screen.getByRole("group", { name: "Atalhos" })).toBeVisible();
  expect(screen.getByRole("button", { name: /Trovão/ })).toHaveAttribute("aria-pressed", "true");
  await user.click(screen.getByRole("button", { name: /Fogos/ }));
  expect(pick).toHaveBeenCalledWith("Fogos");
});
it("REQ-DS-014 chips desabilitados não inserem texto", () => {
  renderWithProviders(<ChipPicker label="Atalhos" options={["Fogos"]} onPick={() => {}} disabled />);
  expect(screen.getByRole("button", { name: /Fogos/ })).toHaveAttribute("aria-disabled", "true");
});
