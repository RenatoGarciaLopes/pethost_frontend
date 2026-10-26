import { GetApiV1ListingsListingIdParams } from "@/shared/api/generated/listings/listings.zod";

/**
 * O segmento da URL é um id de cantinho possível (UUID)? Id inválido vai direto para o 404, sem chamar a API.
 * @example isListingId("casa-da-cida") // false
 */
export const isListingId = (value: string): boolean =>
  GetApiV1ListingsListingIdParams.safeParse({ listingId: value }).success;
