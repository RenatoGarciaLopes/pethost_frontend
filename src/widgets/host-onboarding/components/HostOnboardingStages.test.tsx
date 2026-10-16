import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { hostOnboardingCopy as copy } from "../lib/hostOnboardingCopy";
import { HostOnboardingStages } from "./HostOnboardingStages";

const items = () => within(screen.getByRole("region", { name: copy.heading })).getAllByRole("listitem");

describe("HostOnboardingStages", () => {
  it("REQ-HVER-001 antes da aprovação, só a verificação está liberada; as outras dizem o que falta", () => {
    renderWithProviders(<HostOnboardingStages progress={{ verified: false, payouts: null, hasListing: false }} />, {
      theme: quintalTheme,
    });
    const [first, second, third] = items();
    expect(first).toHaveAttribute("aria-current", "step");
    expect(within(first!).getByRole("link", { name: copy.stages.verification.action })).toHaveAttribute(
      "href",
      "/host/application",
    );
    expect(second).toHaveTextContent(copy.stages.payout.locked);
    expect(third).toHaveTextContent(copy.stages.listing.locked);
    expect(within(second!).queryByRole("link")).not.toBeInTheDocument();
  });

  it("REQ-LIST-001 recebimento liberado: a etapa 3 leva ao cadastro do cantinho", () => {
    renderWithProviders(
      <HostOnboardingStages
        progress={{ verified: true, payouts: { enabled: true, status: "enabled" }, hasListing: false }}
      />,
      { theme: quintalTheme },
    );
    const third = items()[2]!;
    expect(third).toHaveAttribute("aria-current", "step");
    expect(within(third).getByRole("link", { name: copy.stages.listing.action })).toHaveAttribute(
      "href",
      "/host/listings/new",
    );
    expect(items()[1]).toHaveTextContent(copy.states.done);
  });
});
