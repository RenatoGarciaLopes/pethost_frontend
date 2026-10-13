import { expect, it } from "vitest";
import { metadata } from "./page";
it("REQ-ACC-027 password tem título próprio e não entra nos buscadores", () => {
  expect(metadata.title).toBe("Trocar a senha · PetHost");
  expect(metadata.robots).toEqual({ index: false, follow: false });
});
