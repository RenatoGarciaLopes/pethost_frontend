import { describe, expect, it } from "vitest";
import { companyAddressDto, SYNTHETIC_CNPJ, SYNTHETIC_CPF } from "@/test/fixtures/hostApplication";
import { verificationCopy as copy } from "../lib/verificationCopy";
import { applicationDataSchema, applicationNoticeSchema } from "./applicationSchemas";

const company = {
  cnpj: SYNTHETIC_CNPJ,
  legalName: "Pet Feliz Hospedagem LTDA",
  tradeName: "Pet Feliz",
  address: { ...companyAddressDto, complement: "" },
};

const messagesOf = (result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  Object.fromEntries((result.error?.issues ?? []).map((issue) => [issue.path.join("."), issue.message]));

describe("applicationNoticeSchema", () => {
  it("REQ-HVER-003 sem o 'Li e concordo' não avança, e o erro diz o que falta", () => {
    const result = applicationNoticeSchema.safeParse({ acceptNotice: false, personType: "pf" });
    expect(messagesOf(result)).toEqual({ acceptNotice: copy.notice.acceptMissing });
  });

  it("REQ-HVER-003 com o aceite e o tipo de pessoa, passa", () => {
    expect(applicationNoticeSchema.parse({ acceptNotice: true, personType: "pj" })).toEqual({
      acceptNotice: true,
      personType: "pj",
    });
  });
});

describe("applicationDataSchema", () => {
  it("REQ-HVER-004 pessoa física: CPF com máscara vira dígitos; documento entre RG, CNH e CIN", () => {
    expect(applicationDataSchema.parse({ personType: "pf", cpf: "529.982.247-25", documentType: "cin" })).toEqual({
      personType: "pf",
      cpf: SYNTHETIC_CPF,
      documentType: "cin",
    });
  });

  it("REQ-HVER-004 CPF com dígito errado e documento faltando dizem o que fazer", () => {
    const result = applicationDataSchema.safeParse({ personType: "pf", cpf: "52998224724", documentType: "" });
    expect(messagesOf(result)).toEqual({
      cpf: copy.data.cpfInvalid,
      documentType: copy.data.documentTypeMissing,
    });
  });

  it("REQ-HVER-004 CPF vazio pede o CPF", () => {
    expect(messagesOf(applicationDataSchema.safeParse({ personType: "pf", cpf: "", documentType: "rg" }))).toEqual({
      cpf: copy.data.cpfMissing,
    });
  });

  it("REQ-HVER-004 pessoa física com dado de empresa é recusada", () => {
    const result = applicationDataSchema.safeParse({
      personType: "pf",
      cpf: SYNTHETIC_CPF,
      documentType: "rg",
      company,
    });
    expect(result.success).toBe(false);
  });

  it("REQ-HVER-004 empresa exige CNPJ, razão social, nome fantasia e endereço", () => {
    const result = applicationDataSchema.safeParse({
      personType: "pj",
      cpf: SYNTHETIC_CPF,
      documentType: "cnh",
      company: { cnpj: "", legalName: " ", tradeName: "", address: { ...company.address, zipCode: "" } },
    });
    expect(messagesOf(result)).toMatchObject({
      "company.cnpj": copy.data.company.cnpjMissing,
      "company.legalName": copy.data.company.legalNameMissing,
      "company.tradeName": copy.data.company.tradeNameMissing,
      "company.address.zipCode": copy.data.company.addressErrors.zipCode,
    });
  });

  it("REQ-HVER-004 empresa aceita CNPJ alfanumérico e o guarda sem máscara, em maiúsculas", () => {
    const parsed = applicationDataSchema.parse({
      personType: "pj",
      cpf: SYNTHETIC_CPF,
      documentType: "cnh",
      company: { ...company, cnpj: "12.abc.345/01de-35" },
    });
    expect(parsed).toMatchObject({ company: { cnpj: "12ABC34501DE35", tradeName: "Pet Feliz" } });
  });

  it("REQ-HVER-004 CNPJ com dígito errado é recusado no campo", () => {
    const result = applicationDataSchema.safeParse({
      personType: "pj",
      cpf: SYNTHETIC_CPF,
      documentType: "cnh",
      company: { ...company, cnpj: "11222333000182" },
    });
    expect(messagesOf(result)).toEqual({ "company.cnpj": copy.data.company.cnpjInvalid });
  });
});
