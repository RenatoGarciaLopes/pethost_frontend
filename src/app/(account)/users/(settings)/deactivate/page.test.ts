import { expect, it } from "vitest";
import { metadata } from "./page";
it("REQ-ACC-027 deactivate tem título próprio e não entra nos buscadores", () => {
  expect(metadata.title).toBe("Pausar a conta · PetHost");
  expect(metadata.robots).toEqual({ index: false, follow: false });
});
