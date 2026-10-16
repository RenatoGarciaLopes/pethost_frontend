import type { ApiError } from "./ApiError";
import { roleLabel } from "@/shared/config/roleLabels";

/** Contexto opcional que muda a frase (ex.: o tipo de conta da tela). */
export interface ErrorCopyContext {
  role?: "owner" | "host";
  /** Orientação para a equipe ao decidir verificação; preserva a copy pessoal fora do admin. */
  adminReview?: boolean;
  /** Copy contextual para a gestão de contas, sem alterar a mensagem pessoal da área logada. */
  adminAccounts?: boolean;
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
  OWNER_NOT_FOUND: (_error, { adminAccounts }) =>
    adminAccounts ? "Esse perfil de tutor não existe mais." : "Não achamos seu perfil de tutor. Fala com o suporte.",
  OWNER_SUSPENSION_REQUIRED: (_error, { adminAccounts }) =>
    adminAccounts ? "A conta não está suspensa. Recarregue os dados e confira o status." : GENERIC_ERROR_MESSAGE,
  OWNER_CPF_RELEASED: (_error, { adminAccounts }) =>
    adminAccounts ? "O CPF já foi liberado. Recarregue os dados da conta." : GENERIC_ERROR_MESSAGE,
  OWNER_HAS_OPEN_BOOKING: "Tem estadia pedida, marcada ou acontecendo. Cancela ou espera terminar pra pausar a conta.",
  HOST_NOT_FOUND: (_error, { adminAccounts }) =>
    adminAccounts ? "Esse perfil de anfitrião não existe mais." : "Seus dados ficam editáveis depois da verificação.",
  HOST_SUSPENSION_REQUIRED: (_error, { adminAccounts }) =>
    adminAccounts ? "A conta não está suspensa. Recarregue os dados e confira o status." : GENERIC_ERROR_MESSAGE,
  HOST_IDENTITY_RELEASED: (_error, { adminAccounts }) =>
    adminAccounts ? "A identidade já foi liberada. Recarregue os dados da conta." : GENERIC_ERROR_MESSAGE,
  AUTH_ADMIN_SUSPENSION_FORBIDDEN: (_error, { adminAccounts }) =>
    adminAccounts ? "Conta de admin não pode ser suspensa." : GENERIC_ERROR_MESSAGE,
  HOST_STRIPE_ACCOUNT_NOT_REJECTED: (_error, { adminAccounts }) =>
    adminAccounts
      ? "O cadastro Stripe não está recusado. Recarregue os dados e confira o status."
      : GENERIC_ERROR_MESSAGE,
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

  // Cantinho
  LISTING_HOST_PAYOUTS_NOT_ENABLED: "Seu cantinho abre depois que o recebimento estiver conectado.",
  LISTING_LIMIT_REACHED: "Você já tem um cantinho. Dá pra editar ele quando quiser.",
  LISTING_HOST_NOT_FOUND: "O cantinho abre depois que a sua verificação for aprovada.",
  LISTING_HOST_DEACTIVATED: "Sua conta de anfitrião está pausada. Reative a conta pra mexer no cantinho.",
  LISTING_GEOCODER_UNAVAILABLE: "Não conseguimos achar o endereço no mapa agora. Tenta de novo em alguns minutos.",
  LISTING_ADDRESS_NOT_LOCATED: "Não achamos esse endereço no mapa. Confere o CEP, a rua e o número.",
  LISTING_PHOTO_LIMIT_REACHED: "Já tem 5 fotos. Tira uma pra colocar outra.",
  LISTING_PHOTO_ALREADY_EXISTS: "Essa foto já está no cantinho.",
  LISTING_NOT_FOUND: "Não achamos esse cantinho.",

  // Reservas e estadias (specs 050 a 054)
  BOOKING_NOT_FOUND: "Não achamos essa estadia.",
  BOOKING_OWNER_NOT_FOUND: "Pra pedir estadia, falta o seu perfil de tutor.",
  BOOKING_OWNER_DEACTIVATED: "Sua conta de tutor está pausada.",
  BOOKING_OWNER_INACTIVE: "Esse tutor não está mais ativo. Dá pra recusar ou deixar expirar.",
  BOOKING_HOST_NOT_FOUND: "Os pedidos chegam depois que a sua verificação for aprovada.",
  BOOKING_HOST_DEACTIVATED: "Sua conta de anfitrião está pausada. Reative a conta pra responder pedidos.",
  BOOKING_LISTING_NOT_FOUND: "Esse cantinho não está recebendo pedidos agora.",
  BOOKING_PET_NOT_FOUND: "Não achamos esse pet na sua lista.",
  BOOKING_PET_INACTIVE: "Esse pet está fora da sua lista. Volta ele pra lista pra pedir.",
  BOOKING_PET_SPECIES_NOT_ACCEPTED: "Esse cantinho não recebe esse tipo de bicho.",
  BOOKING_PET_SIZE_NOT_ACCEPTED: "Esse cantinho não recebe esse porte.",
  BOOKING_PET_PERIOD_CONFLICT: "Esse pet já tem outra estadia nessas datas.",
  BOOKING_WEEKDAY_NOT_AVAILABLE: "O cantinho não recebe em algum dia desse período. Tenta outras datas.",
  BOOKING_CAPACITY_EXCEEDED: "Não cabe mais ninguém nessas noites.",
  BOOKING_NOT_AWAITING_RESPONSE: "Esse pedido já foi respondido. A tela foi atualizada.",
  BOOKING_RESPONSE_EXPIRED: "O prazo de 24 horas passou e o pedido expirou.",
  BOOKING_ALREADY_CANCELLED: "Essa estadia já foi cancelada.",
  BOOKING_ALREADY_CLOSED: "Esse pedido já foi recusado ou expirou: não há o que cancelar.",
  BOOKING_CANNOT_CANCEL_AFTER_CHECK_IN: "Depois que o pet chegou, não dá pra cancelar.",
  BOOKING_NOT_CONFIRMED: "Só dá pra marcar a chegada de estadia confirmada.",
  BOOKING_CHECK_IN_TOO_EARLY: "Ainda não é o dia da chegada.",
  BOOKING_CHECK_IN_WINDOW_CLOSED: "O período dessa estadia já passou.",
  BOOKING_NOT_IN_PROGRESS: "Só dá pra marcar a volta de estadia que está acontecendo.",
  BOOKING_CONFLICT: "A estadia mudou enquanto você olhava. Confere de novo.",

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
