import type { CopyCatalog } from "../copyTypes";

/** Cantinho. */
export const listingErrorCopy = {
  LISTING_HOST_PAYOUTS_NOT_ENABLED: "Seu cantinho abre depois que o recebimento estiver conectado.",
  LISTING_LIMIT_REACHED: "Você já tem um cantinho. Dá pra editar ele quando quiser.",
  LISTING_HOST_NOT_FOUND: "O cantinho abre depois que a sua verificação for aprovada.",
  LISTING_HOST_DEACTIVATED: "Sua conta de anfitrião está pausada. Reative a conta pra mexer no cantinho.",
  LISTING_GEOCODER_UNAVAILABLE: "Não conseguimos achar o endereço no mapa agora. Tenta de novo em alguns minutos.",
  LISTING_ADDRESS_NOT_LOCATED: "Não achamos esse endereço no mapa. Confere o CEP, a rua e o número.",
  LISTING_PHOTO_LIMIT_REACHED: "Já tem 5 fotos. Tira uma pra colocar outra.",
  LISTING_PHOTO_ALREADY_EXISTS: "Essa foto já está no cantinho.",
  LISTING_NOT_FOUND: "Não achamos esse cantinho.",
} satisfies CopyCatalog;
