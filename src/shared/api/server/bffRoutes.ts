import type { HttpMethod } from "../transport/HttpTransport";

export interface BffRoute {
  method: HttpMethod;
  /** Caminho da API sem o prefixo, com `{param}` para um segmento. */
  pattern: string;
}

const route = (method: HttpMethod, pattern: string): BffRoute => ({ method, pattern });

/**
 * Rotas que devolvem tokens. Atendidas pelos handlers de sessão (`app/api/...`), que gravam os cookies;
 * o proxy **nunca** as repassa, senão os tokens chegariam ao navegador (REQ-HTTP-007).
 */
export const sessionOnlyRoutes: readonly BffRoute[] = [
  route("POST", "/auth/sessions/login"),
  route("POST", "/auth/sessions/refresh"),
  route("POST", "/auth/sessions/logout"),
  route("POST", "/auth/sessions/switch"),
  route("POST", "/users/register"),
  route("POST", "/users/me/password"),
  route("POST", "/owners/register"),
  route("POST", "/owners/reactivate"),
  route("POST", "/hosts/reactivate"),
];

/**
 * Lista permitida do proxy `app/api/[...path]` (REQ-HTTP-009). O que não está aqui responde 404.
 * Papéis não são conferidos no BFF: a API é a autoridade de autorização (evita duas regras divergentes).
 * O teste `bffRoutes.test.ts` confere a lista contra o OpenAPI versionado.
 */
export const bffRoutes: readonly BffRoute[] = [
  // Conta e senha
  route("GET", "/users/me"),
  route("GET", "/users/me/accounts"),
  route("POST", "/auth/password/forgot"),
  route("POST", "/auth/password/reset"),

  // Tutor
  route("GET", "/owners/me"),
  route("PATCH", "/owners/me"),
  route("PUT", "/owners/me/avatar"),
  route("DELETE", "/owners/me/avatar"),
  route("POST", "/owners/me/deactivate"),

  // Anfitrião
  route("GET", "/hosts/me"),
  route("PATCH", "/hosts/me"),
  route("PUT", "/hosts/me/avatar"),
  route("DELETE", "/hosts/me/avatar"),
  route("POST", "/hosts/me/deactivate"),
  route("GET", "/hosts/me/application"),
  route("POST", "/hosts/me/application"),
  route("PATCH", "/hosts/me/application"),
  route("DELETE", "/hosts/me/application"),
  route("PUT", "/hosts/me/application/documents"),
  route("POST", "/hosts/me/application/submission"),
  route("GET", "/hosts/{hostId}/pets"),

  // Pets
  route("POST", "/pets"),
  route("GET", "/pets/me"),
  route("GET", "/pets/{petId}"),
  route("PATCH", "/pets/{petId}"),
  route("POST", "/pets/{petId}/deactivation"),
  route("DELETE", "/pets/{petId}/deactivation"),
  route("POST", "/pets/{petId}/photos"),
  route("PATCH", "/pets/{petId}/photos/{photoId}"),
  route("DELETE", "/pets/{petId}/photos/{photoId}"),

  // Admin
  route("GET", "/audit-entries"),
  route("GET", "/hosts"),
  route("GET", "/hosts/{hostId}"),
  route("POST", "/hosts/{hostId}/suspension"),
  route("DELETE", "/hosts/{hostId}/suspension"),
  route("POST", "/hosts/{hostId}/identity-release"),
  route("GET", "/host-applications"),
  route("GET", "/host-applications/{applicationId}"),
  route("GET", "/host-applications/{applicationId}/documents/{kind}"),
  route("POST", "/host-applications/{applicationId}/approval"),
  route("POST", "/host-applications/{applicationId}/rejection"),
  route("GET", "/owners"),
  route("GET", "/owners/{ownerId}"),
  route("POST", "/owners/{ownerId}/suspension"),
  route("DELETE", "/owners/{ownerId}/suspension"),
  route("POST", "/owners/{ownerId}/cpf-release"),
];

/** Parâmetro de rota: ids e palavras simples. Recusa `..`, espaço e barra codificada. */
const PARAM_SEGMENT = /^[A-Za-z0-9_-]+$/;

const compiled = bffRoutes.map((entry) => ({ entry, segments: entry.pattern.split("/").slice(1) }));

/**
 * Procura a rota permitida para `method` + `path` (sem o prefixo da API).
 * @returns a rota, ou `undefined` (o proxy responde 404).
 */
export function matchBffRoute(method: string, path: string): BffRoute | undefined {
  const upper = method.toUpperCase();
  const parts = path.split("/").slice(1);

  return compiled.find(
    ({ entry, segments }) =>
      entry.method === upper &&
      segments.length === parts.length &&
      segments.every((segment, index) =>
        segment.startsWith("{") ? PARAM_SEGMENT.test(parts[index]!) : segment === parts[index],
      ),
  )?.entry;
}
