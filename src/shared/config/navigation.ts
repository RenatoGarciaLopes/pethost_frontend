import type { AccountRole } from "@/shared/auth/contracts/session";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  roles: readonly AccountRole[];
}

/**
 * Atalhos do cabeçalho (spec 004, REQ-SHELL-002): tabela única. Só entram telas que existem; cada spec que
 * cria uma tela de atalho acrescenta a linha dela (020: Meus pets; 030: Minha verificação).
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: "pets", label: "Meus pets", href: "/pets", roles: ["owner"] },
  { id: "host-home", label: "Painel", href: "/host", roles: ["host"] },
  { id: "host-application", label: "Minha verificação", href: "/host/application", roles: ["host"] },
  { id: "host-pets", label: "Pets da casa", href: "/pets", roles: ["host"] },
  { id: "admin-queue", label: "Fila de verificação", href: "/admin/host-applications", roles: ["admin"] },
  { id: "admin-users", label: "Contas", href: "/admin/users", roles: ["admin"] },
  { id: "admin-audit", label: "Auditoria", href: "/admin/audit-entries", roles: ["admin"] },
];

/**
 * Atalhos do papel, na ordem da tabela.
 * @example navItemsFor("owner") // [{ id: "pets", … }]
 */
export function navItemsFor(role: AccountRole): readonly NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
