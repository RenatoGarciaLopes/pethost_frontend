import { z } from "zod";
import { isValidCnpj, isValidCpf } from "@/shared/lib/documents";
import { unmaskCnpj, unmaskCpf } from "@/shared/lib/masks";
import { createAddressSchema } from "@/shared/lib/validation";
import { DOCUMENT_TYPES, PERSON_TYPES } from "../api/contracts";
import { verificationCopy } from "../lib/verificationCopy";

const { notice, data } = verificationCopy;

/**
 * "Antes de começar" (REQ-HVER-003): o aceite do aviso das fotos e pessoa física ou empresa. Sem aceite, o erro
 * diz o que falta.
 * @example applicationNoticeSchema.parse({ acceptNotice: true, personType: "pf" })
 */
export const applicationNoticeSchema = z.object({
  acceptNotice: z.boolean().refine((accepted) => accepted, notice.acceptMissing),
  personType: z.enum(PERSON_TYPES),
});

const cpfSchema = z
  .string()
  .min(1, data.cpfMissing)
  .refine((value) => value === "" || isValidCpf(value), data.cpfInvalid)
  .transform((value) => unmaskCpf(value));

const documentTypeSchema = z.enum(DOCUMENT_TYPES, { errorMap: () => ({ message: data.documentTypeMissing }) });

const required = (message: string) => z.string().trim().min(1, message);

const companySchema = z.object({
  cnpj: z
    .string()
    .min(1, data.company.cnpjMissing)
    .refine((value) => value === "" || isValidCnpj(value), data.company.cnpjInvalid)
    .transform((value) => unmaskCnpj(value)),
  legalName: required(data.company.legalNameMissing),
  tradeName: required(data.company.tradeNameMissing),
  address: createAddressSchema(data.company.addressErrors),
});

/**
 * "Seus dados" (REQ-HVER-004): CPF com dígitos conferidos e o documento; na empresa, também CNPJ (aceita o
 * alfanumérico), razão social, nome fantasia e endereço. Pessoa física com dado de empresa é recusada, como na API.
 * O CPF e o CNPJ saem sem máscara.
 * @example applicationDataSchema.parse({ personType: "pf", cpf: "529.982.247-25", documentType: "cnh" })
 */
export const applicationDataSchema = z.discriminatedUnion("personType", [
  z.object({ personType: z.literal("pf"), cpf: cpfSchema, documentType: documentTypeSchema }).strict(),
  z.object({ personType: z.literal("pj"), cpf: cpfSchema, documentType: documentTypeSchema, company: companySchema }),
]);

export type ApplicationNoticeValues = z.output<typeof applicationNoticeSchema>;
export type ApplicationDataValues = z.output<typeof applicationDataSchema>;
