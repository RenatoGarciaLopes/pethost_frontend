import { expect, it, vi } from "vitest";
import { metadata } from "./page";

vi.mock("@/features/host-listings/index.server", () => ({ ListingEditorScreen: () => null }));
vi.mock("@/shared/auth/server/requireRole", () => ({ requireRole: vi.fn() }));

it("REQ-LIST-013 título próprio e fora dos buscadores", () => {
  expect(metadata).toEqual({ title: "Meu cantinho · PetHost", robots: { index: false, follow: false } });
});
