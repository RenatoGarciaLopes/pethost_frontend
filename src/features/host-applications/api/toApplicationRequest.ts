import type { z } from "zod";
import {
  PatchApiV1HostsMeApplicationBody,
  PostApiV1HostsMeApplicationBody,
} from "@/shared/api/generated/hosts/hosts.zod";
import { diffPatch } from "@/shared/lib/patch/diffPatch";
import type { ApplicationDataValues } from "../schemas/applicationSchemas";
import type { ApplicationDraftData, CompanyData } from "../types";

export type StartApplicationRequest = z.input<typeof PostApiV1HostsMeApplicationBody>;
export type PatchApplicationRequest = z.input<typeof PatchApiV1HostsMeApplicationBody>;

/**
 * Corpo do `POST /hosts/me/application` (REQ-HVER-005): o aceite do aviso vai sempre `true` (o passo "Antes de
 * começar" não deixa seguir sem ele); empresa leva os quatro campos de empresa juntos.
 * @example await startApplication(toStartApplicationRequest(values));
 */
export function toStartApplicationRequest(values: ApplicationDataValues): StartApplicationRequest {
  const person = {
    acceptNotice: true,
    personType: values.personType,
    cpf: values.cpf,
    documentType: values.documentType,
  };
  if (values.personType === "pf") return person;
  const { cnpj, legalName, tradeName, address } = values.company;
  return { ...person, cnpj, legalName, tradeName, companyAddress: address };
}

function companyPatch(before: CompanyData | null, after: CompanyData): PatchApplicationRequest {
  const { address: beforeAddress, ...beforeFields } = before ?? { address: undefined };
  const { address, ...fields } = after;
  const patch = diffPatch<Record<string, string>>(beforeFields, fields) as PatchApplicationRequest;
  const addressPatch = diffPatch<Record<string, string>>(
    { ...beforeAddress },
    { ...address },
    { clearable: ["complement"] },
  );
  return Object.keys(addressPatch).length > 0 ? { ...patch, companyAddress: addressPatch } : patch;
}

/**
 * Corpo do `PATCH /hosts/me/application` (REQ-HVER-005): só o que mudou, campo a campo, inclusive dentro do endereço
 * da empresa (a API completa o resto com o rascunho). Nada mudou → `{}` (não precisa chamar a API).
 * @example const body = toPatchApplicationRequest(application.draft, values);
 */
export function toPatchApplicationRequest(
  original: ApplicationDraftData,
  values: ApplicationDataValues,
): PatchApplicationRequest {
  const person = diffPatch(
    { cpf: original.cpf, documentType: original.documentType },
    { cpf: values.cpf, documentType: values.documentType },
  ) as PatchApplicationRequest;
  return values.personType === "pj" ? { ...person, ...companyPatch(original.company, values.company) } : person;
}
