import { screen } from "@testing-library/react";
import { Button } from "@mui/material";
import { expect, it } from "vitest";
import { renderWithProviders } from "../../../test/render";
import { quintalTheme } from "../createQuintalTheme";

it("REQ-DS-004 botão tem contorno tinta e sombra dura", () => {
  renderWithProviders(<Button variant="contained">Continuar</Button>, { theme: quintalTheme });
  const styles = getComputedStyle(screen.getByRole("button", { name: "Continuar" }));
  expect(styles.borderWidth).toBe("2px");
  expect(styles.boxShadow).toContain("3px 3px 0");
  expect(styles.textTransform).toBe("none");
});
it("REQ-DS-007 primário tem 56px e quiet tem 48px", () => {
  renderWithProviders(
    <>
      <Button variant="contained">Continuar</Button>
      <Button variant="quiet">Voltar</Button>
    </>,
    { theme: quintalTheme },
  );
  expect(getComputedStyle(screen.getByRole("button", { name: "Continuar" })).minHeight).toBe("56px");
  expect(getComputedStyle(screen.getByRole("button", { name: "Voltar" })).minHeight).toBe("48px");
});
it("REQ-DS-006 permite foco pelo teclado", async () => {
  const { user } = renderWithProviders(<Button>Continuar</Button>, { theme: quintalTheme });
  await user.tab();
  expect(screen.getByRole("button")).toHaveFocus();
});
