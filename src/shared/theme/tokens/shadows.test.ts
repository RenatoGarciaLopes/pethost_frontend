import { expect, it } from "vitest";
import { hardShadow } from "./shadows";
it("REQ-DS-004 sombras duras têm deslocamento e zero blur", () => {
  for (const offset of [0, 3, 5, 8] as const) expect(hardShadow(offset)).toBe(`${offset}px ${offset}px 0 #1F1A17`);
});
