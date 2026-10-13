import type { PersonalRole, SessionUser } from "@/shared/auth/contracts/session";
/** Endereço da conta, mesmo contrato gerado usado na sessão/cadastro da 011. */
export type Address = NonNullable<SessionUser["address"]>;
/** Modelo único do perfil; credenciais não fazem parte dos dados de leitura. */
export interface AccountProfile {
  role: PersonalRole;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string | null;
  cpf: string | null;
  address: Address | null;
  avatarUrl: string | null;
  memberSince: string | null;
  company: { cnpj: string; legalName: string; tradeName: string; address: Address } | null;
  verified: boolean;
}
/** Campos observados pela tela, incluindo a foto e dados de empresa. */
export type ProfileField =
  | "fullName"
  | "email"
  | "phone"
  | "birthDate"
  | "cpf"
  | "address"
  | "avatarUrl"
  | "cnpj"
  | "legalName"
  | "tradeName"
  | "companyAddress";
export type FieldEditability = Record<ProfileField, { mode: "free" | "locked" | "hidden"; reason?: string }>;
/** PATCH já normalizado para a API; e-mail e foto usam fluxos próprios. */
export interface AccountProfilePatch {
  fullName?: string;
  phone?: string;
  birthDate?: string;
  cpf?: string;
  address?: Address;
  currentPassword?: string;
  cnpj?: string;
  legalName?: string;
  tradeName?: string;
  companyAddress?: Address;
}
