import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Surface } from "./Surface";

it("REQ-UIC-002 renders a semantic paper surface with ink border and hard shadow", () => {
  render(
    <Surface component="article" elevation="md">
      Resumo
    </Surface>,
  );
  const surface = screen.getByRole("article");
  expect(surface).toHaveAttribute("data-surface");
  expect(surface).toHaveStyle({ borderRadius: "24px" });
  expect(surface).toHaveStyle({ boxShadow: /5px 5px 0/ });
});

it("REQ-UIC-002 marks interactive surfaces for hover and press styling", () => {
  render(<Surface interactive>Cartão</Surface>);
  expect(screen.getByText("Cartão")).toHaveAttribute("data-interactive", "true");
});
