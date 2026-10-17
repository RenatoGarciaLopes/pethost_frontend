const routes: Readonly<Record<string, (id: string) => string>> = {
  owner: (id) => `/admin/users/owners/${encodeURIComponent(id)}`,
  host: (id) => `/admin/users/hosts/${encodeURIComponent(id)}`,
  host_application: (id) => `/admin/host-applications/${encodeURIComponent(id)}`,
};

/** Retorna detalhe apenas para alvos com tela definida; desconhecidos seguem filtráveis.
 * @example auditTargetLink("host_application", applicationId) // "/admin/host-applications/{id}"
 */
export function auditTargetLink(targetType: string, targetId: string | null | undefined): string | null {
  if (!targetId) return null;
  return routes[targetType]?.(targetId) ?? null;
}

/** Link compartilhável para a trilha completa de um alvo.
 * @example auditTargetFilterHref("owner", ownerId) // "/admin/audit-entries?targetType=owner&targetId={id}"
 */
export function auditTargetFilterHref(targetType: string, targetId: string): string {
  const params = new URLSearchParams({ targetType, targetId });
  return `/admin/audit-entries?${params.toString()}`;
}

/** Link compartilhável para os registros de uma pessoa que agiu.
 * @example auditActorFilterHref(actorId) // "/admin/audit-entries?actorId={id}"
 */
export function auditActorFilterHref(actorId: string): string {
  return `/admin/audit-entries?${new URLSearchParams({ actorId }).toString()}`;
}
