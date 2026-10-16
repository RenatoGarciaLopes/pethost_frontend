import NextLink from "next/link";
import { expect, it } from "vitest";
import { quintalTheme } from "./createQuintalTheme";
import { quintalColors } from "./tokens/colors";
import { quintalRadiusCss, quintalRadii } from "./tokens/radii";

it("REQ-DS-001 expõe todos os tokens como variáveis CSS MUI", () => {
  for (const [name, value] of Object.entries(quintalColors)) {
    expect(quintalTheme.palette.quintal[name as keyof typeof quintalColors]).toBe(value);
    expect(quintalTheme.vars?.palette.quintal[name as keyof typeof quintalColors]).toContain(
      `--mui-palette-quintal-${name}`,
    );
  }
  expect(quintalTheme.palette.primary.contrastText).toBe(quintalColors.tinta);
});

it("REQ-DS-001 botão com href vira link do Next pelo tema (componente de servidor passa só o href)", () => {
  expect(quintalTheme.components?.MuiButtonBase?.defaultProps?.LinkComponent).toBe(NextLink);
});

it("REQ-UIC-001 expõe os raios sem multiplicação na extensão Quintal do tema", () => {
  expect(quintalRadii).toEqual({ control: 12, media: 16, field: 18, card: 24, pill: 999 });
  expect(quintalTheme.quintal.radius).toEqual(quintalRadiusCss);
  expect(quintalTheme.quintal.radius.card).toBe("24px");
  expect(quintalTheme.shape.borderRadius).toBe(18);
});
