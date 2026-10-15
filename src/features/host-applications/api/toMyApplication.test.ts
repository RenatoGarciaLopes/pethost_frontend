import { describe, expect, it } from "vitest";
import {
  allDocumentsDto,
  companyDto,
  hostApplicationDto,
  myApplicationDto,
  SYNTHETIC_CNPJ,
} from "@/test/fixtures/hostApplication";
import { myApplicationSchema } from "./contracts";
import { toMyApplication } from "./toMyApplication";

const read = (overrides: Record<string, unknown> = {}, application: Record<string, unknown> | null = {}) =>
  toMyApplication(
    myApplicationSchema.parse(
      myApplicationDto({ application: application && hostApplicationDto(application), ...overrides }),
    ),
  );

describe("toMyApplication", () => {
  it("REQ-HVER-002 quem nunca pediu: sem solicitação, com o que dá pra fazer", () => {
    expect(toMyApplication(myApplicationSchema.parse(myApplicationDto()))).toEqual({
      application: null,
      canStartNew: true,
      remainingAttempts: 3,
      noticeVersion: "2026-10-10",
    });
  });

  it("REQ-HVER-011 rascunho vale 7 dias a partir de quando foi aberto", () => {
    const { application } = read(
      {},
      { createdAt: "2026-10-12T15:00:00+00:00", updatedAt: "2026-10-13T09:00:00+00:00" },
    );
    expect(application?.draftExpiresAt).toBe("2026-10-19T15:00:00.000Z");
  });

  it("REQ-HVER-011 fora do rascunho não há validade", () => {
    expect(read({}, { status: "submitted" }).application?.draftExpiresAt).toBeNull();
  });

  it("REQ-HVER-010 fotos enviadas e as que faltam, na ordem das vagas", () => {
    const { application } = read(
      {},
      {
        documents: [allDocumentsDto[2], allDocumentsDto[0]],
        missingDocuments: ["back"],
      },
    );
    expect(application?.uploadedKinds).toEqual(["front", "selfie"]);
    expect(application?.missingDocuments).toEqual(["back"]);
  });

  it("REQ-HVER-010 CPF mascarado para mostrar; o completo só no rascunho, para corrigir", () => {
    const draft = read().application;
    expect(draft?.cpfMasked).toBe("***.***.247-25");
    expect(draft?.draft?.cpf).toBe("52998224725");

    const submitted = read({}, { status: "submitted" }).application;
    expect(submitted?.cpfMasked).toBe("***.***.247-25");
    expect(submitted?.draft).toBeNull();
    expect(JSON.stringify(submitted)).not.toContain("52998224725");
  });

  it("REQ-HVER-004 empresa: dados da empresa no rascunho, endereço com nulos vazios", () => {
    const { application } = read({}, { personType: "PJ", company: companyDto });
    expect(application?.personType).toBe("pj");
    expect(application?.draft?.company).toEqual({
      cnpj: SYNTHETIC_CNPJ,
      legalName: "Pet Feliz Hospedagem LTDA",
      tradeName: "Pet Feliz",
      address: {
        zipCode: "87013000",
        street: "Av. Brasil",
        number: "1500",
        complement: "",
        neighborhood: "Centro",
        city: "Maringá",
        state: "PR",
      },
    });
  });

  it("REQ-HVER-014 motivo da recusa conhecido passa; desconhecido vira other", () => {
    expect(read({}, { status: "rejected", rejectionReason: "selfie_mismatch" }).application?.rejectionReason).toBe(
      "selfie_mismatch",
    );
    expect(read({}, { status: "rejected", rejectionReason: "motivo_novo" }).application?.rejectionReason).toBe("other");
    expect(read({}, { status: "draft" }).application?.rejectionReason).toBeNull();
  });

  it("REQ-HVER-015 status desconhecido não passa pelo contrato", () => {
    expect(() =>
      myApplicationSchema.parse(myApplicationDto({ application: hostApplicationDto({ status: "paused" }) })),
    ).toThrow();
  });
});
