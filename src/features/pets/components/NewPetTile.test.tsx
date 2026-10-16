import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { NewPetTile } from "./NewPetTile";

it("REQ-UIC-002 presents the add-pet action inside the shared interactive surface", () => {
  renderWithProviders(<NewPetTile />);
  const link = screen.getByRole("link", { name: "Apresentar outro pet" });
  expect(link).toHaveAttribute("href", "/pets/new");
  expect(link.querySelector("[data-surface][data-interactive='true']")).toBeInTheDocument();
});
