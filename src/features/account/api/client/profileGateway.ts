import { bffClient } from "@/shared/api/client/bffClient";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import { hasErrorCode } from "@/shared/api/errors/ApiError";
import { translateCode } from "@/shared/api/errors/translateError";
import {
  PatchApiV1OwnersMeBody,
  PostApiV1OwnersMeDeactivateResponse,
  PutApiV1OwnersMeAvatarBody,
} from "@/shared/api/generated/owners/owners.zod";
import {
  PatchApiV1HostsMeBody,
  PostApiV1HostsMeDeactivateResponse,
  PutApiV1HostsMeAvatarBody,
} from "@/shared/api/generated/host-profile/host-profile.zod";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import type { AccountProfile, AccountProfilePatch, FieldEditability, ProfileField } from "../../types/accountProfile";
import { profileSchemas, unverifiedHostSchema } from "../contracts/profile";
/** Porta da tela: operações e regras por papel, sem expor DTOs. */
export interface ProfileGateway {
  role: PersonalRole;
  load(): Promise<AccountProfile>;
  save(patch: AccountProfilePatch): Promise<AccountProfile>;
  uploadAvatar(file: File): Promise<AccountProfile>;
  removeAvatar(): Promise<AccountProfile>;
  deactivate(): Promise<void>;
  editability(profile: AccountProfile): FieldEditability;
}
const fields: ProfileField[] = [
  "fullName",
  "email",
  "phone",
  "birthDate",
  "cpf",
  "address",
  "avatarUrl",
  "cnpj",
  "legalName",
  "tradeName",
  "companyAddress",
];
function editability(profile: AccountProfile): FieldEditability {
  const result = Object.fromEntries(fields.map((field) => [field, { mode: "free" }])) as FieldEditability;
  result.email = { mode: "locked", reason: "O e-mail é o seu login e não muda por aqui." };
  const companyFields = ["cnpj", "legalName", "tradeName", "companyAddress"] as const;
  if (!profile.company) for (const field of companyFields) result[field] = { mode: "hidden" };
  if (profile.role === "host") {
    if (!profile.verified) {
      for (const field of fields) {
        if (result[field].mode !== "hidden" && field !== "email")
          result[field] = { mode: "locked", reason: translateCode("HOST_NOT_FOUND") };
      }
      result.avatarUrl = { mode: "hidden" };
    } else {
      for (const field of [
        "fullName",
        "birthDate",
        "cpf",
        ...(profile.company ? (["cnpj", "legalName"] as const) : []),
      ] as const)
        result[field] = { mode: "locked", reason: translateCode("HOST_IDENTITY_LOCKED") };
    }
  }
  return result;
}
/**
 * Monta o adaptador validado por papel com o transporte recebido.
 * HOST_NOT_FOUND faz fallback só na leitura; outras falhas permanecem ApiError.
 * @example const profile = await gatewayFor("owner").load();
 */
function createProfileGateway(role: PersonalRole, transport: HttpTransport): ProfileGateway {
  const path = `/${role}s/me`;
  const schemas = profileSchemas[role];
  return {
    role,
    async load() {
      try {
        return await transport.request({ method: "GET", path }, schemas.load);
      } catch (error) {
        if (role === "host" && hasErrorCode(error, "HOST_NOT_FOUND"))
          return transport.request({ method: "GET", path: "/users/me" }, unverifiedHostSchema);
        throw error;
      }
    },
    save: (patch) =>
      transport.request(
        {
          method: "PATCH",
          path,
          body: (role === "owner" ? PatchApiV1OwnersMeBody : PatchApiV1HostsMeBody).parse(patch),
        },
        schemas.save,
      ),
    uploadAvatar: (file) => {
      (role === "owner" ? PutApiV1OwnersMeAvatarBody : PutApiV1HostsMeAvatarBody).parse({ file });
      const body = new FormData();
      body.append("file", file);
      return transport.request({ method: "PUT", path: `${path}/avatar`, body }, schemas.upload);
    },
    removeAvatar: () => transport.request({ method: "DELETE", path: `${path}/avatar` }, schemas.remove),
    async deactivate() {
      await transport.request(
        { method: "POST", path: `${path}/deactivate` },
        unwrapData(role === "owner" ? PostApiV1OwnersMeDeactivateResponse : PostApiV1HostsMeDeactivateResponse),
      );
    },
    editability,
  };
}
/** Adaptador de tutor pelo BFF; livre até a API sinalizar trava por pagamento. @example await ownerProfileGateway.save({ phone: "11999999999" }); */
export const ownerProfileGateway: ProfileGateway = createProfileGateway("owner", bffClient);
/** Adaptador de anfitrião pelo BFF, com identidade travada e fallback de leitura. @example const fields = hostProfileGateway.editability(profile); */
export const hostProfileGateway: ProfileGateway = createProfileGateway("host", bffClient);

/** Seleciona o adaptador BFF existente; transporte explícito cria um adaptador isolado para SSR/testes. @example const gateway = gatewayFor("host"); */
export function gatewayFor(role: PersonalRole, transport: HttpTransport = bffClient): ProfileGateway {
  return transport === bffClient
    ? role === "owner"
      ? ownerProfileGateway
      : hostProfileGateway
    : createProfileGateway(role, transport);
}
