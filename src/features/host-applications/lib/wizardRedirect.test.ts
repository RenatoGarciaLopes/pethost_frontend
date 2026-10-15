import { describe, expect, it } from "vitest";
import { hostApplicationDto, myApplicationDto } from "@/test/fixtures/hostApplication";
import { myApplicationSchema } from "../api/contracts";
import { toMyApplication } from "../api/toMyApplication";
import { wizardRedirect } from "./wizardRedirect";

const mine = (overrides: Record<string, unknown> = {}, application: Record<string, unknown> | null = null) =>
  toMyApplication(
    myApplicationSchema.parse(
      myApplicationDto({ application: application && hostApplicationDto(application), ...overrides }),
    ),
  );

describe("wizardRedirect", () => {
  it("REQ-HVER-002 sem solicitação e podendo começar: fica em /new", () => {
    expect(wizardRedirect("start", mine())).toBeNull();
  });

  it("REQ-HVER-011 com rascunho, /new leva ao passo que falta (/documents)", () => {
    expect(wizardRedirect("start", mine({}, { status: "draft" }))).toBe("/host/application/documents");
  });

  it.each([
    ["em análise", { status: "submitted" }, {}],
    ["aprovada", { status: "approved" }, { canStartNew: false }],
    ["sem tentativas", { status: "rejected" }, { canStartNew: false, remainingAttempts: 0 }],
  ])("REQ-HVER-015 %s: /new volta para o status", (_, application, overrides) => {
    expect(wizardRedirect("start", mine(overrides, application))).toBe("/host/application");
  });

  it("REQ-HVER-014 REQ-HVER-017 recusada, vencida ou desistida, com tentativa: /new começa de novo", () => {
    expect(wizardRedirect("start", mine({}, { status: "rejected" }))).toBeNull();
    expect(wizardRedirect("start", mine({}, { status: "expired" }))).toBeNull();
    expect(wizardRedirect("start", mine({}, { status: "cancelled" }))).toBeNull();
  });

  it("REQ-HVER-011 /documents só com rascunho; senão volta para o status", () => {
    expect(wizardRedirect("documents", mine({}, { status: "draft" }))).toBeNull();
    expect(wizardRedirect("documents", mine())).toBe("/host/application");
    expect(wizardRedirect("documents", mine({}, { status: "submitted" }))).toBe("/host/application");
  });
});
