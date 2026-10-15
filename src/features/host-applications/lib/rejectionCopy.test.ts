import { describe, expect, it } from "vitest";
import { REJECTION_REASONS } from "../api/contracts";
import { applicationStatusLabel } from "./applicationStatusLabel";
import { describeRejection, rejectionCopy } from "./rejectionCopy";

describe("rejectionCopy", () => {
  it.each(REJECTION_REASONS)("REQ-HVER-014 %s tem frase de vizinho, sem código", (reason) => {
    const phrase = rejectionCopy[reason];
    expect(phrase.length).toBeGreaterThan(20);
    expect(phrase).not.toMatch(/_|\{|\}/);
  });

  it("REQ-HVER-014 frases da tabela do contrato", () => {
    expect(describeRejection("document_illegible")).toBe(
      "Não deu pra ler o documento. Tira a foto de dia, perto da janela, sem reflexo.",
    );
    expect(describeRejection("selfie_mismatch")).toBe("Na selfie precisa aparecer o seu rosto e o documento na mão.");
  });

  it("REQ-HVER-014 sem motivo cai na frase de other", () => {
    expect(describeRejection(null)).toBe(rejectionCopy.other);
  });
});

describe("applicationStatusLabel", () => {
  it("REQ-HVER-012 todo status tem nome curto em português", () => {
    expect(applicationStatusLabel).toEqual({
      draft: "Pela metade",
      submitted: "Em análise",
      approved: "Aprovada",
      rejected: "Recusada",
      rejected_final: "Encerrada",
      cancelled: "Desistência",
      expired: "Vencida",
    });
  });
});
