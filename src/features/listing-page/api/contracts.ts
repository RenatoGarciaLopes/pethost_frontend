import { unwrapData } from "@/shared/api/contracts/unwrapData";
import type { z } from "zod";
import { GetApiV1ListingsListingIdResponse } from "@/shared/api/generated/listings/listings.zod";

/** Contrato validado do detalhe de cantinho conforme OpenAPI. */
export const listingDetailSchema = unwrapData(GetApiV1ListingsListingIdResponse);
export type ListingDetail = z.infer<typeof listingDetailSchema>;
