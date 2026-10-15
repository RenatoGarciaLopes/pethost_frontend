import { z } from "zod";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import { GetApiV1OwnersOwnerIdResponse } from "@/shared/api/generated/owners/owners.zod";
const generated = unwrapData(GetApiV1OwnersOwnerIdResponse);
/** Perfil administrativo derivado do OpenAPI; CPF/user ausentes são aceitos como na API.
 * @example adminOwnerSchema.parse(dto)
 */
export const adminOwnerSchema = generated.extend({
  user: generated.shape.user
    .unwrap()
    .options[1].extend({ role: z.literal("owner") })
    .nullish(),
});
/** Lista de tutores sem paginação na API. @example adminOwnerListSchema.parse([]) */
export const adminOwnerListSchema = z.array(adminOwnerSchema);
/** Tutor administrativo, sem DTO paralelo manual. @example const owner: AdminOwner = adminOwnerSchema.parse(dto); */
export type AdminOwner = z.output<typeof adminOwnerSchema>;
