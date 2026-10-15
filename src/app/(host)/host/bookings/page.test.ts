import { expect, it, vi } from "vitest";
import { metadata } from "./page";

vi.mock("@/features/bookings/index.server", () => ({ HostBookingsScreen: () => null }));
vi.mock("@/shared/auth/server/requireRole", () => ({ requireRole: vi.fn() }));

it("REQ-HREQ-001 título próprio e fora dos buscadores", () => {
  expect(metadata).toEqual({ title: "Pedidos e estadias · PetHost", robots: { index: false, follow: false } });
});
