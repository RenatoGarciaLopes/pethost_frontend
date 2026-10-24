import type { CopyCatalog } from "../copyTypes";
import { numberParam } from "./phrases";

/** Verificação de anfitrião. */
export const hostApplicationErrorCopy = {
  HOST_APPLICATION_ATTEMPTS_EXCEEDED: ({ params }) =>
    `Já foram ${numberParam(params, "max") ?? 3} tentativas. Agora a gente continua pelo suporte, com calma.`,
  HOST_APPLICATION_BLOCKED: "Não foi possível confirmar sua identidade. Fala com o suporte.",
  HOST_APPLICATION_DOCUMENT_ALREADY_EXISTS: "Essa foto já foi usada em outra vaga. Tira uma foto nova.",
  HOST_APPLICATION_DOCUMENTS_MISSING: "Ainda falta foto. Confere as três vagas antes de enviar.",
  HOST_APPLICATION_ALREADY_EXISTS: "Você já tem uma verificação aberta. Vamos continuar de onde parou.",
  HOST_APPLICATION_NOT_EDITABLE: "Essa verificação já foi enviada e não dá mais pra mudar.",
  HOST_APPLICATION_COMPANY_DATA_NOT_ALLOWED: "Dados de empresa só valem pra verificação de empresa.",
  HOST_ALREADY_VERIFIED: "Sua verificação já foi aprovada.",
  HOST_IDENTITY_LOCKED: "Esses dados foram conferidos na verificação. Pra mudar, fala com o suporte.",
  HOST_APPLICATION_CLOSED: "Essa verificação já foi encerrada.",
  HOST_IDENTITY_BLOCKED: "Não foi possível confirmar sua identidade. Fala com o suporte.",
  HOST_IDENTITY_BLOCK_NOT_FOUND: "Não achamos esse bloqueio de identidade.",
} satisfies CopyCatalog;
