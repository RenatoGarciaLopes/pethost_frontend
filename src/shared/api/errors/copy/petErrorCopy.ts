import type { CopyCatalog } from "../copyTypes";
import { numberParam } from "./phrases";

/** Pets e busca por endereço. */
export const petErrorCopy = {
  LISTING_SEARCH_ADDRESS_REQUIRED: "Pra procurar perto de casa, a gente precisa do seu endereço.",
  LISTING_SEARCH_ADDRESS_NOT_LOCATED: "Não achamos seu endereço no mapa. Confere ele ou procura por cidade.",
  PET_PHOTO_LIMIT_REACHED: ({ params }) =>
    `Já tem ${numberParam(params, "max") ?? 3} fotos. Tira uma pra colocar outra.`,
  PET_PHOTO_ALREADY_EXISTS: "Essa foto já está na ficha.",
  PET_MICROCHIP_ALREADY_REGISTERED: "Esse microchip já está em outro pet. Se é o seu, fala com o suporte.",
  PET_KEEPER_NOT_FOUND: "Os pets da casa entram depois que sua verificação for aprovada.",
  PET_HOST_NOT_FOUND: "Não achamos os pets dessa casa agora.",
  PET_HAS_OPEN_BOOKING: "Esse pet tem estadia pedida, marcada ou acontecendo. Resolve ela antes.",
  PET_NOT_FOUND: "Não achamos esse pet.",
  PET_PHOTO_NOT_FOUND: "Não achamos essa foto.",
} satisfies CopyCatalog;
