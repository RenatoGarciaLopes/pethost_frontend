import type { CopyCatalog } from "../copyTypes";
import { numberParam } from "./phrases";

/** Cantinho. */
export const listingErrorCopy = {
  LISTING_HOST_PAYOUTS_NOT_ENABLED: "Seu cantinho abre depois que o recebimento estiver conectado.",
  LISTING_LIMIT_REACHED: "Você já tem um cantinho. Dá pra editar ele quando quiser.",
  LISTING_HOST_NOT_FOUND: "O cantinho abre depois que a sua verificação for aprovada.",
  LISTING_HOST_DEACTIVATED: "Sua conta de anfitrião está pausada. Reative a conta pra mexer no cantinho.",
  LISTING_GEOCODER_UNAVAILABLE: "Não conseguimos achar o endereço no mapa agora. Tenta de novo em alguns minutos.",
  LISTING_ADDRESS_NOT_LOCATED: "Não achamos esse endereço no mapa. Confere o CEP, a rua e o número.",
  LISTING_PHOTO_LIMIT_REACHED: ({ params }) =>
    `Já tem ${numberParam(params, "max") ?? 5} fotos. Tira uma pra colocar outra.`,
  LISTING_PHOTO_ALREADY_EXISTS: "Essa foto já está no cantinho.",
  LISTING_NOT_FOUND: "Não achamos esse cantinho.",
  LISTING_AVAILABILITY_BLOCK_LIMIT_REACHED: "Já tem bloqueios demais no calendário. Remove algum pra criar outro.",
  LISTING_AVAILABILITY_BLOCK_NOT_FOUND: "Não achamos esse bloqueio.",
  LISTING_AVAILABILITY_BLOCK_OVERLAP: "Já existe um bloqueio nessas datas.",
  LISTING_HAS_OPEN_BOOKING: "Tem estadia pedida, marcada ou acontecendo nesse cantinho. Resolve ela antes.",
  LISTING_OWNER_NOT_FOUND: "Não achamos o seu perfil de tutor.",
  LISTING_PET_NOT_FOUND: "Não achamos esse pet.",
  LISTING_PHOTO_NOT_FOUND: "Não achamos essa foto.",
} satisfies CopyCatalog;
