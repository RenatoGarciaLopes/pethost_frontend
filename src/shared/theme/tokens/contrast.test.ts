import { expect, it } from "vitest";
import { contrastRatio } from "@/test/a11y/contrastRatio";
import { quintalColors as c } from "./colors";
import { sceneColors } from "./semantic";

it("REQ-DS-002 tinta sobre coral passa AA; branco sobre coral falha", () => {
  expect(contrastRatio(c.tinta, c.coral)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio("#FFFFFF", c.coral)).toBeLessThan(4.5);
});
it("REQ-DS-001 textos, erro e foco passam AA nos fundos usados", () => {
  for (const background of [c.papel, c.cartao, c.gema, c.grama, c.ceu, c.luz, sceneColors.ground]) {
    expect(contrastRatio(c.tinta, background)).toBeGreaterThanOrEqual(4.5);
  }
  for (const background of [c.papel, c.cartao]) expect(contrastRatio(c.texto2, background)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(c.erro, c.papel)).toBeGreaterThanOrEqual(4.5);
  for (const background of [c.papel, c.cartao, c.coral, c.gema, c.grama, c.ceu, c.luz]) {
    expect(contrastRatio(c.tinta, background)).toBeGreaterThanOrEqual(3);
  }
});
it("REQ-UIC-011 texto no rodapé de terra: tinta nas camadas claras, papel na terra funda", () => {
  for (const soil of [sceneColors.soilLight, sceneColors.soilMid, sceneColors.stone]) {
    expect(contrastRatio(c.tinta, soil)).toBeGreaterThanOrEqual(4.5);
  }
  expect(contrastRatio(c.papel, sceneColors.soilDeep)).toBeGreaterThanOrEqual(4.5);
});
