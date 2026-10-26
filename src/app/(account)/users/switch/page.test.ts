import { expect, it } from "vitest";
import { metadata } from "./page";

it("REQ-SWITCH-012 página identifica a troca e fica fora dos buscadores", () => {
  expect(metadata.title).toBe("Trocar de conta · PetHost");
  expect(metadata.robots).toMatchObject({ index: false });
});
