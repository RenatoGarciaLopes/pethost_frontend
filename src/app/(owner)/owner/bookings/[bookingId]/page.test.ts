import { expect, it, vi } from "vitest";
import { metadata } from "./page";

vi.mock("@/features/bookings/index.server", () => ({ OwnerStayDetailScreen: () => null }));
vi.mock("@/shared/auth/server/requireRole", () => ({ requireRole: vi.fn() }));

it("REQ-STAYS-004 título próprio e fora dos buscadores", () => {
  expect(metadata).toEqual({ title: "Estadia · PetHost", robots: { index: false, follow: false } });
});
