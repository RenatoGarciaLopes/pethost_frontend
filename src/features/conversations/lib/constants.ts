/** Tamanho máximo do texto de uma mensagem ou legenda de foto (API: `body` até 2.000 caracteres). */
export const MAX_MESSAGE_LENGTH = 2000;

/**
 * Sem o hub de tempo real, a conversa aberta se atualiza a cada 5 s e a lista e o contador a cada 15 s. Fica bem abaixo
 * do limite geral da API (120 por minuto por conta).
 */
export const THREAD_POLL_MS = 5_000;
export const LIST_POLL_MS = 15_000;

/** Mensagens por página (API: 1 a 100, padrão 50). */
export const MESSAGE_PAGE_SIZE = 50;

/** Conversas na lista (API: até 100 por página). */
export const LIST_PAGE_SIZE = 50;
