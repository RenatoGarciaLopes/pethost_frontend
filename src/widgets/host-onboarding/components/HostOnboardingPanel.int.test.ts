import { describe, expect, it, vi } from "vitest";
import { HostOnboardingPanel } from "./HostOnboardingPanel";

vi.mock("@/features/host-applications/index.server", () => ({ getMyApplication: vi.fn() }));
vi.mock("@/features/host-listings/index.server", () => ({ getHostListingProfile: vi.fn(), getMyListings: vi.fn() }));

import { getMyApplication } from "@/features/host-applications/index.server";
import { getHostListingProfile, getMyListings } from "@/features/host-listings/index.server";

describe("HostOnboardingPanel 099", () => {
  it.each([
    [[], false],
    [[false], false],
    [[true], true],
    [[false, true], true],
  ])("considera cantinho aberto em %j: %s", async (active, expected) => {
    vi.mocked(getMyApplication).mockResolvedValue({
      application: null,
      canStartNew: true,
      remainingAttempts: 3,
      noticeVersion: "2026-10-10",
    });
    vi.mocked(getHostListingProfile).mockResolvedValue({
      kind: "person",
      firstName: "Cida",
      address: null,
      payoutsEnabled: true,
      stripeStatus: "enabled",
    });
    vi.mocked(getMyListings, { partial: true }).mockResolvedValue({
      listings: active.map((isActive) => ({
        isActive,
        id: "listing-test",
        title: "Cantinho",
        nightlyRateCents: 6000,
        neighborhood: "Centro",
        city: "Maringá",
        photos: [],
        coverUrl: null,
        values: {
          homeType: "house",
          title: "Cantinho",
          description: "Casa com quintal",
          hasYard: true,
          hasDogs: false,
          hasCats: false,
          hasKids: false,
          acceptedSpecies: ["dog"],
          acceptsSmall: true,
          acceptsMedium: false,
          acceptsLarge: false,
          capacity: 1,
          address: {
            zipCode: "87020000",
            street: "Rua de teste",
            number: "1",
            complement: "",
            neighborhood: "Centro",
            city: "Maringá",
            state: "PR",
          },
          houseRules: "",
          availableWeekdays: ["monday"],
          nightlyRate: "60,00",
        },
      })),
    });
    const panel = await HostOnboardingPanel({ accountId: "test-host" });
    expect(panel.props.progress).toEqual({
      verified: true,
      payouts: { enabled: true, status: "enabled" },
      hasListing: expected,
    });
  });

  it("falha na leitura dos cantinhos mantém a etapa pendente", async () => {
    vi.mocked(getMyApplication).mockResolvedValue({
      application: null,
      canStartNew: true,
      remainingAttempts: 3,
      noticeVersion: "2026-10-10",
    });
    vi.mocked(getHostListingProfile).mockResolvedValue({
      kind: "person",
      firstName: "Cida",
      address: null,
      payoutsEnabled: true,
      stripeStatus: "enabled",
    });
    vi.mocked(getMyListings).mockRejectedValue(new Error("indisponível"));
    const panel = await HostOnboardingPanel({ accountId: "test-host" });
    expect(panel.props.progress.hasListing).toBe(false);
  });
});
