import type { AccountRole } from "@/shared/auth/contracts/session";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  roles: readonly AccountRole[];
  /** Spec que entrega a tela (roadmap). */
  spec: string;
  /** Vira `true` na entrega da spec; antes disso o atalho não aparece (REQ-SHELL-002). */
  available: boolean;
}

/**
 * Tabela única de navegação da casca (spec 004). A ordem aqui é a ordem no cabeçalho.
 * Cada spec que entrega uma tela liga o seu item com `available: true`.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  // Tutor
  { id: "search", label: "Buscar cantinho", href: "/search", roles: ["owner"], spec: "041", available: false },
  { id: "pets", label: "Meus pets", href: "/pets", roles: ["owner"], spec: "020", available: false },
  {
    id: "owner-bookings",
    label: "Minhas estadias",
    href: "/owner/bookings",
    roles: ["owner"],
    spec: "052",
    available: false,
  },

  // Anfitrião
  { id: "host-home", label: "Painel", href: "/host", roles: ["host"], spec: "053", available: false },
  {
    id: "host-application",
    label: "Minha verificação",
    href: "/host/application",
    roles: ["host"],
    spec: "030",
    available: false,
  },
  { id: "host-listing", label: "Meu cantinho", href: "/host/listings", roles: ["host"], spec: "044", available: false },
  { id: "host-pets", label: "Pets da casa", href: "/pets", roles: ["host"], spec: "023", available: false },
  {
    id: "host-requests",
    label: "Pedidos",
    href: "/host/booking-requests",
    roles: ["host"],
    spec: "053",
    available: false,
  },
  { id: "host-payouts", label: "Ganhos", href: "/host/payouts", roles: ["host"], spec: "057", available: false },

  // Os dois
  {
    id: "conversations",
    label: "Conversas",
    href: "/conversations",
    roles: ["owner", "host"],
    spec: "055",
    available: false,
  },

  // Admin
  {
    id: "admin-queue",
    label: "Verificações",
    href: "/admin/host-applications",
    roles: ["admin"],
    spec: "031",
    available: false,
  },
  { id: "admin-users", label: "Contas", href: "/admin/users", roles: ["admin"], spec: "032", available: false },
  {
    id: "admin-audit",
    label: "Auditoria",
    href: "/admin/audit-entries",
    roles: ["admin"],
    spec: "033",
    available: false,
  },
];

/** Atalhos visíveis para o papel, só das telas já entregues. */
export function navItemsFor(role: AccountRole, items: readonly NavItem[] = NAV_ITEMS): NavItem[] {
  return items.filter((item) => item.available && item.roles.includes(role));
}
