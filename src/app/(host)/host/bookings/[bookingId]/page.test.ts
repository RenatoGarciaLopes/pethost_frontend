import { expect, it, vi } from "vitest";
import { metadata } from "./page";

vi.mock("@/features/bookings/index.server", () => ({ HostBookingDetailScreen: () => null, getBookingDetail: vi.fn() }));
vi.mock("@/widgets/booking-pet-profiles", () => ({ BookingPetProfiles: () => null }));
vi.mock("@/shared/auth/server/requireRole", () => ({ requireRole: vi.fn() }));

it("REQ-HREQ-003 título próprio e fora dos buscadores", () => {
  expect(metadata).toEqual({ title: "Pedido · PetHost", robots: { index: false, follow: false } });
});
