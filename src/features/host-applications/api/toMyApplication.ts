import { maskCpfForDisplay } from "@/shared/lib/masks/maskCpfForDisplay";
import { DRAFT_LIFETIME_DAYS } from "../lib/constants";
import type { CompanyData, DocumentKind, HostApplication, MyApplication, RejectionReason } from "../types";
import { DOCUMENT_KINDS, REJECTION_REASONS, type HostApplicationDto, type MyApplicationDto } from "./contracts";

const DAY_MS = 24 * 60 * 60 * 1000;

const inSlotOrder = (kinds: readonly DocumentKind[]) => DOCUMENT_KINDS.filter((kind) => kinds.includes(kind));

const isKnownReason = (reason: string): reason is RejectionReason =>
  (REJECTION_REASONS as readonly string[]).includes(reason);

function toRejectionReason(reason: string | null | undefined): RejectionReason | null {
  if (!reason) return null;
  return isKnownReason(reason) ? reason : "other";
}

function toCompany(company: HostApplicationDto["company"]): CompanyData | null {
  if (!company) return null;
  const { address } = company;
  return {
    cnpj: company.cnpj,
    legalName: company.legalName,
    tradeName: company.tradeName,
    address: {
      zipCode: address.zipCode ?? "",
      street: address.street ?? "",
      number: address.number ?? "",
      complement: address.complement ?? "",
      neighborhood: address.neighborhood ?? "",
      city: address.city ?? "",
      state: address.state ?? "",
    },
  };
}

/**
 * Uma solicitação (de `GET` ou da resposta de uma mutação) para o modelo da tela.
 * @example const application = toHostApplication(await patchApplication(body));
 */
export function toHostApplication(dto: HostApplicationDto): HostApplication {
  const isDraft = dto.status === "draft";
  return {
    id: dto.id,
    status: dto.status,
    personType: dto.personType,
    documentType: dto.documentType,
    cpfMasked: maskCpfForDisplay(dto.cpf),
    draft: isDraft ? { cpf: dto.cpf, documentType: dto.documentType, company: toCompany(dto.company) } : null,
    attemptNumber: dto.attemptNumber,
    uploadedKinds: inSlotOrder(dto.documents.map((document) => document.kind)),
    missingDocuments: inSlotOrder(dto.missingDocuments),
    rejectionReason: toRejectionReason(dto.rejectionReason),
    draftExpiresAt: isDraft
      ? new Date(new Date(dto.createdAt).getTime() + DRAFT_LIFETIME_DAYS * DAY_MS).toISOString()
      : null,
  };
}

/**
 * "Minha verificação" da API para a tela (spec 030). O CPF completo só fica no rascunho, para corrigir; fora
 * dele, só mascarado. A validade do rascunho é `createdAt` + 7 dias, a mesma conta da limpeza do backend.
 *
 * @example const mine = toMyApplication(myApplicationSchema.parse(data));
 */
export function toMyApplication(dto: MyApplicationDto): MyApplication {
  return {
    application: dto.application ? toHostApplication(dto.application) : null,
    canStartNew: dto.canStartNew,
    remainingAttempts: dto.remainingAttempts,
    noticeVersion: dto.noticeVersion,
  };
}
