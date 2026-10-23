import type { CopyCatalog } from "../copyTypes";
import { roleLabel } from "@/shared/config/roleLabels";
import { GENERIC_ERROR_MESSAGE } from "../fallbackCopy";

/** Autenticação e conta (tutor e anfitrião). */
export const accountErrorCopy = {
  AUTH_INVALID_CREDENTIALS:
    "E-mail ou senha não batem com essa conta. Confere se você é tutor ou anfitrião aqui em cima.",
  AUTH_ACCOUNT_DEACTIVATED: "Essa conta está pausada. Quer reativar? É só confirmar a senha.",
  AUTH_ACCOUNT_SUSPENDED: "Essa conta está suspensa. Fala com a gente pelo suporte.",
  AUTH_EMAIL_ALREADY_REGISTERED: ({ context: { role } }) =>
    role ? `Esse e-mail já tem conta de ${roleLabel(role)}. Quer entrar?` : "Esse e-mail já tem conta. Quer entrar?",
  OWNER_CPF_ALREADY_REGISTERED:
    "Esse CPF já está em outra conta. Se ele é seu, fala com o suporte que a gente resolve.",
  OWNER_CPF_LOCKED: "Depois do primeiro pagamento, o CPF e o nascimento ficam travados. Pra mudar, fala com o suporte.",
  OWNER_BIRTH_DATE_LOCKED:
    "Depois do primeiro pagamento, o CPF e o nascimento ficam travados. Pra mudar, fala com o suporte.",
  OWNER_NOT_FOUND: ({ context: { adminAccounts } }) =>
    adminAccounts ? "Esse perfil de tutor não existe mais." : "Não achamos seu perfil de tutor. Fala com o suporte.",
  OWNER_SUSPENSION_REQUIRED: ({ context: { adminAccounts } }) =>
    adminAccounts ? "A conta não está suspensa. Recarregue os dados e confira o status." : GENERIC_ERROR_MESSAGE,
  OWNER_CPF_RELEASED: ({ context: { adminAccounts } }) =>
    adminAccounts ? "O CPF já foi liberado. Recarregue os dados da conta." : GENERIC_ERROR_MESSAGE,
  OWNER_HAS_OPEN_BOOKING: "Tem estadia pedida, marcada ou acontecendo. Cancela ou espera terminar pra pausar a conta.",
  HOST_NOT_FOUND: ({ context: { adminAccounts } }) =>
    adminAccounts ? "Esse perfil de anfitrião não existe mais." : "Seus dados ficam editáveis depois da verificação.",
  HOST_SUSPENSION_REQUIRED: ({ context: { adminAccounts } }) =>
    adminAccounts ? "A conta não está suspensa. Recarregue os dados e confira o status." : GENERIC_ERROR_MESSAGE,
  HOST_IDENTITY_RELEASED: ({ context: { adminAccounts } }) =>
    adminAccounts ? "A identidade já foi liberada. Recarregue os dados da conta." : GENERIC_ERROR_MESSAGE,
  AUTH_ADMIN_SUSPENSION_FORBIDDEN: ({ context: { adminAccounts } }) =>
    adminAccounts ? "Conta de admin não pode ser suspensa." : GENERIC_ERROR_MESSAGE,
  HOST_STRIPE_ACCOUNT_NOT_REJECTED: ({ context: { adminAccounts } }) =>
    adminAccounts
      ? "O cadastro Stripe não está recusado. Recarregue os dados e confira o status."
      : GENERIC_ERROR_MESSAGE,
  HOST_HAS_OPEN_BOOKING:
    "Tem estadia pedida, marcada ou acontecendo no seu cantinho. Resolve ela antes de pausar a conta.",
  HOST_NOT_A_COMPANY: "Esses dados são só de conta de empresa.",
  PAYLOAD_TOO_LARGE: "Essa foto não serve: use JPG, PNG ou WebP de até 5 MB.",
  UNSUPPORTED_MEDIA_TYPE: "Esse arquivo não é uma foto: use JPG, PNG ou WebP.",
  HOST_CPF_ALREADY_REGISTERED: ({ context }) =>
    context.adminReview
      ? "Esse CPF/CNPJ já pertence a outro anfitrião. Recuse com 'Os dados não batem' ou abra a conta indevida em Contas."
      : "Esse CPF já está em outra conta. Se ele é seu, fala com o suporte que a gente resolve.",
  HOST_CNPJ_ALREADY_REGISTERED: ({ context }) =>
    context.adminReview
      ? "Esse CPF/CNPJ já pertence a outro anfitrião. Recuse com 'Os dados não batem' ou abra a conta indevida em Contas."
      : "Esse CNPJ já está em outra conta. Se a empresa é sua, fala com o suporte.",
  HOST_APPLICATION_CONFLICT: "Outra pessoa da equipe já decidiu essa verificação.",
  HOST_APPLICATION_NOT_UNDER_REVIEW: "Outra pessoa da equipe já decidiu essa verificação.",
  HOST_APPLICATION_NOT_FOUND: "Não encontramos essa verificação. Volte para a fila.",
  HOST_APPLICATION_DOCUMENT_NOT_FOUND: "Essa foto não está mais disponível. Recarregue a verificação.",
  AUTH_LINKED_ACCOUNT_NOT_FOUND: "Não deu pra abrir a outra conta. Confere a senha dela.",
  AUTH_PASSWORD_RESET_TOKEN_INVALID: "Esse link já venceu. Pede outro, leva um minuto.",
} satisfies CopyCatalog;
