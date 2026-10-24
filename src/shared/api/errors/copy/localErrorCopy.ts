import type { CopyCatalog } from "../copyTypes";

/** Locais (transporte e BFF), que não vêm da API. */
export const localErrorCopy = {
  NETWORK_ERROR: "Parece que a conexão caiu. Confere a internet e tenta de novo.",
  SESSION_EXPIRED: "Sua sessão terminou. Entra de novo pra continuar.",
  CSRF_REJECTED: "Por segurança, recarrega a página e tenta de novo.",
} satisfies CopyCatalog;
