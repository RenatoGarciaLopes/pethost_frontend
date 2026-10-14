import { expect, it } from "vitest";
import { metadata } from "./page";
it("REQ-PNEW-002 título do cadastro e fora dos buscadores", () => {
  expect(metadata).toEqual({ title: "Apresentar o pet · PetHost", robots: { index: false, follow: false } });
});
