import type { Conversation, ConversationMessage, ConversationParty, ConversationSide } from "../types";
import { conversationsCopy } from "./conversationsCopy";

/**
 * Quem está do outro lado para quem vê: o tutor vê o anfitrião, e o anfitrião vê o tutor.
 * @example otherParty(conversation, "owner")?.name // "Dona Cida"
 */
export function otherParty(conversation: Conversation, viewer: ConversationSide): ConversationParty | null {
  return viewer === "owner" ? conversation.host : conversation.owner;
}

/**
 * Nome de quem está do outro lado, com "Conta removida" quando a conta sumiu.
 * @example otherPartyName(conversation, "owner") // "Dona Cida"
 */
export function otherPartyName(conversation: Conversation, viewer: ConversationSide): string {
  return otherParty(conversation, viewer)?.name ?? conversationsCopy.goneParty;
}

/**
 * A linha de baixo de cada conversa na lista: o texto da última mensagem, "Foto" quando é só foto e "Você: " quando
 * foi quem vê que mandou.
 *
 * @example lastMessagePreview(conversation.lastMessage, "owner") // "Você: Obrigada por tudo!"
 */
export function lastMessagePreview(message: ConversationMessage | null, viewer: ConversationSide): string {
  if (!message) return conversationsCopy.noMessages;
  const text = message.body?.trim() || conversationsCopy.photo;
  return message.sentBy === viewer ? conversationsCopy.youPrefix(text) : text;
}

/**
 * O aviso no lugar do campo de mensagem quando a conversa está bloqueada; `null` quando dá pra escrever.
 * A moderação vem primeiro: nenhum dos lados tira esse bloqueio.
 *
 * @example blockedNotice(conversation) // "Você bloqueou essa conversa. …"
 */
export function blockedNotice(conversation: Conversation): string | null {
  if (conversation.blockedByModeration) return conversationsCopy.blocked.byModeration;
  if (conversation.blockedByMe) return conversationsCopy.blocked.byMe;
  if (conversation.blocked) return conversationsCopy.blocked.byOther;
  return null;
}
