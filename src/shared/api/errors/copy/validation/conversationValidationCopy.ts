import type { CopyCatalog } from "../../copyTypes";
import { invalid, invalidCharacters, required, tooLong, upTo } from "../phrases";

/** Validação de campo: conversation. */
export const conversationValidationCopy = {
  CONVERSATION_BATCH_SIZE_INVALID: upTo("o tamanho do lote"),
  CONVERSATION_BEFORE_INVALID: invalid("a data de corte"),
  CONVERSATION_BODY_INVALID_CHARACTERS: invalidCharacters("a mensagem"),
  CONVERSATION_BODY_REQUIRED: required("a mensagem"),
  CONVERSATION_BODY_TOO_LONG: tooLong("a mensagem"),
  CONVERSATION_CONVERSATION_ID_REQUIRED: required("a conversa"),
  CONVERSATION_DESCRIPTION_INVALID_CHARACTERS: invalidCharacters("a descrição"),
  CONVERSATION_DESCRIPTION_REQUIRED: required("a descrição"),
  CONVERSATION_DESCRIPTION_TOO_LONG: tooLong("a descrição"),
  CONVERSATION_INACTIVITY_DAYS_INVALID: invalid("os dias de inatividade"),
  CONVERSATION_LISTING_ID_REQUIRED: required("o cantinho"),
  CONVERSATION_MESSAGE_ID_REQUIRED: required("a mensagem"),
  CONVERSATION_NOTE_INVALID_CHARACTERS: invalidCharacters("a observação"),
  CONVERSATION_NOTE_REQUIRED: required("a observação"),
  CONVERSATION_NOTE_TOO_LONG: tooLong("a observação"),
  CONVERSATION_OUTCOME_INVALID: invalid("o resultado"),
  CONVERSATION_PAGE_INVALID: invalid("a página"),
  CONVERSATION_PAGE_SIZE_INVALID: upTo("o tamanho da página"),
  CONVERSATION_PARTY_ID_REQUIRED: required("o usuário"),
  CONVERSATION_PARTY_INVALID: invalid("o usuário"),
  CONVERSATION_REASON_INVALID: invalid("o motivo"),
  CONVERSATION_REPORT_ID_REQUIRED: required("a denúncia"),
  CONVERSATION_STATUS_INVALID: "Esse filtro de status não existe.",
  CONVERSATION_UNREAD_COOLDOWN_INVALID: invalid("o intervalo"),
  CONVERSATION_UNREAD_DELAY_INVALID: invalid("o atraso"),
  CONVERSATION_UNREAD_MESSAGES_EMAIL_REQUIRED: required("o aviso por e-mail"),
} satisfies CopyCatalog;
