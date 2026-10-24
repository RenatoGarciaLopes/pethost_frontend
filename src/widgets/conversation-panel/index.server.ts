import "server-only";

/**
 * API pública server do widget conversation-panel (spec 055): a tela de Conversas montada no servidor.
 * Não importe este índice em componentes client.
 */
export { ConversationsScreen } from "./components/server/ConversationsScreen";
export type { ConversationsScreenProps } from "./components/server/ConversationsScreen";
