import type { ApiError } from "./ApiError";
import { roleLabel } from "@/shared/config/roleLabels";

/** Contexto opcional que muda a frase (ex.: o tipo de conta da tela). */
export interface ErrorCopyContext {
  role?: "owner" | "host";
  /** Orientação para a equipe ao decidir verificação; preserva a copy pessoal fora do admin. */
  adminReview?: boolean;
}

type CopyEntry = string | ((error: ApiError, context: ErrorCopyContext) => string);

export const GENERIC_ERROR_MESSAGE = "Deu um problema do nosso lado. Tenta de novo; se continuar, fala com a gente.";

/**
 * Código de erro → frase da PetHost. Fonte única da microcopy de erro
 * (antes em `produto/contrato-api.md` no vault, que agora aponta para cá).
 * Motivos de recusa da verificação ficam na feature de verificação.
 */
export const errorCopy: Record<string, CopyEntry> = {
  // Autenticação e conta
  AUTH_INVALID_CREDENTIALS:
    "E-mail ou senha não batem com essa conta. Confere se você é tutor ou anfitrião aqui em cima.",
  AUTH_ACCOUNT_DEACTIVATED: "Essa conta está pausada. Quer reativar? É só confirmar a senha.",
  AUTH_ACCOUNT_SUSPENDED: "Essa conta está suspensa. Fala com a gente pelo suporte.",
  AUTH_EMAIL_ALREADY_REGISTERED: (_error, { role }) =>
    role ? `Esse e-mail já tem conta de ${roleLabel(role)}. Quer entrar?` : "Esse e-mail já tem conta. Quer entrar?",
  OWNER_CPF_ALREADY_REGISTERED:
    "Esse CPF já está em outra conta. Se ele é seu, fala com o suporte que a gente resolve.",
  OWNER_CPF_LOCKED: "Depois do primeiro pagamento, o CPF e o nascimento ficam travados. Pra mudar, fala com o suporte.",
  OWNER_BIRTH_DATE_LOCKED:
    "Depois do primeiro pagamento, o CPF e o nascimento ficam travados. Pra mudar, fala com o suporte.",
  OWNER_NOT_FOUND: "Não achamos seu perfil de tutor. Fala com o suporte.",
  OWNER_HAS_OPEN_BOOKING: "Tem estadia pedida, marcada ou acontecendo. Cancela ou espera terminar pra pausar a conta.",
  HOST_NOT_FOUND: "Seus dados ficam editáveis depois da verificação.",
  HOST_HAS_OPEN_BOOKING:
    "Tem estadia pedida, marcada ou acontecendo no seu cantinho. Resolve ela antes de pausar a conta.",
  HOST_NOT_A_COMPANY: "Esses dados são só de conta de empresa.",
  PAYLOAD_TOO_LARGE: "Essa foto não serve: use JPG, PNG ou WebP de até 5 MB.",
  UNSUPPORTED_MEDIA_TYPE: "Esse arquivo não é uma foto: use JPG, PNG ou WebP.",
  HOST_CPF_ALREADY_REGISTERED: (_error, context) =>
    context.adminReview
      ? "Esse CPF/CNPJ já pertence a outro anfitrião. Recuse com 'Os dados não batem' ou abra a conta indevida em Contas."
      : "Esse CPF já está em outra conta. Se ele é seu, fala com o suporte que a gente resolve.",
  HOST_CNPJ_ALREADY_REGISTERED: (_error, context) =>
    context.adminReview
      ? "Esse CPF/CNPJ já pertence a outro anfitrião. Recuse com 'Os dados não batem' ou abra a conta indevida em Contas."
      : "Esse CNPJ já está em outra conta. Se a empresa é sua, fala com o suporte.",
  HOST_APPLICATION_CONFLICT: "Outra pessoa da equipe já decidiu essa verificação.",
  HOST_APPLICATION_NOT_UNDER_REVIEW: "Outra pessoa da equipe já decidiu essa verificação.",
  HOST_APPLICATION_NOT_FOUND: "Não encontramos essa verificação. Volte para a fila.",
  HOST_APPLICATION_DOCUMENT_NOT_FOUND: "Essa foto não está mais disponível. Recarregue a verificação.",
  AUTH_LINKED_ACCOUNT_NOT_FOUND: "Não deu pra abrir a outra conta. Confere a senha dela.",
  AUTH_PASSWORD_RESET_TOKEN_INVALID: "Esse link já venceu. Pede outro, leva um minuto.",

  // Pets
  PET_PHOTO_LIMIT_REACHED: "Já tem 3 fotos. Tira uma pra colocar outra.",
  PET_PHOTO_ALREADY_EXISTS: "Essa foto já está na ficha.",
  PET_MICROCHIP_ALREADY_REGISTERED: "Esse microchip já está em outro pet. Se é o seu, fala com o suporte.",
  PET_KEEPER_NOT_FOUND: "Os pets da casa entram depois que sua verificação for aprovada.",
  PET_HOST_NOT_FOUND: "Não achamos os pets dessa casa agora.",

  // Verificação de anfitrião
  HOST_APPLICATION_ATTEMPTS_EXCEEDED: "Já foram 3 tentativas. Agora a gente continua pelo suporte, com calma.",
  HOST_APPLICATION_BLOCKED: "Não foi possível confirmar sua identidade. Fala com o suporte.",
  HOST_APPLICATION_DOCUMENT_ALREADY_EXISTS: "Essa foto já foi usada em outra vaga. Tira uma foto nova.",
  HOST_APPLICATION_DOCUMENTS_MISSING: "Ainda falta foto. Confere as três vagas antes de enviar.",
  HOST_APPLICATION_ALREADY_EXISTS: "Você já tem uma verificação aberta. Vamos continuar de onde parou.",
  HOST_APPLICATION_NOT_EDITABLE: "Essa verificação já foi enviada e não dá mais pra mudar.",
  HOST_APPLICATION_COMPANY_DATA_NOT_ALLOWED: "Dados de empresa só valem pra verificação de empresa.",
  HOST_ALREADY_VERIFIED: "Sua verificação já foi aprovada.",
  HOST_IDENTITY_LOCKED: "Esses dados foram conferidos na verificação. Pra mudar, fala com o suporte.",

  // Recebimento Stripe Connect (043)
  HOST_STRIPE_UNAVAILABLE: "O Stripe não respondeu agora. Tenta de novo em alguns minutos.",
  HOST_STRIPE_REQUEST_REJECTED: "O Stripe não aceitou esses dados. Fala com o suporte pra gente conferir.",
  HOST_STRIPE_ONBOARDING_NOT_ALLOWED:
    "O cadastro de recebimento não está disponível pra essa conta agora. Fala com o suporte.",
  HOST_STRIPE_ACCOUNT_REJECTED:
    "O Stripe não aprovou o recebimento dessa conta. Fala com a gente pra entender o que aconteceu.",
  HOST_STRIPE_ACCOUNT_ALREADY_EXISTS: "Essa conta já tem recebimento conectado. Pra trocar, fala com o suporte.",
  HOST_STRIPE_ACCOUNT_NOT_FOUND: "Você ainda não começou seu cadastro de recebimento. Começa por aqui.",

  // Transversais da API
  VALIDATION_ERROR: "Alguns campos precisam de ajuste. Confere as mensagens embaixo de cada um.",
  UNAUTHORIZED: "Sua sessão terminou. Entra de novo pra continuar.",
  FORBIDDEN: "Essa parte não está disponível pra sua conta.",
  TOO_MANY_REQUESTS: ({ retryAfterSeconds: seconds }) =>
    seconds === undefined
      ? "Muitas tentativas seguidas. Respira e tenta de novo daqui a pouco."
      : `Muitas tentativas seguidas. Respira e tenta de novo em ${seconds} ${seconds === 1 ? "segundo" : "segundos"}.`,
  UNEXPECTED_ERROR: GENERIC_ERROR_MESSAGE,

  // Locais (transporte e BFF)
  NETWORK_ERROR: "Parece que a conexão caiu. Confere a internet e tenta de novo.",
  SESSION_EXPIRED: "Sua sessão terminou. Entra de novo pra continuar.",
  CSRF_REJECTED: "Por segurança, recarrega a página e tenta de novo.",
};
