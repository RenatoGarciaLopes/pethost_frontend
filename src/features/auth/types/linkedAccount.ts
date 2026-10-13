import type { PersonalRole } from "@/shared/auth/contracts/session";

/** Conta pessoal vinculada ao e-mail da sessão, sem credenciais. */
export interface LinkedAccount {
  role: PersonalRole;
  isActive: boolean;
  isCurrent: boolean;
}
