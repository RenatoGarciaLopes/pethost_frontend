import { expect, it, vi } from "vitest";

const { getListingPageDetail, requirePersonalUser } = vi.hoisted(() => ({
  getListingPageDetail: vi.fn(async () => ({ title: "Quintal tranquilo" })),
  requirePersonalUser: vi.fn(async () => ({ id: "account-1", role: "owner" as const })),
}));
vi.mock("@/features/listing-page/index.server", () => ({ getListingPageDetail, getListingPageContext: vi.fn() }));
vi.mock("@/shared/auth/server/requirePersonalUser", () => ({ requirePersonalUser }));

import { generateMetadata } from "./page";

it("REQ-LPAGE-009 sets the listing title and excludes the private page from indexing", async () => {
  const metadata = await generateMetadata({
    params: Promise.resolve({ listingId: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c" }),
    searchParams: Promise.resolve({
      from: "2026-10-16",
      to: "2026-10-17",
      pets: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1e",
    }),
  });
  expect(metadata).toEqual({ title: "Quintal tranquilo · PetHost", robots: { index: false, follow: false } });
  expect(requirePersonalUser).toHaveBeenCalledWith(
    "/listings/0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c?pets=0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1e&from=2026-10-16&to=2026-10-17",
  );
});
