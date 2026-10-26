import type { CopyCatalog } from "../../copyTypes";
import { digits, inFuture, invalid, numberParam, required, tooLong } from "../phrases";

/** Validação de campo: auth. */
export const authValidationCopy = {
  AUTH_ADDRESS_REQUIRED: required("o endereço"),
  AUTH_ADDRESS_STATE_INVALID: "Escolhe o estado pela sigla, como PR.",
  AUTH_AVATAR_URL_INVALID: invalid("o endereço da foto"),
  AUTH_AVATAR_URL_TOO_LONG: tooLong("o endereço da foto"),
  AUTH_BIRTH_DATE_IN_FUTURE: inFuture("a data de nascimento"),
  AUTH_BIRTH_DATE_INVALID_FORMAT: invalid("a data de nascimento"),
  AUTH_BIRTH_DATE_REQUIRED: required("a data de nascimento"),
  AUTH_CITY_REQUIRED: required("a cidade"),
  AUTH_CITY_TOO_LONG: tooLong("a cidade"),
  AUTH_COMPLEMENT_TOO_LONG: tooLong("o complemento"),
  AUTH_CURRENT_PASSWORD_INCORRECT: "A senha atual não confere.",
  AUTH_CURRENT_PASSWORD_REQUIRED: required("a senha atual"),
  AUTH_EMAIL_INVALID_FORMAT: invalid("o e-mail"),
  AUTH_EMAIL_REQUIRED: required("o e-mail"),
  AUTH_EMAIL_TOO_LONG: tooLong("o e-mail"),
  AUTH_FULL_NAME_REQUIRED: required("o nome completo"),
  AUTH_FULL_NAME_TOO_LONG: tooLong("o nome completo"),
  AUTH_NEIGHBORHOOD_REQUIRED: required("o bairro"),
  AUTH_NEIGHBORHOOD_TOO_LONG: tooLong("o bairro"),
  AUTH_NEW_PASSWORD_SAME_AS_CURRENT: "A senha nova não pode ser igual à atual.",
  AUTH_PASSWORD_MISSING_DIGIT: "A senha precisa de pelo menos um número.",
  AUTH_PASSWORD_MISSING_LOWERCASE: "A senha precisa de pelo menos uma letra minúscula.",
  AUTH_PASSWORD_MISSING_SPECIAL_CHARACTER: "A senha precisa de pelo menos um caractere especial.",
  AUTH_PASSWORD_MISSING_UPPERCASE: "A senha precisa de pelo menos uma letra maiúscula.",
  AUTH_PASSWORD_REQUIRED: required("a senha"),
  AUTH_PASSWORD_TOO_LONG: tooLong("a senha"),
  AUTH_PASSWORD_TOO_SHORT: ({ params }) => {
    const min = numberParam(params, "min");
    return min ? `A senha precisa ter pelo menos ${min} caracteres.` : "A senha está curta demais.";
  },
  AUTH_PHONE_INVALID: ({ params }) => {
    const min = numberParam(params, "min");
    const max = numberParam(params, "max");
    return min && max
      ? `O telefone precisa ter de ${min} a ${max} dígitos, com DDD.`
      : "Confere o telefone: com DDD e só números.";
  },
  AUTH_PHONE_REQUIRED: required("o telefone"),
  AUTH_REFRESH_TOKEN_REQUIRED: required("a sessão"),
  AUTH_RESET_TOKEN_REQUIRED: required("o link"),
  AUTH_ROLE_INVALID: "Escolhe tutor ou anfitrião.",
  AUTH_ROLE_REQUIRED: required("o tipo de conta"),
  AUTH_ROLE_UNKNOWN: "Escolhe tutor ou anfitrião.",
  AUTH_STATE_INVALID: "Escolhe o estado pela sigla, como PR.",
  AUTH_STREET_NUMBER_REQUIRED: required("o número"),
  AUTH_STREET_NUMBER_TOO_LONG: tooLong("o número"),
  AUTH_STREET_REQUIRED: required("a rua"),
  AUTH_STREET_TOO_LONG: tooLong("a rua"),
  AUTH_SUSPENSION_REASON_REQUIRED: required("o motivo"),
  AUTH_SUSPENSION_REASON_TOO_LONG: tooLong("o motivo"),
  AUTH_UNDERAGE: ({ params }) => {
    const min = numberParam(params, "min");
    return min ? `Pra ter conta é preciso ter pelo menos ${min} anos.` : "Pra ter conta é preciso ser maior de idade.";
  },
  AUTH_ZIP_CODE_INVALID: digits("o CEP"),
  OWNER_CPF_INVALID: invalid("o CPF"),
  OWNER_CURRENT_PASSWORD_INCORRECT: "A senha atual não confere.",
  OWNER_CURRENT_PASSWORD_REQUIRED: required("a senha atual"),
  OWNER_DELETION_PASSWORD_REQUIRED: required("a senha atual"),
  OWNER_EMAIL_REQUIRED: required("o e-mail"),
  OWNER_PASSWORD_REQUIRED: required("a senha"),
  OWNER_REASON_REQUIRED: required("o motivo"),
  OWNER_REASON_TOO_LONG: tooLong("o motivo"),
  OWNER_USER_ID_REQUIRED: required("o usuário"),
} satisfies CopyCatalog;
