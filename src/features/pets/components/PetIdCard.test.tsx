import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { petDto } from "@/test/fixtures/pets";
import { renderWithProviders } from "@/test/render";
import { toPet } from "../api/mappers";
import { PetIdCard } from "./PetIdCard";

it("REQ-UIC-002 keeps the pet card link and uses the shared interactive surface", () => {
  renderWithProviders(<PetIdCard pet={toPet(petDto())} now={new Date("2026-10-15T12:00:00Z")} />, {
    theme: quintalTheme,
  });
  const link = screen.getByRole("link", { name: /Ficha de Thor/ });
  expect(link).toHaveAttribute("href", expect.stringContaining("/pets/"));
  expect(link.querySelector("[data-surface][data-interactive='true']")).toBeInTheDocument();
});
