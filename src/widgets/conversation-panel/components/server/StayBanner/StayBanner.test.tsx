import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { StayBanner } from "./StayBanner";

describe("StayBanner", () => {
  it("REQ-CHAT-011 mostra o status e a frase da estadia", () => {
    renderWithProviders(<StayBanner status="Acontecendo" text="20 a 25 de dez. · Pipoca está na casa de Dona Cida" />, {
      theme: quintalTheme,
    });
    expect(screen.getByText("Acontecendo")).toBeInTheDocument();
    expect(screen.getByText("20 a 25 de dez. · Pipoca está na casa de Dona Cida")).toBeInTheDocument();
  });
});
