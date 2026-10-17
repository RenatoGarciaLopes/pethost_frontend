import { expect, it, vi } from "vitest";

vi.mock("@/features/bookings/index.server", () => ({ RequestStayHostNotice: () => null }));
vi.mock("@/features/listing-page/index.server", () => ({ getListingPageDetail: vi.fn() }));
vi.mock("@/shared/auth/server/requirePersonalUser", () => ({ requirePersonalUser: vi.fn() }));

import { metadata } from "./page";

it("REQ-REQST-001 título próprio e fora dos buscadores", () => {
  expect(metadata).toEqual({ title: "Pedir estadia · PetHost", robots: { index: false, follow: false } });
});
