import { expect, it } from "vitest";
import { quintalTypography } from "./typography";
it("REQ-DS-003 usa variáveis locais, display em h1–h4 e base 17px", () => {
  expect(quintalTypography.fontFamily).toContain("var(--font-body");
  expect(quintalTypography.fontSize).toBe(17);
  expect(quintalTypography.body1.fontSize).toBe("1.0625rem");
  for (const heading of ["h1", "h2", "h3", "h4"] as const)
    expect(quintalTypography[heading].fontFamily).toContain("var(--font-display");
});
