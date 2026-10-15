import type { z } from "zod";
import type {
  applicationStatusSchema,
  documentKindSchema,
  documentTypeSchema,
  personTypeSchema,
  REJECTION_REASONS,
} from "./api/contracts";

export type ApplicationStatus = z.output<typeof applicationStatusSchema>;
export type DocumentKind = z.output<typeof documentKindSchema>;
export type DocumentType = z.output<typeof documentTypeSchema>;
export type PersonType = z.output<typeof personTypeSchema>;
export type RejectionReason = (typeof REJECTION_REASONS)[number];

/** Endereço da empresa no formato do formulário: texto, sem nulos. */
export interface CompanyAddress {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

/** Dados de empresa (só pessoa jurídica). */
export interface CompanyData {
  cnpj: string;
  legalName: string;
  tradeName: string;
  address: CompanyAddress;
}

/** O que dá pra corrigir no rascunho (`PATCH`): só existe enquanto o status é `draft`. */
export interface ApplicationDraftData {
  /** Só dígitos: é o que a própria pessoa digitou. */
  cpf: string;
  documentType: DocumentType;
  company: CompanyData | null;
}

/** A solicitação como a tela usa (spec 030). */
export interface HostApplication {
  id: string;
  status: ApplicationStatus;
  personType: PersonType;
  documentType: DocumentType;
  /** CPF para mostrar (`***.***.247-25`). */
  cpfMasked: string;
  /** Dados completos para corrigir, só no rascunho; `null` nos outros status. */
  draft: ApplicationDraftData | null;
  attemptNumber: number;
  /** Fotos já enviadas, na ordem das vagas. A imagem nunca volta. */
  uploadedKinds: DocumentKind[];
  /** Fotos que faltam para enviar, na ordem das vagas. */
  missingDocuments: DocumentKind[];
  /** Só em `rejected`/`rejected_final`; desconhecido vira `other`. */
  rejectionReason: RejectionReason | null;
  /** ISO; só no rascunho: `createdAt` + 7 dias (REQ-HVER-011). */
  draftExpiresAt: string | null;
}

/** "Minha verificação": a solicitação mais recente (ou nenhuma) e o que dá pra fazer agora. */
export interface MyApplication {
  application: HostApplication | null;
  canStartNew: boolean;
  remainingAttempts: number;
  /** Versão do aviso de uso das fotos que a API exige aceitar. */
  noticeVersion: string;
}
