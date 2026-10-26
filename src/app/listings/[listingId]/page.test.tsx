import { expect, it, vi } from "vitest";
import { Suspense } from "react";

const { getListingPageDetail, getSession } = vi.hoisted(() => ({
  getListingPageDetail: vi.fn(async () => ({ title: "Quintal tranquilo" })),
  getSession: vi.fn(async (): Promise<{ id: string; role: string } | null> => ({ id: "account-1", role: "owner" })),
}));
vi.mock("@/features/listing-page/index.server", () => ({
  getListingPageDetail,
  getListingPageContext: vi.fn(),
  getListingReviews: vi.fn(),
}));
vi.mock("@/shared/auth/server/getSession", () => ({ getSession }));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: vi.fn(async () => undefined),
}));

import ListingPage, { generateMetadata } from "./page";

const LISTING = "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c";

it("lets the route loading boundary handle pending listing data without a blank fallback", () => {
  const params = Promise.resolve({ listingId: LISTING });
  const page = ListingPage({ params, searchParams: Promise.resolve({}) });
  expect(page.type).not.toBe(Suspense);
  expect(page.props.params).toBe(params);
  expect(getSession).not.toHaveBeenCalled();
});

it("REQ-LPAGE-009 sets the listing title and excludes the page from indexing", async () => {
  const metadata = await generateMetadata({
    params: Promise.resolve({ listingId: LISTING }),
    searchParams: Promise.resolve({
      from: "2026-10-16",
      to: "2026-10-17",
      pets: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1e",
    }),
  });
  expect(metadata).toEqual({ title: "Quintal tranquilo · PetHost", robots: { index: false, follow: false } });
  expect(getSession).toHaveBeenCalledWith(
    `/listings/${LISTING}?pets=0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1e&from=2026-10-16&to=2026-10-17`,
  );
  expect(getListingPageDetail).toHaveBeenLastCalledWith("account-1", LISTING);
});

it("REQ-LPAGE-012 visitor (and admin) read the listing title in the visitor scope", async () => {
  for (const session of [null, { id: "admin-1", role: "admin" }]) {
    getSession.mockResolvedValueOnce(session);
    await generateMetadata({ params: Promise.resolve({ listingId: LISTING }), searchParams: Promise.resolve({}) });
    expect(getListingPageDetail).toHaveBeenLastCalledWith("visitor", LISTING);
  }
});
