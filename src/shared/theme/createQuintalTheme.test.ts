import { expect, it } from "vitest";
import { quintalTheme } from "./createQuintalTheme";
import { quintalColors } from "./tokens/colors";

it("REQ-DS-001 expõe todos os tokens como variáveis CSS MUI", () => {
  for (const [name, value] of Object.entries(quintalColors)) {
    expect(quintalTheme.palette.quintal[name as keyof typeof quintalColors]).toBe(value);
    expect(quintalTheme.vars?.palette.quintal[name as keyof typeof quintalColors]).toContain(
      `--mui-palette-quintal-${name}`,
    );
  }
  expect(quintalTheme.palette.primary.contrastText).toBe(quintalColors.tinta);
});
