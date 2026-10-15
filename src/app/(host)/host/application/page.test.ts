import { expect, it, vi } from "vitest";
import { metadata } from "./page";

vi.mock("@/features/host-applications/index.server", () => ({ ApplicationStatusScreen: () => null }));
vi.mock("@/widgets/host-onboarding/index.server", () => ({ HostOnboardingPanel: () => null }));
vi.mock("@/shared/auth/server/requireRole", () => ({ requireRole: vi.fn() }));

it("REQ-HVER-001 título próprio e fora dos buscadores", () => {
  expect(metadata).toEqual({ title: "Minha verificação · PetHost", robots: { index: false, follow: false } });
});
