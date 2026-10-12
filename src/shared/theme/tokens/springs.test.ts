import { expect, it } from "vitest";
import { SPRING_ASSENTAR, SPRING_ACOLHER } from "./springs";
it("REQ-DS-008 preserva as curvas e durações oficiais", () => {
  expect(SPRING_ASSENTAR.duration).toBe(340);
  expect(SPRING_ACOLHER.duration).toBe(660);
  expect(SPRING_ASSENTAR.easing).toMatch(/^linear\(0, 0\.026,.*1\)$/);
  expect(SPRING_ACOLHER.easing).toContain("1.089");
});
