import type { AdminOwner } from "@/features/owners";
import type { AdminHost, StripeStatus } from "@/features/hosts";
import { filterText } from "@/shared/lib/text/filterText";
import { accountsCopy } from "./accountsCopy";
/** Abas administrativas, também usadas nas rotas públicas. @example const kind: AccountKind = "owners"; */
export type AccountKind = "owners" | "hosts";
/** Origem discriminada mantém os contratos de owner e host independentes. @example const source: AccountSource = { kind: "owners", value: owner }; */
export type AccountSource = { kind: "owners"; value: AdminOwner } | { kind: "hosts"; value: AdminHost };
/** Linha mínima de apresentação e ações, sem endereço ou telefone na lista. @example const row: AccountRow = toAccountRow({ kind: "owners", value: owner }); */
export interface AccountRow {
  kind: AccountKind;
  id: string;
  userId: string;
  fullName: string;
  email: string;
  cpfDigits: string;
  cnpj?: string;
  status: "active" | "inactive" | "suspended" | "released";
  createdAt: string;
  tradeName?: string;
  personType?: "pf" | "pj";
  stripeStatus?: StripeStatus;
  payoutsEnabled?: boolean;
}
/** Converte sem mutação; identidade liberada prevalece sobre suspensão e inatividade.
 * @example toAccountRow({ kind: "hosts", value: host })
 */
export function toAccountRow(source: AccountSource): AccountRow {
  const account = source.value;
  const released = source.kind === "owners" ? account.cpf == null : Boolean(source.value.identityReleasedAt);
  const suspended = Boolean(account.suspendedAt || account.user?.suspendedAt);
  return {
    kind: source.kind,
    id: account.id,
    userId: account.userId,
    fullName: account.user?.fullName ?? accountsCopy.unavailable,
    email: account.user?.email ?? accountsCopy.unavailable,
    cpfDigits: account.cpf?.replace(/\D/g, "") ?? "",
    status: released
      ? "released"
      : suspended
        ? "suspended"
        : !account.isActive || account.user?.isActive === false
          ? "inactive"
          : "active",
    createdAt: account.createdAt,
    ...(source.kind === "hosts"
      ? {
          cnpj: source.value.company?.cnpj,
          personType: source.value.personType,
          tradeName: source.value.company?.tradeName,
          stripeStatus: source.value.stripeStatus,
          payoutsEnabled: source.value.stripePayoutsEnabled,
        }
      : {}),
  };
}
/** Busca pessoal somente local; CPF só compara se a busca tem dígitos. Não serializar search.
 * @example filterAccounts(rows, "João", "all")
 */
export function filterAccounts(
  rows: readonly AccountRow[],
  search: string,
  status: AccountRow["status"] | "all",
): AccountRow[] {
  const text = filterText(search);
  const digits = search.replace(/\D/g, "");
  return rows.filter(
    (row) =>
      (status === "all" || row.status === status) &&
      (!text ||
        filterText(row.fullName).includes(text) ||
        filterText(row.email).includes(text) ||
        Boolean(digits && /^[\d\s.\-/]+$/.test(search) && row.cpfDigits.includes(digits))),
  );
}
