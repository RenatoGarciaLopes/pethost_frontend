import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { hostOnboardingCopy as copy } from "../lib/hostOnboardingCopy";
import { HostOnboardingStages } from "./HostOnboardingStages";

const stages = () =>
  within(screen.getByRole("region", { name: copy.heading }))
    .getAllByRole("listitem")
    .map((item) => item.textContent);

describe("HostOnboardingStages", () => {
  it("REQ-HVER-001 antes da aprovação, só a verificação está liberada; as outras dizem o que falta", () => {
    renderWithProviders(<HostOnboardingStages verificationApproved={false} />, { theme: quintalTheme });
    expect(stages()).toEqual([
      `1Mostrar quem eu souAgora${copy.stages.verification.current}`,
      `2Como eu receboTravada${copy.stages.payout.locked}`,
      `3Montar meu cantinhoTravada${copy.stages.listing.locked}`,
    ]);
    expect(screen.getAllByRole("listitem")[0]).toHaveAttribute("aria-current", "step");
  });

  it("REQ-HVER-016 aprovada, a etapa 2 é liberada", () => {
    renderWithProviders(<HostOnboardingStages verificationApproved />, { theme: quintalTheme });
    expect(stages()).toEqual([
      `1Mostrar quem eu souPronta${copy.stages.verification.done}`,
      `2Como eu receboLiberada${copy.stages.payout.unlocked}`,
      `3Montar meu cantinhoTravada${copy.stages.listing.locked}`,
    ]);
    expect(screen.getAllByRole("listitem")[1]).toHaveAttribute("aria-current", "step");
  });
});
