import type { CopyCatalog } from "../../copyTypes";
import { invalid, invalidCharacters, numberParam, required, tooLong, upTo } from "../phrases";

/** Validação de campo: review. */
export const reviewValidationCopy = {
  REVIEW_BATCH_SIZE_INVALID: upTo("o tamanho do lote"),
  REVIEW_BOOKING_ID_REQUIRED: required("a estadia"),
  REVIEW_COMMENT_INVALID_CHARACTERS: invalidCharacters("o comentário"),
  REVIEW_COMMENT_TOO_LONG: tooLong("o comentário"),
  REVIEW_DESCRIPTION_INVALID_CHARACTERS: invalidCharacters("a descrição"),
  REVIEW_DESCRIPTION_REQUIRED: required("a descrição"),
  REVIEW_DESCRIPTION_TOO_LONG: tooLong("a descrição"),
  REVIEW_HIDE_REASON_INVALID_CHARACTERS: invalidCharacters("o motivo"),
  REVIEW_HIDE_REASON_REQUIRED: required("o motivo"),
  REVIEW_HIDE_REASON_TOO_LONG: tooLong("o motivo"),
  REVIEW_HOST_ID_INVALID: invalid("o anfitrião"),
  REVIEW_LISTING_ID_INVALID: invalid("o cantinho"),
  REVIEW_NOTE_INVALID_CHARACTERS: invalidCharacters("a observação"),
  REVIEW_NOTE_REQUIRED: required("a observação"),
  REVIEW_NOTE_TOO_LONG: tooLong("a observação"),
  REVIEW_OUTCOME_INVALID: invalid("o resultado"),
  REVIEW_OWNER_ID_INVALID: invalid("o tutor"),
  REVIEW_PAGE_INVALID: invalid("a página"),
  REVIEW_PAGE_SIZE_INVALID: upTo("o tamanho da página"),
  REVIEW_PET_COMMENT_INVALID_CHARACTERS: "O comentário do pet tem caracteres que a gente não aceita.",
  REVIEW_PET_COMMENT_TOO_LONG: ({ params }) => {
    const max = numberParam(params, "max");
    return max ? `O comentário do pet aceita até ${max} caracteres.` : "O comentário do pet está longo demais.";
  },
  REVIEW_PET_DUPLICATED: "O mesmo pet apareceu duas vezes na avaliação.",
  REVIEW_PET_ID_INVALID: invalid("o pet"),
  REVIEW_PET_ID_REQUIRED: "Escolhe os pets da avaliação.",
  REVIEW_PET_NOT_IN_STAY: "Esse pet não fez parte da estadia.",
  REVIEW_PET_RATING_INVALID: ({ params }) => {
    const min = numberParam(params, "min");
    const max = numberParam(params, "max");
    return min && max ? `A nota do pet precisa ser de ${min} a ${max}.` : "Confere a nota do pet.";
  },
  REVIEW_PETS_NOT_ALLOWED: "Essa avaliação não leva pets.",
  REVIEW_RATING_INVALID: ({ params }) => {
    const min = numberParam(params, "min");
    const max = numberParam(params, "max");
    return min && max ? `A nota precisa ser de ${min} a ${max}.` : "Confere a nota.";
  },
  REVIEW_RATING_REQUIRED: required("a nota"),
  REVIEW_RATING_SCOPE_INVALID: "Esse filtro de nota não vale.",
  REVIEW_REASON_INVALID: invalid("o motivo"),
  REVIEW_REMINDER_DELAY_INVALID: ({ params }) => {
    const max = numberParam(params, "max");
    return max ? `O atraso do lembrete vai de 1 a ${max} horas.` : "Confere o atraso do lembrete.";
  },
  REVIEW_REPLY_INVALID_CHARACTERS: invalidCharacters("o texto"),
  REVIEW_REPLY_REQUIRED: required("o texto"),
  REVIEW_REPLY_TOO_LONG: tooLong("o texto"),
  REVIEW_REPORT_ID_REQUIRED: required("a denúncia"),
  REVIEW_REVIEW_ID_REQUIRED: required("a avaliação"),
  REVIEW_STATUS_INVALID: "Esse filtro de status não existe.",
} satisfies CopyCatalog;
