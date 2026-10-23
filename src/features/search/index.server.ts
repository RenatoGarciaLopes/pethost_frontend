import "server-only";
/** Prefetch da busca para a home e da compatibilidade para a página do cantinho, exclusivo do servidor. */
export { prefetchSearch, prefetchCompatibility } from "./api/server/search.server";
