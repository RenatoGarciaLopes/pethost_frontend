import type { AccountRole } from "@/shared/auth/contracts/session";

const LABELS = { owner: "tutor", host: "anfitrião", admin: "admin" } as const;

/**
 * Nome neutro do papel para texto e acessibilidade, independente de cor (REQ-SWITCH-002).
 * @example roleLabel("host") // "anfitrião"
 */
export function roleLabel(role: AccountRole): "tutor" | "anfitrião" | "admin" {
  return LABELS[role];
}
