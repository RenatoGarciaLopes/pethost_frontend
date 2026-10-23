import { unwrapData } from "@/shared/api/contracts/unwrapData";
import type { z } from "zod";
import { GetApiV1ListingsListingIdResponse } from "@/shared/api/generated/listings/listings.zod";
import { GetApiV1ReviewsResponse } from "@/shared/api/generated/reviews/reviews.zod";

/** Contrato validado do detalhe de cantinho conforme OpenAPI. */
export const listingDetailSchema = unwrapData(GetApiV1ListingsListingIdResponse);
export type ListingDetail = z.infer<typeof listingDetailSchema>;

/** Página pública de avaliações dos tutores (`GET /reviews?listingId=`), sem envelope. */
export const listingReviewsSchema = unwrapData(GetApiV1ReviewsResponse);
/** Uma avaliação de tutor sobre a estadia no cantinho. */
export type ListingReview = z.infer<typeof listingReviewsSchema>["items"][number];
