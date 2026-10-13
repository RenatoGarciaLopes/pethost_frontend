import { z } from "zod";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import {
  GetApiV1OwnersMeResponse,
  PatchApiV1OwnersMeResponse,
  PutApiV1OwnersMeAvatarResponse,
  DeleteApiV1OwnersMeAvatarResponse,
} from "@/shared/api/generated/owners/owners.zod";
import { GetApiV1HostsMeResponse } from "@/shared/api/generated/hosts/hosts.zod";
import {
  PatchApiV1HostsMeResponse,
  PutApiV1HostsMeAvatarResponse,
  DeleteApiV1HostsMeAvatarResponse,
} from "@/shared/api/generated/host-profile/host-profile.zod";
import { GetApiV1UsersMeResponse } from "@/shared/api/generated/users/users.zod";
import type { AccountProfile } from "../../types/accountProfile";

/** Frescor do perfil em SSR e client. @example staleTime: ACCOUNT_PROFILE_STALE_TIME */
export const ACCOUNT_PROFILE_STALE_TIME = 60_000;
type OwnerDto = NonNullable<z.infer<typeof GetApiV1OwnersMeResponse>["data"]>;
function baseProfile(dto: OwnerDto, role: AccountProfile["role"]): AccountProfile {
  const user = dto.user!;
  return {
    role,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? "",
    birthDate: user.birthDate ?? null,
    cpf: dto.cpf ?? null,
    address: user.address ?? null,
    avatarUrl: user.avatarUrl ?? null,
    memberSince: dto.createdAt,
    company: null,
    verified: true,
  };
}
function ownerModel(response: typeof GetApiV1OwnersMeResponse) {
  return unwrapData(response)
    .superRefine((dto, context) => {
      if (!dto.user || dto.user.role !== "owner")
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["user"],
          message: "Conta de tutor ausente ou incompatível.",
        });
    })
    .transform((dto) => baseProfile(dto, "owner"));
}
function hostModel(response: typeof GetApiV1HostsMeResponse) {
  return unwrapData(response)
    .superRefine((dto, context) => {
      if (!dto.user || dto.user.role !== "host")
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["user"],
          message: "Conta de anfitrião ausente ou incompatível.",
        });
    })
    .transform((dto): AccountProfile => ({ ...baseProfile(dto, "host"), company: dto.company ?? null }));
}
/** Contratos gerados por operação, transformados no modelo interno. @example transport.request(request, profileSchemas.owner.load) */
export const profileSchemas = {
  owner: {
    load: ownerModel(GetApiV1OwnersMeResponse),
    save: ownerModel(PatchApiV1OwnersMeResponse),
    upload: ownerModel(PutApiV1OwnersMeAvatarResponse),
    remove: ownerModel(DeleteApiV1OwnersMeAvatarResponse),
  },
  host: {
    load: hostModel(GetApiV1HostsMeResponse),
    save: hostModel(PatchApiV1HostsMeResponse),
    upload: hostModel(PutApiV1HostsMeAvatarResponse),
    remove: hostModel(DeleteApiV1HostsMeAvatarResponse),
  },
};
/** Conta de anfitrião antes da aprovação; /users/me não oferece createdAt. @example transport.request(request, unverifiedHostSchema) */
export const unverifiedHostSchema = unwrapData(GetApiV1UsersMeResponse)
  .superRefine((user, context) => {
    if (user.role !== "host")
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["role"], message: "Papel incompatível com anfitrião." });
  })
  .transform((user): AccountProfile => ({
    role: "host",
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? "",
    birthDate: user.birthDate ?? null,
    cpf: null,
    address: user.address ?? null,
    avatarUrl: user.avatarUrl ?? null,
    memberSince: null,
    company: null,
    verified: false,
  }));
