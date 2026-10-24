import type { CopyCatalog } from "../../copyTypes";
import { inPast, invalid, numberParam, required, tooFarAhead, tooLong, upTo } from "../phrases";

/** Validação de campo: booking. */
export const bookingValidationCopy = {
  BOOKING_ADMIN_REASON_REQUIRED: required("o motivo"),
  BOOKING_BOOKING_ID_REQUIRED: required("a estadia"),
  BOOKING_CHECK_IN_IN_THE_PAST: inPast("a chegada"),
  BOOKING_CHECK_IN_INVALID: invalid("a chegada"),
  BOOKING_CHECK_IN_REQUIRED: required("a chegada"),
  BOOKING_CHECK_IN_TOO_FAR_AHEAD: tooFarAhead("a chegada"),
  BOOKING_CHECK_OUT_INVALID: invalid("a saída"),
  BOOKING_CHECK_OUT_NOT_AFTER_CHECK_IN: "A saída precisa ser depois da chegada.",
  BOOKING_CHECK_OUT_REQUIRED: required("a saída"),
  BOOKING_LISTING_ID_REQUIRED: required("o cantinho"),
  BOOKING_PAGE_INVALID: invalid("a página"),
  BOOKING_PAGE_SIZE_INVALID: upTo("o tamanho da página"),
  BOOKING_PARTY_ID_REQUIRED: required("o usuário"),
  BOOKING_PET_IDS_INVALID: "Confere os pets escolhidos.",
  BOOKING_PET_IDS_REQUIRED: required("os pets"),
  BOOKING_PET_IDS_TOO_MANY: ({ params }) => {
    const max = numberParam(params, "max");
    return max ? `Dá pra pedir até ${max} pets por estadia.` : "Tem pet demais nesse pedido.";
  },
  BOOKING_REASON_TOO_LONG: tooLong("o motivo"),
  BOOKING_STATUS_FILTER_INVALID: "Esse filtro de status não existe.",
  BOOKING_STAY_TOO_LONG: ({ params }) => {
    const max = numberParam(params, "max");
    return max ? `A estadia pode ter até ${max} noites.` : "Essa estadia é longa demais.";
  },
  BOOKING_SUSPENDED_PARTY_INVALID: "Esse filtro de suspensão não vale.",
} satisfies CopyCatalog;
