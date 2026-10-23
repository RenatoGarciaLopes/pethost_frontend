import type { CopyCatalog } from "../copyTypes";
import { GENERIC_ERROR_MESSAGE } from "../fallbackCopy";

/** Transversais da API. */
export const commonErrorCopy = {
  VALIDATION_ERROR: "Alguns campos precisam de ajuste. Confere as mensagens embaixo de cada um.",
  UNAUTHORIZED: "Sua sessão terminou. Entra de novo pra continuar.",
  FORBIDDEN: "Essa parte não está disponível pra sua conta.",
  TOO_MANY_REQUESTS: ({ retryAfterSeconds: seconds }) =>
    seconds === undefined
      ? "Muitas tentativas seguidas. Respira e tenta de novo daqui a pouco."
      : `Muitas tentativas seguidas. Respira e tenta de novo em ${seconds} ${seconds === 1 ? "segundo" : "segundos"}.`,
  UNEXPECTED_ERROR: GENERIC_ERROR_MESSAGE,
} satisfies CopyCatalog;
