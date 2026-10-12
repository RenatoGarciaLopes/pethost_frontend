import { screen } from "@testing-library/react";
import { useTheme } from "@mui/material/styles";
import { expect, it } from "vitest";
import { renderWithProviders } from "../../../test/render";
import { ThemeProviders } from "./ThemeProviders";
function Probe() {
  const theme = useTheme();
  return <output>{theme.palette.primary.contrastText}</output>;
}
it("REQ-DS-001 provider entrega tema Quintal e preserva filhos", () => {
  renderWithProviders(
    <ThemeProviders>
      <Probe />
    </ThemeProviders>,
  );
  expect(screen.getByRole("status")).toHaveTextContent("#1F1A17");
});
