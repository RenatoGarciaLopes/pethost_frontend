import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMyApplication } from "@/features/host-applications/index.server";
import { getHostListingProfile, getMyListings } from "@/features/host-listings/index.server";
import { HostOnboardingPanel } from "./HostOnboardingPanel";

vi.mock("@/features/host-applications/index.server", () => ({ getMyApplication: vi.fn() }));
vi.mock("@/features/host-listings/index.server", () => ({ getHostListingProfile: vi.fn(), getMyListings: vi.fn() }));

describe("HostOnboardingPanel 099", () => {
  beforeEach(() => {
    vi.mocked(getMyApplication, { partial: true }).mockResolvedValue({ application: null });
    vi.mocked(getHostListingProfile, { partial: true }).mockResolvedValue({
      payoutsEnabled: true,
      stripeStatus: "enabled",
    });
  });

  it.each([
    [[], false],
    [[false], false],
    [[false, true], true],
  ])("cantinho aberto só com algum ativo: %j → %s", async (active, expected) => {
    vi.mocked(getMyListings, { partial: true }).mockResolvedValue({
      // Só isActive importa aqui; o resto do cantinho não participa da etapa.
      listings: active.map(
        (isActive) => ({ isActive }) as Awaited<ReturnType<typeof getMyListings>>["listings"][number],
      ),
    });
    const panel = await HostOnboardingPanel({ accountId: "host" });
    expect(panel.props.progress.hasListing).toBe(expected);
  });

  it("falha na leitura dos cantinhos mantém a etapa pendente", async () => {
    vi.mocked(getMyListings).mockRejectedValue(new Error("indisponível"));
    const panel = await HostOnboardingPanel({ accountId: "host" });
    expect(panel.props.progress.hasListing).toBe(false);
  });
});
