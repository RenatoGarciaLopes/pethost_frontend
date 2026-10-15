import { expect, it, vi } from "vitest";
import { metadata } from "./page";

vi.mock("@/features/bookings/index.server", () => ({ WaitingRequestsSummary: () => null }));
vi.mock("@/features/host-listings/index.server", () => ({ MyListingsSummary: () => null }));
vi.mock("@/widgets/host-onboarding/index.server", () => ({ HostOnboardingPanel: () => null }));
vi.mock("@/shared/auth/server/requireRole", () => ({ requireRole: vi.fn() }));

it("REQ-LIST-001 título próprio e fora dos buscadores", () => {
  expect(metadata).toEqual({ title: "Meu painel · PetHost", robots: { index: false, follow: false } });
});
