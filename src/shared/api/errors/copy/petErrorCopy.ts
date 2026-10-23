import type { CopyCatalog } from "../copyTypes";

/** Pets e busca por endereço. */
export const petErrorCopy = {
  LISTING_SEARCH_ADDRESS_REQUIRED: "Pra procurar perto de casa, a gente precisa do seu endereço.",
  LISTING_SEARCH_ADDRESS_NOT_LOCATED: "Não achamos seu endereço no mapa. Confere ele ou procura por cidade.",
  PET_PHOTO_LIMIT_REACHED: "Já tem 3 fotos. Tira uma pra colocar outra.",
  PET_PHOTO_ALREADY_EXISTS: "Essa foto já está na ficha.",
  PET_MICROCHIP_ALREADY_REGISTERED: "Esse microchip já está em outro pet. Se é o seu, fala com o suporte.",
  PET_KEEPER_NOT_FOUND: "Os pets da casa entram depois que sua verificação for aprovada.",
  PET_HOST_NOT_FOUND: "Não achamos os pets dessa casa agora.",
} satisfies CopyCatalog;
