import type { CopyCatalog } from "../copyTypes";

/** Recebimento Stripe Connect (spec 043). */
export const hostPayoutsErrorCopy = {
  HOST_STRIPE_UNAVAILABLE: "O Stripe não respondeu agora. Tenta de novo em alguns minutos.",
  HOST_STRIPE_REQUEST_REJECTED: "O Stripe não aceitou esses dados. Fala com o suporte pra gente conferir.",
  HOST_STRIPE_ONBOARDING_NOT_ALLOWED:
    "O cadastro de recebimento não está disponível pra essa conta agora. Fala com o suporte.",
  HOST_STRIPE_ACCOUNT_REJECTED:
    "O Stripe não aprovou o recebimento dessa conta. Fala com a gente pra entender o que aconteceu.",
  HOST_STRIPE_ACCOUNT_ALREADY_EXISTS: "Essa conta já tem recebimento conectado. Pra trocar, fala com o suporte.",
  HOST_STRIPE_ACCOUNT_NOT_FOUND: "Você ainda não começou seu cadastro de recebimento. Começa por aqui.",
} satisfies CopyCatalog;
