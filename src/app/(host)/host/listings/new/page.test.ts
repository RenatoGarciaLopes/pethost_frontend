import { expect, it, vi } from "vitest";
import { metadata } from "./page";

vi.mock("@/features/host-listings/index.server", () => ({ ListingDraftScreen: () => null }));
vi.mock("@/shared/auth/server/requireRole", () => ({ requireRole: vi.fn() }));

it("REQ-LIST-003 título próprio e fora dos buscadores", () => {
  expect(metadata).toEqual({ title: "Abrir meu cantinho · PetHost", robots: { index: false, follow: false } });
});
