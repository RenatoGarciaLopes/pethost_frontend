import type { CopyCatalog } from "../copyTypes";

/** Avaliações das estadias. */
export const reviewErrorCopy = {
  REVIEW_ALREADY_EXISTS: "Você já avaliou essa estadia.",
  REVIEW_ALREADY_PUBLISHED: "Essa avaliação já foi publicada.",
  REVIEW_BOOKING_NOT_COMPLETED: "Dá pra avaliar depois que a estadia termina.",
  REVIEW_BOOKING_NOT_FOUND: "Não achamos essa estadia.",
  REVIEW_CONFLICT: "A avaliação mudou enquanto você olhava. Confere de novo.",
  REVIEW_HIDDEN_BY_MODERATION: "Essa avaliação foi ocultada pela equipe.",
  REVIEW_HOST_DEACTIVATED: "A conta desse anfitrião está pausada.",
  REVIEW_HOST_NOT_FOUND: "Não achamos esse anfitrião.",
  REVIEW_NOT_FOUND: "Não achamos essa avaliação.",
  REVIEW_OWNER_DEACTIVATED: "A conta desse tutor está pausada.",
  REVIEW_OWNER_NOT_FOUND: "Não achamos esse tutor.",
  REVIEW_REPORT_ALREADY_EXISTS: "Você já denunciou essa avaliação.",
  REVIEW_REPORT_ALREADY_RESOLVED: "Essa denúncia já foi resolvida.",
  REVIEW_REPORT_NOT_FOUND: "Não achamos essa denúncia.",
  REVIEW_REPORT_OWN_REVIEW: "Você não pode denunciar a sua própria avaliação.",
  REVIEW_WINDOW_CLOSED: "O prazo pra avaliar essa estadia passou.",
} satisfies CopyCatalog;
