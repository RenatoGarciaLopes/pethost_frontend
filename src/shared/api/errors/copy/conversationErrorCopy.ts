import type { CopyCatalog } from "../copyTypes";

/** Conversas entre tutor e anfitrião. */
export const conversationErrorCopy = {
  CONVERSATION_ALREADY_BLOCKED: "Essa conversa já está bloqueada.",
  CONVERSATION_ALREADY_EXISTS: "Já existe uma conversa sobre esse cantinho.",
  CONVERSATION_BLOCKED: "Essa conversa está bloqueada.",
  CONVERSATION_BLOCKED_BY_MODERATION: "Essa conversa foi bloqueada pela equipe.",
  CONVERSATION_CONFLICT: "A conversa mudou enquanto você olhava. Confere de novo.",
  CONVERSATION_HOST_DEACTIVATED: "A conta desse anfitrião está pausada.",
  CONVERSATION_HOST_NOT_FOUND: "Não achamos esse anfitrião.",
  CONVERSATION_LISTING_NOT_FOUND: "Não achamos esse cantinho.",
  CONVERSATION_MESSAGE_NOT_FOUND: "Não achamos essa mensagem.",
  CONVERSATION_NOT_FOUND: "Não achamos essa conversa.",
  CONVERSATION_OWNER_DEACTIVATED: "A conta desse tutor está pausada.",
  CONVERSATION_OWNER_NOT_FOUND: "Não achamos esse tutor.",
  CONVERSATION_OWN_LISTING: "Você não pode conversar sobre o seu próprio cantinho.",
  CONVERSATION_RECIPIENT_SUSPENDED: "Não dá pra mandar mensagem pra essa conta agora.",
  CONVERSATION_REPORT_ALREADY_EXISTS: "Você já denunciou essa mensagem.",
  CONVERSATION_REPORT_ALREADY_RESOLVED: "Essa denúncia já foi resolvida.",
  CONVERSATION_REPORT_NOT_FOUND: "Não achamos essa denúncia.",
  CONVERSATION_REPORT_OWN_MESSAGE: "Você não pode denunciar a sua própria mensagem.",
  CONVERSATION_UNBLOCK_FORBIDDEN: "Só quem bloqueou pode desbloquear essa conversa.",
} satisfies CopyCatalog;
