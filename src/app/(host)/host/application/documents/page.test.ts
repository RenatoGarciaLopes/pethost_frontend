import { expect, it, vi } from "vitest";
import { metadata } from "./page";

vi.mock("@/features/host-applications/index.server", () => ({ ApplicationWizardScreen: () => null }));
vi.mock("@/shared/auth/server/requireRole", () => ({ requireRole: vi.fn() }));

it("REQ-HVER-011 título próprio e fora dos buscadores", () => {
  expect(metadata).toEqual({ title: "Fotos da verificação · PetHost", robots: { index: false, follow: false } });
});
