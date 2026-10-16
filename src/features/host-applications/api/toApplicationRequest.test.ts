import { describe, expect, it } from "vitest";
import { companyAddressDto, SYNTHETIC_CNPJ, SYNTHETIC_CPF } from "@/test/fixtures/hostApplication";
import type { ApplicationDraftData } from "../types";
import { toPatchApplicationRequest, toStartApplicationRequest } from "./toApplicationRequest";

const address = { ...companyAddressDto, complement: "" };
const company = { cnpj: SYNTHETIC_CNPJ, legalName: "Pet Feliz Hospedagem LTDA", tradeName: "Pet Feliz", address };

describe("toStartApplicationRequest", () => {
  it("REQ-HVER-005 pessoa física: aceite, tipo, CPF e documento, sem nada de empresa", () => {
    expect(toStartApplicationRequest({ personType: "pf", cpf: SYNTHETIC_CPF, documentType: "cnh" })).toEqual({
      acceptNotice: true,
      personType: "pf",
      cpf: SYNTHETIC_CPF,
      documentType: "cnh",
    });
  });

  it("REQ-HVER-005 empresa: manda os dados da empresa e o endereço", () => {
    expect(toStartApplicationRequest({ personType: "pj", cpf: SYNTHETIC_CPF, documentType: "rg", company })).toEqual({
      acceptNotice: true,
      personType: "pj",
      cpf: SYNTHETIC_CPF,
      documentType: "rg",
      cnpj: SYNTHETIC_CNPJ,
      legalName: "Pet Feliz Hospedagem LTDA",
      tradeName: "Pet Feliz",
      companyAddress: address,
    });
  });
});

describe("toPatchApplicationRequest", () => {
  const original: ApplicationDraftData = { cpf: SYNTHETIC_CPF, documentType: "cnh", company: null };

  it("REQ-HVER-005 nada mudou: PATCH vazio", () => {
    expect(toPatchApplicationRequest(original, { personType: "pf", cpf: SYNTHETIC_CPF, documentType: "cnh" })).toEqual(
      {},
    );
  });

  it("REQ-HVER-005 manda só o que mudou", () => {
    expect(toPatchApplicationRequest(original, { personType: "pf", cpf: SYNTHETIC_CPF, documentType: "rg" })).toEqual({
      documentType: "rg",
    });
  });

  it("REQ-HVER-005 empresa: campo a campo, inclusive dentro do endereço; complemento apagado vai vazio", () => {
    const before: ApplicationDraftData = {
      ...original,
      company: { ...company, address: { ...address, complement: "Sala 2" } },
    };
    const patch = toPatchApplicationRequest(before, {
      personType: "pj",
      cpf: SYNTHETIC_CPF,
      documentType: "cnh",
      company: { ...company, tradeName: "Pet Feliz Maringá", address: { ...address, number: "1600", complement: "" } },
    });
    expect(patch).toEqual({ tradeName: "Pet Feliz Maringá", companyAddress: { number: "1600", complement: "" } });
  });
});
