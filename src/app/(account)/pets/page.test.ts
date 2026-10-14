import { expect, it, vi } from "vitest";
import { metadata } from "./page";

vi.mock("@/features/pets/index.server", () => ({ MyPetsScreen: () => null }));
vi.mock("@/shared/auth/server/requirePersonalUser", () => ({ requirePersonalUser: vi.fn() }));

it("REQ-PETS-010 título próprio e fora dos buscadores", () => {
  expect(metadata).toEqual({ title: "Meus pets · PetHost", robots: { index: false, follow: false } });
});
