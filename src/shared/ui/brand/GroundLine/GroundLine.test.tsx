import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { GroundLine } from "./GroundLine";

it("REQ-UIC-007 topo ondulado prolonga o gramado sem contorno reto inferior", () => {
  const { container } = renderWithProviders(<GroundLine variant="wave" />, { theme: quintalTheme });
  const svg = container.querySelector("svg")!;
  expect(svg).toHaveAttribute("aria-hidden", "true");
  expect(svg).toHaveStyle(`--ground: ${quintalTheme.palette.scene.ground}`);
  expect(svg.querySelector('path[fill="none"]')).toHaveAttribute("d", expect.stringMatching(/^M0 .*C.*[^Z]$/));
  expect(svg.querySelector('path[stroke="none"]')).toHaveAttribute("d", expect.stringMatching(/V28H0Z$/));
});

it("REQ-DS-015 faixa padrão conserva grama de marca e permite remover tufinhos", () => {
  const { container } = renderWithProviders(<GroundLine tufts={false} />, { theme: quintalTheme });
  expect(container.querySelector("svg")).toHaveStyle(`--ground: ${quintalTheme.palette.quintal.grama}`);
  expect(container.querySelectorAll("path")).toHaveLength(1);
  expect(container.querySelector("path")).toHaveAttribute("stroke", "var(--ink)");
});
