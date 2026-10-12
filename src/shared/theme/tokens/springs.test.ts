import { expect, it } from "vitest";
import { MOTION_ACOLHER, MOTION_ASSENTAR, SPRING_ACOLHER, SPRING_ASSENTAR } from "./springs";

it("REQ-DS-008 preserva as curvas e durações oficiais", () => {
  expect(SPRING_ASSENTAR.duration).toBe(340);
  expect(SPRING_ACOLHER.duration).toBe(660);
  expect(SPRING_ASSENTAR.easing).toMatch(/^linear\(0, 0\.026,.*1\)$/);
  expect(SPRING_ACOLHER.easing).toContain("1.089");
});

/** Pico de uma mola subamortecida: e^(-ζπ/√(1-ζ²)), com ζ = 1 - bounce no Motion. */
const overshoot = (bounce: number) => {
  const damping = 1 - bounce;
  return damping >= 1 ? 0 : Math.exp((-damping * Math.PI) / Math.sqrt(1 - damping * damping));
};

it("REQ-DS-008 as molas do Motion têm a mesma duração e o mesmo quique das molas CSS", () => {
  expect(MOTION_ASSENTAR.visualDuration * 1000).toBe(SPRING_ASSENTAR.duration);
  expect(MOTION_ACOLHER.visualDuration * 1000).toBe(SPRING_ACOLHER.duration);
  expect(overshoot(MOTION_ASSENTAR.bounce)).toBe(0);
  // A curva CSS de acolher chega a 1.089: cerca de 9% além do alvo.
  expect(overshoot(MOTION_ACOLHER.bounce)).toBeCloseTo(0.089, 2);
});
