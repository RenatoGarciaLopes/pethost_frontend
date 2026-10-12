/**
 * Substituto do pacote `server-only` nos testes Vitest.
 *
 * O pacote real lança erro quando importado fora do ambiente de servidor do React;
 * nos testes de unidade e integração queremos exercitar o código de servidor em Node.
 * A proteção real continua valendo no build do Next e no lint (spec 001, REQ-TOOL-006).
 */
export {};
