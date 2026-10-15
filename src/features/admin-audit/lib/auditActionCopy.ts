/** Grupos apresentados no filtro de ações, na mesma ordem da navegação do admin.
 * @example auditActionGroups.find((group) => group.id === "owner")?.label // "Tutor"
 */
export const auditActionGroups = [
  { id: "account", label: "Conta" },
  { id: "session", label: "Sessão" },
  { id: "password", label: "Senha" },
  { id: "owner", label: "Tutor" },
  { id: "pet", label: "Pet" },
  { id: "host", label: "Anfitrião" },
  { id: "host_application", label: "Verificação" },
  { id: "listing", label: "Cantinho" },
  { id: "booking", label: "Reserva" },
  { id: "audit", label: "Auditoria" },
  { id: "outros", label: "Outras ações" },
] as const;

type AuditActionGroup = (typeof auditActionGroups)[number]["id"];

const actionLabels: Readonly<Record<string, { label: string; group: AuditActionGroup }>> = {
  "account.registered": { label: "Conta criada", group: "account" },
  "account.deleted": { label: "Conta desfeita", group: "account" },
  "account.profile_updated": { label: "Perfil atualizado", group: "account" },
  "account.deactivated": { label: "Conta desativada", group: "account" },
  "account.reactivated": { label: "Conta reativada", group: "account" },
  "account.suspended": { label: "Conta suspensa", group: "account" },
  "account.suspension_lifted": { label: "Suspensão removida", group: "account" },
  "session.login_succeeded": { label: "Entrada autorizada", group: "session" },
  "session.login_failed": { label: "Entrada recusada", group: "session" },
  "session.switched": { label: "Conta alternada", group: "session" },
  "password.changed": { label: "Senha alterada", group: "password" },
  "password.reset_requested": { label: "Troca de senha solicitada", group: "password" },
  "password.reset_completed": { label: "Troca de senha concluída", group: "password" },
  "owner.registered": { label: "Tutor cadastrado", group: "owner" },
  "owner.updated": { label: "Dados do tutor atualizados", group: "owner" },
  "owner.deactivated": { label: "Tutor desativado", group: "owner" },
  "owner.reactivated": { label: "Tutor reativado", group: "owner" },
  "owner.suspended": { label: "Tutor suspenso", group: "owner" },
  "owner.suspension_lifted": { label: "Suspensão do tutor removida", group: "owner" },
  "owner.cpf_released": { label: "CPF liberado", group: "owner" },
  "owner.viewed": { label: "Dados do tutor consultados", group: "owner" },
  "owner.listed": { label: "Lista de tutores consultada", group: "owner" },
  "pet.registered": { label: "Pet cadastrado", group: "pet" },
  "pet.updated": { label: "Dados do pet atualizados", group: "pet" },
  "pet.deactivated": { label: "Pet desativado", group: "pet" },
  "pet.reactivated": { label: "Pet reativado", group: "pet" },
  "host.updated": { label: "Dados do anfitrião atualizados", group: "host" },
  "host.deactivated": { label: "Anfitrião desativado", group: "host" },
  "host.reactivated": { label: "Anfitrião reativado", group: "host" },
  "host.suspended": { label: "Anfitrião suspenso", group: "host" },
  "host.suspension_lifted": { label: "Suspensão do anfitrião removida", group: "host" },
  "host.identity_released": { label: "Identidade do anfitrião liberada", group: "host" },
  "host.stripe_account_created": { label: "Conta de recebimento criada", group: "host" },
  "host.stripe_payouts_enabled": { label: "Recebimentos liberados", group: "host" },
  "host.stripe_payouts_disabled": { label: "Recebimentos pausados", group: "host" },
  "host.stripe_account_rejected": { label: "Conta de recebimento recusada", group: "host" },
  "host.stripe_account_reset": { label: "Nova tentativa de recebimento liberada", group: "host" },
  "host.stripe_reminder_sent": { label: "Lembrete de recebimento enviado", group: "host" },
  "host.viewed": { label: "Dados do anfitrião consultados", group: "host" },
  "host.listed": { label: "Lista de anfitriões consultada", group: "host" },
  "host_application.started": { label: "Verificação iniciada", group: "host_application" },
  "host_application.updated": { label: "Dados da verificação atualizados", group: "host_application" },
  "host_application.document_uploaded": { label: "Documento enviado", group: "host_application" },
  "host_application.submitted": { label: "Verificação enviada", group: "host_application" },
  "host_application.cancelled": { label: "Verificação cancelada", group: "host_application" },
  "host_application.approved": { label: "Verificação aprovada", group: "host_application" },
  "host_application.rejected": { label: "Verificação recusada", group: "host_application" },
  "host_application.viewed": { label: "Verificação consultada", group: "host_application" },
  "host_application.listed": { label: "Lista de verificações consultada", group: "host_application" },
  "host_application.document_viewed": { label: "Documento consultado", group: "host_application" },
  "host_application.expired": { label: "Verificação vencida", group: "host_application" },
  "host_application.documents_purged": { label: "Documentos apagados", group: "host_application" },
  "listing.created": { label: "Cantinho criado", group: "listing" },
  "listing.updated": { label: "Cantinho atualizado", group: "listing" },
  "listing.deactivated": { label: "Cantinho desativado", group: "listing" },
  "listing.reactivated": { label: "Cantinho reativado", group: "listing" },
  "booking.requested": { label: "Estadia solicitada", group: "booking" },
  "booking.accepted": { label: "Estadia aceita", group: "booking" },
  "booking.declined": { label: "Estadia recusada", group: "booking" },
  "booking.expired": { label: "Pedido de estadia vencido", group: "booking" },
  "booking.cancelled": { label: "Estadia cancelada", group: "booking" },
  "booking.checked_in": { label: "Pet chegou", group: "booking" },
  "booking.checked_out": { label: "Pet voltou pra casa", group: "booking" },
  "audit.searched": { label: "Trilha consultada", group: "audit" },
};

/** Opções do filtro derivadas da lista documentada, agrupáveis pelo campo `group`.
 * @example auditActionOptions.find((option) => option.code === "audit.searched")
 */
export const auditActionOptions = Object.entries(actionLabels).map(([code, value]) => ({ code, ...value }));

/** Traduz ações documentadas; mantém grupo neutro para códigos novos.
 * @example auditActionCopy("owner.suspended") // { label: "Tutor suspenso", group: "owner" }
 */
export function auditActionCopy(code: string): { label: string; group: AuditActionGroup; known: boolean } {
  const known = actionLabels[code];
  return known ? { ...known, known: true } : { label: "Ação não reconhecida", group: "outros", known: false };
}
