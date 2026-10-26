import { describe, expect, it } from "vitest";
import { hostOnboardingCopy as copy } from "./hostOnboardingCopy";
import { hostStages } from "./hostStages";

const summary = (progress: Parameters<typeof hostStages>[0]) =>
  hostStages(progress).map((stage) => [stage.state, stage.text, stage.action?.href ?? null]);

describe("hostStages", () => {
  it("REQ-HVER-001 antes da aprovação, só a verificação está liberada", () => {
    expect(summary({ verified: false, payouts: null, hasListing: false })).toEqual([
      ["current", copy.stages.verification.current, "/host/application"],
      ["locked", copy.stages.payout.locked, null],
      ["locked", copy.stages.listing.locked, null],
    ]);
  });

  it("REQ-LIST-001 aprovada e recebimento em análise: etapa 2 é a de agora, com a situação real", () => {
    expect(summary({ verified: true, payouts: { enabled: false, status: "under_review" }, hasListing: false })).toEqual(
      [
        ["done", copy.stages.verification.done, null],
        ["current", copy.stages.payout.byStatus.under_review, "/host/payments"],
        ["locked", copy.stages.listing.locked, null],
      ],
    );
  });

  it("REQ-LIST-001 recebimento liberado e sem cantinho: etapa 3 leva ao cadastro", () => {
    expect(summary({ verified: true, payouts: { enabled: true, status: "enabled" }, hasListing: false })).toEqual([
      ["done", copy.stages.verification.done, null],
      ["done", copy.stages.payout.done, null],
      ["current", copy.stages.listing.current, "/host/listings/new"],
    ]);
  });

  it("REQ-LIST-001 com cantinho, as três prontas", () => {
    expect(
      hostStages({ verified: true, payouts: { enabled: true, status: "enabled" }, hasListing: true }).map(
        (stage) => stage.state,
      ),
    ).toEqual(["done", "done", "done"]);
  });

  it("REQ-LIST-001 situação desconhecida do Stripe cai na frase padrão", () => {
    expect(
      hostStages({ verified: true, payouts: { enabled: false, status: "novo" }, hasListing: false })[1]?.text,
    ).toBe(copy.stages.payout.fallback);
  });
});
