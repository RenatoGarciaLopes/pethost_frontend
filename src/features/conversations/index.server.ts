import "server-only";

/**
 * API pública server de conversations.
 * Exporte aqui RSC, chamadas ao backend e recursos exclusivos do servidor.
 * Não importe este índice em componentes client.
 */
export { getConversation, prefetchMessages, prefetchMyConversations } from "./api/server/conversations.server";
