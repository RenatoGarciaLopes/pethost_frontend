/**
 * Fixtures da verificação do anfitrião (spec 030), no formato de `modulo-hosts.md` seção 3.2. Dados sintéticos:
 * o CPF e o CNPJ só passam nos dígitos verificadores, não são de ninguém.
 */

/** CPF sintético válido (dígitos verificadores certos). */
export const SYNTHETIC_CPF = "52998224725";
/** CNPJ sintético válido. */
export const SYNTHETIC_CNPJ = "11222333000181";

/** Endereço da empresa como a API manda. */
export const companyAddressDto = {
  zipCode: "87013000",
  street: "Av. Brasil",
  number: "1500",
  complement: null,
  neighborhood: "Centro",
  city: "Maringá",
  state: "PR",
};

/** A solicitação como a própria pessoa vê (`application` de `GET /hosts/me/application`). Padrão: rascunho sem fotos. */
export function hostApplicationDto(overrides: Record<string, unknown> = {}) {
  return {
    id: "0199d3b0-0000-7000-8000-0000000000a1",
    status: "draft",
    personType: "pf",
    cpf: SYNTHETIC_CPF,
    documentType: "cnh",
    company: null,
    attemptNumber: 1,
    documents: [],
    missingDocuments: ["front", "back", "selfie"],
    rejectionReason: null,
    submittedAt: null,
    reviewedAt: null,
    closedAt: null,
    documentsPurgedAt: null,
    createdAt: "2026-10-12T15:00:00+00:00",
    updatedAt: "2026-10-12T15:00:00+00:00",
    ...overrides,
  };
}

/** Os dados de empresa (`company`) de uma solicitação de pessoa jurídica. */
export const companyDto = {
  cnpj: SYNTHETIC_CNPJ,
  legalName: "Pet Feliz Hospedagem LTDA",
  tradeName: "Pet Feliz",
  address: companyAddressDto,
};

/** As três fotos já enviadas, com a data. */
export const allDocumentsDto = (["front", "back", "selfie"] as const).map((kind) => ({
  kind,
  uploadedAt: "2026-10-12T15:10:00+00:00",
}));

/** Resposta de `GET /hosts/me/application`. Padrão: nunca pediu. */
export function myApplicationDto(overrides: Record<string, unknown> = {}) {
  return {
    application: null,
    canStartNew: true,
    remainingAttempts: 3,
    noticeVersion: "2026-10-10",
    ...overrides,
  };
}
